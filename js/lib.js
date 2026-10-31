// ============================================================
// Petits utilitaires : templates HTML sûrs, icônes, dates, retours sensoriels
// ============================================================

const RAW = Symbol('raw');

export const raw = (s) => ({ [RAW]: true, s: String(s ?? '') });

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

const toStr = (v) => {
  if (v == null || v === false || v === true) return '';
  if (Array.isArray(v)) return v.map(toStr).join('');
  if (typeof v === 'object' && v[RAW]) return v.s;
  return esc(v);
};

// html`<p>${userText}</p>` échappe automatiquement ; les fragments html imbriqués passent tels quels.
export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += toStr(vals[i]) + strings[i + 1];
  return raw(out);
}
export const render = (v) => toStr(v);

// ---------- Icônes (traits 24×24) ----------
const P = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M2.5 20h19"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  waves: '<path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 16c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  swim: '<circle cx="17" cy="6" r="1.8"/><path d="M6 13l4-4 3 3 3-2M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/>',
  mountain: '<path d="M3 20l6.5-11 4 6.5 2-3L21 20H3z"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5h6v2.5M3.5 13h17"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M7.5 5h3v14h-3zM13.5 5h3v14h-3z" fill="currentColor" stroke="none"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  flame: '<path d="M12 21a6 6 0 006-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 006 6z"/>',
  swap: '<path d="M7 7.5h12l-3.5-3.5M17 16.5H5l3.5 3.5"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  skip: '<path d="M6 6l8 6-8 6zM18 6v12"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 10a4.5 4.5 0 017 0M12 11.5l1.8-2.5"/>',
  heart: '<path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0112 7.5 4.3 4.3 0 0119.5 10c0 5.5-7.5 10-7.5 10z"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'
};

export const icon = (name, cls = '') =>
  raw(`<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.spark}</svg>`);

// ---------- Dates (toujours en heure locale) ----------
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const startOfWeek = (d = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  const dow = (x.getDay() + 6) % 7; // lundi = 0
  return addDays(x, -dow);
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const fmtLong = (d = new Date()) => cap(new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
export const fmtShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
export const fmtTime = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
export const fmtDayLabel = (key) => {
  const today = dayKey();
  if (key === today) return 'Aujourd’hui';
  if (key === dayKey(addDays(new Date(), -1))) return 'Hier';
  return cap(fromKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
};
export const fmtClock = (sec) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};
export const fmtNum = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

// ---------- Retours sensoriels ----------
let audioCtx = null;
export const feedback = {
  settings: { sound: true, haptics: true, voice: false },

  unlock() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* ignore */ }
  },

  tone(freq = 660, dur = 0.25, type = 'sine') {
    if (!this.settings.sound) return;
    try {
      this.unlock();
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch (e) { /* ignore */ }
  },

  buzz(pattern = 30) {
    if (!this.settings.haptics) return;
    try { navigator.vibrate?.(pattern); } catch (e) { /* ignore */ }
  },

  say(text) {
    if (!this.settings.voice || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR';
      u.rate = 1.05;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  },

  // Raccourcis sémantiques
  tap() { this.buzz(12); },
  success() { this.tone(660, 0.18); setTimeout(() => this.tone(880, 0.3), 120); this.buzz([30, 60, 30]); },
  phase() { this.tone(740, 0.35, 'triangle'); this.buzz([60, 40, 60]); },
  countdown() { this.tone(440, 0.12); }
};

export const uid = (p = 'w') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------- Toast (conteneur séparé pour ne jamais effacer un formulaire) ----------
let toastTimer = null;
export function toast(msg, tone = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show ${tone}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}
