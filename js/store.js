// ============================================================
// État de l'application + persistance localStorage
// Les clés historiques (v10) sont conservées : aucune donnée perdue.
// ============================================================

import { KINDS, TYPES, GOALS } from './data.js';
import { dayKey, addDays, startOfWeek, uid } from './lib.js';

const K = {
  workouts: 'health_os_workouts_v10',
  lifts: 'health_os_lifts_v1',
  bodyweight: 'health_os_bodyweight',
  weightLog: 'health_os_weight_log_v1',
  nextGym: 'health_os_next_gym',
  checkin: 'health_os_checkin_today',
  settings: 'health_os_settings_v11',
  chat: 'health_os_chat_v1',
  active: 'health_os_active_session_v1',
  // anciennes clés de réglages
  theme: 'health_os_theme_v10',
  sound: 'health_os_sound_v10',
  voice: 'health_os_voice_v10',
  haptics: 'health_os_haptics_v10',
  gemini: 'health_os_gemini_api_key'
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
};
const readRaw = (key) => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* quota / privé */ }
};
const remove = (key) => {
  try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
};

function loadSettings() {
  const saved = read(K.settings, null);
  const defaults = {
    theme: 'auto',
    sound: true,
    haptics: true,
    voice: false,
    restSec: 45,
    rowerLevel: 1,
    geminiKey: '',
    geminiModel: 'gemini-2.5-flash'
  };
  if (saved) return { ...defaults, ...saved };
  // Migration depuis les anciennes clés
  const legacyTheme = readRaw(K.theme);
  return {
    ...defaults,
    theme: legacyTheme === 'light' || legacyTheme === 'dark' ? legacyTheme : 'auto',
    sound: readRaw(K.sound) !== 'false',
    voice: readRaw(K.voice) === 'true',
    haptics: readRaw(K.haptics) !== 'false',
    geminiKey: readRaw(K.gemini) || ''
  };
}

function loadCheckin() {
  const c = read(K.checkin, null);
  // Les anciennes versions stockaient la date en UTC ; on compare les deux.
  const today = dayKey();
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (c && (c.date === today || c.date === todayUtc) && c.status) return { date: today, status: c.status };
  return { date: today, status: null };
}

export const S = {
  tab: 'today',
  workouts: (() => { const w = read(K.workouts, []); return Array.isArray(w) ? w : []; })(),
  lifts: read(K.lifts, {}) || {},
  bodyweight: Number(readRaw(K.bodyweight)) || 78,
  weightLog: read(K.weightLog, []) || [],
  nextGym: readRaw(K.nextGym) === 'B' ? 'B' : 'A',
  checkin: loadCheckin(),
  settings: loadSettings(),
  chat: { messages: read(K.chat, []) || [], loading: false, draft: '' },
  runner: read(K.active, null),
  sheet: null,
  open: {}, // accordéons ouverts
  historyLimit: 20
};

// Trie l'historique du plus récent au plus ancien
S.workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

export function persist() {
  write(K.workouts, S.workouts);
  write(K.lifts, S.lifts);
  try { localStorage.setItem(K.bodyweight, String(S.bodyweight)); } catch (e) { /* ignore */ }
  write(K.weightLog, S.weightLog);
  try { localStorage.setItem(K.nextGym, S.nextGym); } catch (e) { /* ignore */ }
  write(K.checkin, S.checkin);
  write(K.settings, S.settings);
  write(K.chat, S.chat.messages.slice(-40));
  if (S.runner) write(K.active, S.runner); else remove(K.active);
}

let renderer = () => {};
export const setRenderer = (fn) => { renderer = fn; };
/** Sauvegarde puis redessine. */
export function commit() { persist(); renderer(); }

export function addWorkout(fields, date = new Date()) {
  const w = { id: uid(fields.kind || 'w'), date: new Date(date).toISOString(), ...fields };
  S.workouts.unshift(w);
  S.workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return w;
}

export function exportData() {
  return {
    app: 'health-os',
    version: 11,
    exportedAt: new Date().toISOString(),
    workouts: S.workouts,
    lifts: S.lifts,
    bodyweight: S.bodyweight,
    weightLog: S.weightLog,
    nextGym: S.nextGym,
    settings: { ...S.settings, geminiKey: '' }
  };
}

export function importData(data) {
  // Ancien format : un simple tableau de séances
  if (Array.isArray(data)) {
    S.workouts = data;
  } else if (data && Array.isArray(data.workouts)) {
    S.workouts = data.workouts;
    if (data.lifts && typeof data.lifts === 'object') S.lifts = data.lifts;
    if (Number(data.bodyweight)) S.bodyweight = Number(data.bodyweight);
    if (Array.isArray(data.weightLog)) S.weightLog = data.weightLog;
    if (data.nextGym === 'A' || data.nextGym === 'B') S.nextGym = data.nextGym;
    if (data.settings) S.settings = { ...S.settings, ...data.settings, geminiKey: S.settings.geminiKey };
  } else {
    throw new Error('Format inconnu');
  }
  S.workouts = S.workouts.filter((w) => w && w.date && !isNaN(new Date(w.date)));
  S.workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return S.workouts.length;
}

export function resetAll() {
  S.workouts = [];
  S.lifts = {};
  S.weightLog = [];
  S.nextGym = 'A';
  S.chat.messages = [];
  S.runner = null;
}

// ============================================================
// Dérivés : nature d'une séance, titres, semaines, objectifs
// ============================================================

export function kindOf(w) {
  if (w.kind && KINDS[w.kind]) return w.kind;
  const notes = (w.notes || '').toLowerCase();
  switch (w.type) {
    case 'WORK_GYM':
      if (/muscu a\b|workout a\b/.test(notes)) return 'gym_a';
      if (/muscu b\b|workout b\b/.test(notes)) return 'gym_b';
      return 'gym';
    case 'CONCEPT2': return 'rower';
    case 'CORE_SHIELD': return notes.includes('bureau') ? 'desk' : 'floor';
    case 'SWIM': return 'swim';
    case 'HIKE': return 'hike';
    default: return 'other';
  }
}

export const typeOf = (w) => TYPES[w.type] ? w.type : (KINDS[kindOf(w)]?.type || 'OTHER');
export const metaOf = (w) => TYPES[typeOf(w)];
export const titleOf = (w) => w.title || KINDS[kindOf(w)]?.title || 'Séance';

export function byDay(workouts = S.workouts) {
  const map = new Map();
  for (const w of workouts) {
    const k = dayKey(w.date);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(w);
  }
  return map;
}

export function streak() {
  const days = byDay();
  let d = new Date();
  if (!days.has(dayKey(d))) d = addDays(d, -1);
  let n = 0;
  while (days.has(dayKey(d))) { n++; d = addDays(d, -1); }
  return n;
}

export function weekInfo(ref = new Date()) {
  const mon = startOfWeek(ref);
  const days = byDay();
  const today = dayKey();
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return labels.map((label, i) => {
    const d = addDays(mon, i);
    const key = dayKey(d);
    const items = days.get(key) || [];
    const tones = [...new Set(items.map((w) => metaOf(w).tone))];
    return { label, key, num: d.getDate(), isToday: key === today, isFuture: key > today, items, tones };
  });
}

export function goalProgress(ref = new Date()) {
  const week = weekInfo(ref);
  const all = week.flatMap((d) => d.items);
  const counts = {
    gym: all.filter((w) => typeOf(w) === 'WORK_GYM').length,
    row: all.filter((w) => typeOf(w) === 'CONCEPT2').length,
    floor: week.filter((d) => d.items.some((w) => kindOf(w) === 'floor')).length
  };
  return GOALS.map((g) => ({ ...g, done: counts[g.id] }));
}

export const doneToday = (kind) =>
  S.workouts.some((w) => dayKey(w.date) === dayKey() && (kind === 'gym' ? typeOf(w) === 'WORK_GYM' : kindOf(w) === kind));
