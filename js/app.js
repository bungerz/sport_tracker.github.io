// ============================================================
// Health OS — point d'entrée : rendu, actions, cycle de vie
// ============================================================

import { S, commit, persist, setRenderer, addWorkout, exportData, importData, resetAll } from './store.js';
import { WORKOUTS, ROUTINES, QUICK_ADD, KINDS } from './data.js';
import { render, feedback, toast, dayKey, fromKey, clamp } from './lib.js';
import { todayView, planView, progressView, profileView, tabbar, sheetView } from './views.js';
import { startRunner, runnerAction, runnerTick, runnerView, runnerTitle } from './runners.js';
import { askCoach, parseTicket, ticketToWorkout } from './coach.js';

const root = document.getElementById('app');
const VIEWS = { today: todayView, plan: planView, progress: progressView, profile: profileView };

// ---------- Thème ----------
const media = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.settings.theme;
  const dark = t === 'dark' || (t === 'auto' && media.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121614' : '#f4f2ee');
}
media.addEventListener?.('change', applyTheme);

// ---------- Rendu ----------
function draw() {
  applyTheme();
  Object.assign(feedback.settings, { sound: S.settings.sound, haptics: S.settings.haptics, voice: S.settings.voice });
  const runner = runnerView();
  const inRunner = !!runner;
  document.body.classList.toggle('lock', inRunner || !!S.sheet);
  if (inRunner) {
    root.innerHTML = render(runner);
  } else {
    root.innerHTML = `<main class="page" id="page">${render(VIEWS[S.tab]())}</main>${render(tabbar())}${render(sheetView())}`;
    if (S.sheet?.type === 'chat') {
      const el = document.getElementById('chat-scroll');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }
  syncWakeLock(inRunner);
  syncTicker();
}
setRenderer(draw);

// ---------- Wake lock (écran allumé pendant une séance) ----------
let wakeLock = null;
async function syncWakeLock(want) {
  try {
    if (want && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (e) { wakeLock = null; }
}

// ---------- Horloge des minuteurs ----------
let ticker = null;
function syncTicker() {
  const need = S.runner && !S.runner.hidden;
  if (need && !ticker) {
    ticker = setInterval(() => {
      if (runnerTick()) commit();
    }, 250);
  } else if (!need && ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Nouveau jour depuis la dernière ouverture ? on réinitialise le check-in
    if (S.checkin.date !== dayKey()) S.checkin = { date: dayKey(), status: null };
    if (S.runner && !S.runner.hidden && runnerTick()) persist();
    draw();
  } else {
    persist();
  }
});

// ---------- Actions ----------
const actions = {
  tab(v) {
    if (S.tab === v) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    S.tab = v;
    S.sheet = null;
    commit();
    window.scrollTo(0, 0);
  },
  sheet(v) {
    S.sheet = v === 'add' ? { type: 'add', kind: QUICK_ADD[0].kind } : { type: v };
    commit();
  },
  close() { S.sheet = null; commit(); },
  toggle(v) { S.open[v] = !S.open[v]; commit(); },

  checkin(v) {
    S.checkin = { date: dayKey(), status: S.checkin.status === v ? null : v };
    feedback.tap();
    feedback.tone(v === 'good' ? 660 : v === 'medium' ? 523 : 392, 0.18);
    commit();
  },
  swapGym() { S.nextGym = S.nextGym === 'A' ? 'B' : 'A'; feedback.tap(); commit(); },

  start(v) {
    if (S.runner && !confirm(`Une séance est déjà en cours (${runnerTitle(S.runner)}). La remplacer ?`)) return;
    S.sheet = null;
    startRunner(v);
    commit();
  },
  resume() { if (S.runner) { S.runner.hidden = false; feedback.unlock(); commit(); } },

  quick(v) {
    let w;
    if (v === 'gym') {
      const wk = WORKOUTS[S.nextGym];
      w = addWorkout({ type: 'WORK_GYM', kind: wk.kind, title: wk.title, durationMin: wk.minutes, notes: 'Validée en 1 tap' });
      S.nextGym = S.nextGym === 'A' ? 'B' : 'A';
      toast(`${wk.title} enregistrée · prochaine : Muscu ${S.nextGym}`, 'ok');
    } else if (v === 'rower') {
      w = addWorkout({ type: 'CONCEPT2', kind: 'rower', title: 'Rameur Rebuild', durationMin: 23, notes: '10 × 1′ ON / 1′ OFF · validé en 1 tap' });
      toast('Finisher rameur enregistré', 'ok');
    } else if (ROUTINES[v]) {
      const r = ROUTINES[v];
      w = addWorkout({ type: 'CORE_SHIELD', kind: r.kind, title: r.title, durationMin: r.minutes, notes: 'Validée en 1 tap' });
      toast(`${r.title} validée`, 'ok');
    }
    if (w) { feedback.success(); commit(); }
  },

  addKind(v) { S.sheet = { type: 'add', kind: v }; commit(); },
  entry(v) { S.sheet = { type: 'entry', id: v }; commit(); },
  delete(v) {
    if (!confirm('Supprimer cette séance ?')) return;
    S.workouts = S.workouts.filter((w) => w.id !== v);
    S.sheet = null;
    toast('Séance supprimée');
    commit();
  },
  more() { S.historyLimit += 30; commit(); },

  bw(v) { S.bodyweight = clamp(Math.round((S.bodyweight + Number(v)) * 2) / 2, 35, 250); commit(); },
  logWeight() {
    const today = dayKey();
    S.weightLog = S.weightLog.filter((e) => e.date !== today);
    S.weightLog.push({ date: today, kg: S.bodyweight });
    S.weightLog.sort((a, b) => (a.date < b.date ? -1 : 1));
    feedback.success();
    toast(`Pesée enregistrée : ${S.bodyweight.toLocaleString('fr-FR')} kg`, 'ok');
    commit();
  },
  setLevel(v) { S.settings.rowerLevel = Number(v); feedback.tap(); commit(); },
  gotoLevels() { S.tab = 'plan'; S.open.levels = true; commit(); window.scrollTo(0, 0); },

  rest(v) { S.settings.restSec = Number(v); commit(); },
  theme(v) { S.settings.theme = v; commit(); },
  tSound() { S.settings.sound = !S.settings.sound; commit(); if (S.settings.sound) { feedback.settings.sound = true; feedback.tone(660, 0.2); } },
  tHaptics() { S.settings.haptics = !S.settings.haptics; commit(); feedback.buzz(30); },
  tVoice() { S.settings.voice = !S.settings.voice; commit(); feedback.say('Annonces vocales activées.'); },

  export() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `health-os-${dayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sauvegarde exportée');
  },
  wipe() {
    if (!confirm('Effacer TOUT l’historique, les charges et les pesées ? Pense à exporter avant.')) return;
    resetAll();
    toast('Données effacées');
    commit();
  },

  chatAsk(v) { sendChat(v); },
  chatClear() { S.chat.messages = []; commit(); },
  ticket(v) {
    const m = S.chat.messages[Number(v)];
    const t = m && parseTicket(m.text);
    if (!t || m.saved) return;
    addWorkout(ticketToWorkout(t));
    m.saved = true;
    feedback.success();
    toast(`${t.title} enregistrée`, 'ok');
    commit();
  }
};

async function sendChat(q) {
  q = (q || '').trim();
  if (!q || S.chat.loading || !S.settings.geminiKey) return;
  S.chat.messages.push({ role: 'user', text: q });
  S.chat.draft = '';
  S.chat.loading = true;
  commit();
  try {
    const text = await askCoach(q);
    S.chat.messages.push({ role: 'ai', text });
  } catch (e) {
    S.chat.messages.push({ role: 'ai', text: e.message || 'Erreur inconnue.', error: true });
  }
  S.chat.loading = false;
  commit();
}

// ---------- Délégation d'événements ----------
root.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act;
  const v = el.dataset.v;
  feedback.unlock();
  if (act.startsWith('r:')) return runnerAction(act.slice(2), v);
  const fn = actions[act];
  if (fn) { e.preventDefault(); fn(v, el); }
});

root.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const kind = form.dataset.form;

  if (kind === 'add') {
    const k = KINDS[data.kind] || KINDS.other;
    const opt = QUICK_ADD.find((q) => q.kind === data.kind) || {};
    const minutes = clamp(Number(data.minutes) || opt.minutes || 30, 1, 600);
    const fields = { type: k.type, kind: data.kind, title: opt.label || k.title, durationMin: minutes };
    if (data.notes) fields.notes = data.notes.trim();
    if (data.distance) { fields.distance = Number(data.distance); fields.distUnit = data.distUnit; }
    if (data.watts) { fields.watts = Number(data.watts); fields.cadence = Number(data.spm) || undefined; if (fields.cadence) fields.spi = (fields.watts / fields.cadence).toFixed(2); }
    // Date choisie : on garde l'heure actuelle si c'est aujourd'hui, sinon midi
    let date = new Date();
    if (data.day && data.day !== dayKey()) date = fromKey(data.day);
    addWorkout(fields, date);
    S.sheet = null;
    feedback.success();
    toast(`${fields.title} enregistrée`, 'ok');
    commit();
  }

  if (kind === 'ai') {
    S.settings.geminiKey = (data.key || '').trim();
    S.settings.geminiModel = (data.model || '').trim() || 'gemini-2.5-flash';
    toast(S.settings.geminiKey ? 'Coach IA configuré' : 'Clé supprimée', 'ok');
    commit();
  }

  if (kind === 'chat') sendChat(data.q);
});

root.addEventListener('input', (e) => {
  if (e.target.dataset.input === 'draft') S.chat.draft = e.target.value; // pas de rendu : on ne perd pas la saisie
});

root.addEventListener('change', (e) => {
  if (e.target.dataset.input !== 'import') return;
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const n = importData(JSON.parse(reader.result));
      toast(`${n} séances importées`, 'ok');
      commit();
    } catch (err) {
      toast('Fichier invalide : import annulé', 'err');
    }
  };
  reader.readAsText(file);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.sheet) actions.close();
});

// ---------- Démarrage ----------
if (S.runner) {
  // Séance récente : on y retourne directement ; ancienne : bannière « reprendre »
  const fresh = Date.now() - (S.runner.startedAt || 0) < 3 * 3600 * 1000;
  S.runner.hidden = !fresh;
  if (!fresh && S.runner.kind !== 'gym') S.runner = null;
}
draw();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
