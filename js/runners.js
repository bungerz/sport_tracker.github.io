// ============================================================
// Modes plein écran : séance muscu, intervalles rameur, routines guidées
// Les minuteurs reposent sur des horodatages : ils restent justes
// même si l'écran se verrouille ou si l'app est rechargée.
// ============================================================

import { WORKOUTS, ROWER, ROUTINES } from './data.js';
import { html, raw, icon, fmtClock, fmtNum, uid, feedback, toast, clamp } from './lib.js';
import { S, commit, addWorkout } from './store.js';
import { buildSequence, nextTarget, adaptAfterSet, fmtLoad, repsLabel } from './engine.js';

const TRANSITION_SEC = 20;
const now = () => Date.now();

// ------------------------------------------------------------
// Démarrage
// ------------------------------------------------------------

export function startRunner(key) {
  feedback.unlock();
  if (key === 'gym' || key === 'gym-short' || key === 'gym-A' || key === 'gym-B') {
    const workoutId = key === 'gym-A' ? 'A' : key === 'gym-B' ? 'B' : S.nextGym;
    S.runner = {
      kind: 'gym', workoutId, short: key === 'gym-short', idx: 0, done: [],
      startedAt: now(), phase: 'work', restEnd: 0, restTotal: 0,
      alt: {}, sessionId: uid('s'), showCue: true
    };
    prepareStep(S.runner, true);
  } else if (key === 'rower') {
    S.runner = { kind: 'rower', seg: 0, segEnd: now() + ROWER.warmupSec * 1000, paused: false, left: 0, startedAt: now(), phase: 'run', watts: 130, spm: 22 };
    feedback.say('Échauffement pieds libres, 3 minutes, damper 3 à 4.');
  } else if (ROUTINES[key]) {
    S.runner = { kind: 'routine', id: key, idx: 0, done: {}, timerEnd: 0, timerTotal: 0, startedAt: now() };
  }
  if (S.runner) { S.runner.hidden = false; feedback.tap(); }
}

export const runnerTitle = (r) =>
  r.kind === 'gym' ? WORKOUTS[r.workoutId].title : r.kind === 'rower' ? ROWER.title : ROUTINES[r.id].title;

// ------------------------------------------------------------
// MUSCU
// ------------------------------------------------------------

function prepareStep(r, announce) {
  const seq = buildSequence(r.workoutId, r.short);
  const step = seq[r.idx];
  if (!step) return;
  const ex = step.ex;
  const prev = r.done.filter((s) => s.exerciseId === ex.id);
  const t = prev.length
    ? { ...adaptAfterSet(ex, prev[prev.length - 1]), status: 'intra' }
    : nextTarget(ex, S.lifts, S.checkin.status, S.bodyweight);
  r.weight = t.weight;
  r.reps = t.reps;
  r.why = t.why;
  r.status = t.status;
  if (announce) {
    const load = ex.increment ? `à ${t.weight} kilos` : 'au poids du corps';
    feedback.say(`${step.set === 1 ? ex.name : 'Série ' + step.set}. ${t.reps} ${ex.timed ? 'secondes' : 'répétitions'} ${load}.`);
  }
}

function finishGymSet(r, feel) {
  const seq = buildSequence(r.workoutId, r.short);
  const step = seq[r.idx];
  r.done.push({
    exerciseId: step.ex.id,
    name: r.alt[step.ex.id] && step.ex.alternative ? step.ex.alternative : step.ex.name,
    setNum: step.set,
    weight: step.ex.increment ? r.weight : 0,
    reps: r.reps,
    feel,
    ...(r.alt[step.ex.id] ? { alt: true } : {})
  });
  feedback.tone(feel === 'hard' ? 392 : feel === 'easy' ? 784 : 587, 0.2);
  feedback.buzz(25);

  if (r.idx >= seq.length - 1) {
    r.phase = 'summary';
    r.endedAt = now();
    feedback.success();
    feedback.say('Séance terminée. Bravo.');
    return;
  }
  const next = seq[r.idx + 1];
  const transition = next.pair === step.pair && next.set === step.set;
  const sec = transition ? TRANSITION_SEC : S.settings.restSec;
  r.idx += 1;
  prepareStep(r, false);
  r.phase = 'rest';
  r.restTransition = transition;
  r.restTotal = sec;
  r.restEnd = now() + sec * 1000;
  r.lastBeep = 0;
}

function saveGym(r) {
  const w = WORKOUTS[r.workoutId];
  const counted = r.done.filter((s) => {
    const ex = buildSequence(r.workoutId, false).find((x) => x.ex.id === s.exerciseId)?.ex;
    return ex && ex.increment && !ex.timed;
  });
  const volume = counted.reduce((a, s) => a + s.weight * s.reps, 0);
  const durationMin = Math.max(1, Math.round(((r.endedAt || now()) - r.startedAt) / 60000));
  const date = new Date();
  addWorkout({
    type: 'WORK_GYM', kind: w.kind, title: w.title + (r.short ? ' · express' : ''),
    durationMin, volume, sets: r.done,
    notes: `${r.done.length} séries${r.short ? ' · format 20 min' : ''}`
  }, date);
  // Historique par exercice (plus récent d'abord, ordre conservé dans la séance)
  for (const s of r.done) {
    if (s.alt) continue; // l'alternative ne pilote pas la progression de l'exercice principal
    (S.lifts[s.exerciseId] = S.lifts[s.exerciseId] || []).unshift({
      date: date.toISOString(), sessionId: r.sessionId, set: s.setNum, weight: s.weight, reps: s.reps, feel: s.feel
    });
    S.lifts[s.exerciseId] = S.lifts[s.exerciseId].slice(0, 300);
  }
  S.nextGym = r.workoutId === 'A' ? 'B' : 'A';
  S.runner = null;
  feedback.success();
  toast(`Séance enregistrée${volume ? ` · ${fmtNum(volume)} kg soulevés` : ''}`, 'ok');
}

// ------------------------------------------------------------
// RAMEUR
// ------------------------------------------------------------

const ROWER_SEGS = (() => {
  const segs = [{ type: 'warmup', sec: ROWER.warmupSec, round: 0 }];
  for (let i = 1; i <= ROWER.rounds; i++) {
    segs.push({ type: 'work', sec: ROWER.workSec, round: i });
    if (i < ROWER.rounds) segs.push({ type: 'rest', sec: ROWER.restSec, round: i });
  }
  return segs;
})();

function announceSeg(seg) {
  feedback.phase();
  if (seg.type === 'work') feedback.say(`Round ${seg.round}. ${ROWER.targetWatts.replace('–', ' à ')}, cadence 22 à 24.`);
  else if (seg.type === 'rest') feedback.say('Repos. Relâche les épaules.');
}

function advanceRower(r, skip = false) {
  r.seg += 1;
  if (r.seg >= ROWER_SEGS.length) {
    r.phase = 'done';
    r.endedAt = now();
    feedback.success();
    feedback.say('Intervalles terminés. Bravo.');
    return;
  }
  const seg = ROWER_SEGS[r.seg];
  const base = skip || r.paused ? now() : r.segEnd;
  r.segEnd = base + seg.sec * 1000;
  if (r.paused) r.left = seg.sec;
  announceSeg(seg);
}

function saveRower(r) {
  const watts = Number(r.watts) || 0;
  const spm = Number(r.spm) || 0;
  const durationMin = Math.max(1, Math.round(((r.endedAt || now()) - r.startedAt) / 60000));
  const rounds = ROWER_SEGS.slice(0, Math.min(r.seg + 1, ROWER_SEGS.length)).filter((s) => s.type === 'work').length;
  addWorkout({
    type: 'CONCEPT2', kind: 'rower', title: 'Rameur Rebuild',
    durationMin, watts, cadence: spm, spi: spm ? (watts / spm).toFixed(2) : undefined,
    notes: `${Math.min(rounds, ROWER.rounds)} × 1′ ON / 1′ OFF · damper 3–4`
  });
  S.runner = null;
  feedback.success();
  toast('Intervalles rameur enregistrés', 'ok');
}

// ------------------------------------------------------------
// ROUTINES
// ------------------------------------------------------------

const holdsOf = (step) => step.sets * (step.sides ? 2 : 1);
const holdLabel = (step, h) => {
  if (!step.sides) return `Série ${h + 1}`;
  return `${h % 2 === 0 ? 'Côté gauche' : 'Côté droit'}${step.sets > 1 ? ` · série ${Math.floor(h / 2) + 1}` : ''}`;
};

function saveRoutine(r) {
  const rt = ROUTINES[r.id];
  const durationMin = Math.max(rt.minutes, Math.round((now() - r.startedAt) / 60000));
  addWorkout({ type: 'CORE_SHIELD', kind: rt.kind, title: rt.title, durationMin, notes: rt.steps.map((s) => s.name).join(', ') });
  S.runner = null;
  feedback.success();
  toast(`${rt.title} validée`, 'ok');
}

// ------------------------------------------------------------
// Actions (déclenchées via data-act="r:…")
// ------------------------------------------------------------

export function runnerAction(act, v) {
  const r = S.runner;
  if (!r) return;
  feedback.unlock();

  // Communes
  if (act === 'min') { r.hidden = true; return commit(); }
  if (act === 'discard') {
    if (confirm('Abandonner cette séance sans l’enregistrer ?')) { S.runner = null; commit(); }
    return;
  }

  if (r.kind === 'gym') {
    const seq = buildSequence(r.workoutId, r.short);
    const ex = seq[r.idx]?.ex;
    switch (act) {
      case 'w': r.weight = Math.max(0, +(r.weight + Number(v) * ex.increment).toFixed(2)); feedback.tap(); break;
      case 'reps': r.reps = clamp(r.reps + Number(v), 1, 300); feedback.tap(); break;
      case 'feel': finishGymSet(r, v); break;
      case 'restAdd': r.restEnd += 15000; r.restTotal += 15; break;
      case 'restSkip': r.phase = 'work'; feedback.tap(); break;
      case 'alt': r.alt[ex.id] = !r.alt[ex.id]; break;
      case 'cue': r.showCue = !r.showCue; break;
      case 'skip':
        if (r.idx >= seq.length - 1) { r.phase = 'summary'; r.endedAt = now(); }
        else { r.idx += 1; prepareStep(r, true); r.phase = 'work'; }
        break;
      case 'undo': {
        const last = r.done.pop();
        if (!last) break;
        const i = seq.findIndex((s) => s.ex.id === last.exerciseId && s.set === last.setNum);
        r.idx = i >= 0 ? i : Math.max(0, r.idx - 1);
        r.weight = last.weight; r.reps = last.reps; r.why = 'Série annulée : corrige puis valide à nouveau'; r.status = 'intra';
        r.phase = 'work';
        break;
      }
      case 'end':
        if (!r.done.length) { if (confirm('Aucune série validée. Quitter la séance ?')) S.runner = null; break; }
        r.phase = 'summary'; r.endedAt = now();
        break;
      case 'back': r.phase = 'work'; r.endedAt = 0; break;
      case 'save': saveGym(r); break;
    }
    return commit();
  }

  if (r.kind === 'rower') {
    switch (act) {
      case 'pause':
        if (r.paused) { r.segEnd = now() + r.left * 1000; r.paused = false; }
        else { r.left = Math.max(0, (r.segEnd - now()) / 1000); r.paused = true; }
        feedback.tap();
        break;
      case 'next': advanceRower(r, true); break;
      case 'end': r.phase = 'done'; r.endedAt = now(); break;
      case 'resume': r.phase = 'run'; r.endedAt = 0; if (r.seg >= ROWER_SEGS.length) r.seg = ROWER_SEGS.length - 1; r.segEnd = now() + ROWER_SEGS[r.seg].sec * 1000; r.paused = false; break;
      case 'watts': r.watts = clamp(r.watts + Number(v), 0, 600); break;
      case 'spm': r.spm = clamp(r.spm + Number(v), 0, 50); break;
      case 'save': saveRower(r); break;
    }
    return commit();
  }

  if (r.kind === 'routine') {
    const rt = ROUTINES[r.id];
    const step = rt.steps[r.idx];
    const total = holdsOf(step);
    const n = r.done[r.idx] || 0;
    switch (act) {
      case 'hold': {
        const h = Number(v);
        r.done[r.idx] = h < n ? h : h + 1;
        feedback.tap();
        break;
      }
      case 'timer':
        if (r.timerEnd) { r.timerEnd = 0; }
        else if (n < total) { r.timerTotal = step.timerSec; r.timerEnd = now() + step.timerSec * 1000; r.lastBeep = 0; feedback.tone(660, 0.15); }
        break;
      case 'prev': r.idx = Math.max(0, r.idx - 1); r.timerEnd = 0; break;
      case 'next':
        r.timerEnd = 0;
        if (r.idx < rt.steps.length - 1) { r.idx += 1; feedback.tone(587, 0.2); feedback.say(rt.steps[r.idx].name); }
        else saveRoutine(r);
        break;
    }
    return commit();
  }
}

// ------------------------------------------------------------
// Tic d'horloge (appelé ~4×/s). Retourne true si un rendu complet est nécessaire.
// ------------------------------------------------------------

function setRing(el, frac) {
  if (!el) return;
  const c = Number(el.dataset.c);
  el.style.strokeDashoffset = String(c * (1 - clamp(frac, 0, 1)));
}
const setText = (id, txt) => { const el = document.getElementById(id); if (el && el.textContent !== txt) el.textContent = txt; };

export function runnerTick() {
  const r = S.runner;
  if (!r) return false;
  const t = now();

  if (r.kind === 'gym') {
    setText('r-elapsed', fmtClock(((r.endedAt || t) - r.startedAt) / 1000));
    if (r.phase !== 'rest') return false;
    const left = (r.restEnd - t) / 1000;
    if (left <= 0) {
      r.phase = 'work';
      feedback.phase();
      const seq = buildSequence(r.workoutId, r.short);
      const step = seq[r.idx];
      feedback.say(`${step.ex.name}. ${r.reps} ${step.ex.timed ? 'secondes' : 'répétitions'}${step.ex.increment ? ` à ${r.weight} kilos` : ''}.`);
      return true;
    }
    if (left <= 3.05 && Math.ceil(left) !== r.lastBeep) { r.lastBeep = Math.ceil(left); feedback.countdown(); }
    setText('r-clock', fmtClock(left));
    setRing(document.getElementById('r-ring'), left / r.restTotal);
    return false;
  }

  if (r.kind === 'rower') {
    if (r.phase !== 'run') return false;
    if (r.paused) return false;
    let changed = false;
    while (r.phase === 'run' && t >= r.segEnd) { advanceRower(r); changed = true; }
    if (changed) return true;
    const seg = ROWER_SEGS[r.seg];
    const left = (r.segEnd - t) / 1000;
    if (left <= 3.05 && Math.ceil(left) !== r.lastBeep) { r.lastBeep = Math.ceil(left); feedback.countdown(); }
    setText('r-clock', fmtClock(left));
    setText('r-elapsed', fmtClock((t - r.startedAt) / 1000));
    setRing(document.getElementById('r-ring'), 1 - left / seg.sec);
    return false;
  }

  if (r.kind === 'routine') {
    if (!r.timerEnd) return false;
    const left = (r.timerEnd - t) / 1000;
    if (left <= 0) {
      r.timerEnd = 0;
      const step = ROUTINES[r.id].steps[r.idx];
      r.done[r.idx] = Math.min(holdsOf(step), (r.done[r.idx] || 0) + 1);
      feedback.phase();
      if (r.done[r.idx] < holdsOf(step)) feedback.say(holdLabel(step, r.done[r.idx]));
      return true;
    }
    if (left <= 3.05 && Math.ceil(left) !== r.lastBeep) { r.lastBeep = Math.ceil(left); feedback.countdown(); }
    setText('r-clock', fmtClock(left));
    setRing(document.getElementById('r-ring'), 1 - left / r.timerTotal);
    return false;
  }
  return false;
}

// ------------------------------------------------------------
// Vues
// ------------------------------------------------------------

function bigRing(frac, label, sub, { size = 248, stroke = 12 } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return html`<div class="big-ring" style="--size:${size}px">
    ${raw(`<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
    <circle id="r-ring" class="ring-fg" data-c="${c.toFixed(2)}" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c.toFixed(2)}" style="stroke-dashoffset:${(c * (1 - clamp(frac, 0, 1))).toFixed(2)}"/></svg>`)}
    <div class="big-ring-txt"><b id="r-clock">${label}</b><small>${sub}</small></div>
  </div>`;
}

const stepper = (label, value, act, unitTxt, disabled = false, step = 1) => html`
  <div class="stepper big ${disabled ? 'disabled' : ''}">
    <small>${label}</small>
    <div class="stepper-val"><b>${value}</b>${unitTxt ? html`<small>${unitTxt}</small>` : ''}</div>
    ${disabled ? html`<div class="stepper-btns"><span>poids du corps</span></div>` : html`<div class="stepper-btns">
      <button data-act="r:${act}" data-v="${-step}" aria-label="Moins">${icon('minus')}</button>
      <button data-act="r:${act}" data-v="${step}" aria-label="Plus">${icon('plus')}</button>
    </div>`}
  </div>`;

function runnerTop(r, title, sub, right) {
  return html`<div class="r-top">
    <button class="icon-btn" data-act="r:min" aria-label="Réduire">${icon('down')}</button>
    <div class="r-title"><b>${title}</b><small>${sub}</small></div>
    ${right}
  </div>`;
}

function gymView(r) {
  const w = WORKOUTS[r.workoutId];
  const seq = buildSequence(r.workoutId, r.short);
  const step = seq[r.idx];
  const ex = step.ex;
  const elapsed = fmtClock((((r.endedAt || now()) - r.startedAt) / 1000));
  const top = runnerTop(r, w.title + (r.short ? ' · express' : ''), html`<span id="r-elapsed">${elapsed}</span> · ${r.done.length}/${seq.length} séries`,
    r.phase === 'summary' ? html`<span class="r-spacer"></span>` : html`<button class="link" data-act="r:end">Terminer</button>`);
  const progress = html`<div class="r-progress">${seq.map((_, i) => html`<i class="${i < r.done.length ? 'done' : i === r.idx && r.phase !== 'summary' ? 'cur' : ''}"></i>`)}</div>`;

  if (r.phase === 'summary') {
    const volume = r.done.filter((s) => { const e = seq.find((x) => x.ex.id === s.exerciseId)?.ex; return e && e.increment && !e.timed; }).reduce((a, s) => a + s.weight * s.reps, 0);
    const byEx = new Map();
    r.done.forEach((s) => { if (!byEx.has(s.name)) byEx.set(s.name, []); byEx.get(s.name).push(s); });
    const complete = r.done.length >= seq.length;
    return html`<div class="runner tone-gym">
      ${top}${progress}
      <div class="r-body summary">
        <div class="trophy">${icon(complete ? 'check' : 'clock')}</div>
        <h2 class="r-ex">${complete ? 'Séance terminée' : 'Séance interrompue'}</h2>
        <div class="kv">
          <div><small>Durée</small><b>${Math.max(1, Math.round(((r.endedAt || now()) - r.startedAt) / 60000))} min</b></div>
          <div><small>Séries</small><b>${r.done.length}/${seq.length}</b></div>
          <div><small>Volume</small><b>${fmtNum(volume)} kg</b></div>
        </div>
        <div class="sets-table">${[...byEx.entries()].map(([name, sets]) => html`<div class="st-row"><b>${name}</b><span>${sets.map((s) => html`<i class="feel-${s.feel}">${s.weight ? `${s.weight}×` : ''}${s.reps}</i>`)}</span></div>`)}</div>
      </div>
      <div class="r-foot">
        <button class="btn btn-primary btn-lg block" data-act="r:save">${icon('check')} Enregistrer la séance</button>
        <div class="btn-row">
          ${complete ? '' : html`<button class="btn btn-soft" data-act="r:back">${icon('play')} Reprendre</button>`}
          <button class="btn btn-danger-ghost" data-act="r:discard">${icon('trash')} Abandonner</button>
        </div>
      </div>
    </div>`;
  }

  if (r.phase === 'rest') {
    const left = (r.restEnd - now()) / 1000;
    return html`<div class="runner tone-gym">
      ${top}${progress}
      <div class="r-body center">
        <span class="pill">${r.restTransition ? 'Enchaîne sur l’exercice suivant' : 'Repos'}</span>
        ${bigRing(left / r.restTotal, fmtClock(left), 'restant')}
        <div class="next-card">
          <small>Ensuite · série ${step.set}/${step.sets}</small>
          <b>${r.alt[ex.id] && ex.alternative ? ex.alternative : ex.name}</b>
          <span>${r.reps}${ex.timed ? ' s' : ' reps'} · ${fmtLoad(ex, r.weight)}</span>
        </div>
      </div>
      <div class="r-foot">
        <div class="btn-row">
          <button class="btn btn-soft" data-act="r:restAdd">+15 s</button>
          <button class="btn btn-primary" data-act="r:restSkip">${icon('skip')} Passer le repos</button>
        </div>
        <button class="link center-link" data-act="r:undo">${icon('undo')} Annuler la dernière série</button>
      </div>
    </div>`;
  }

  const name = r.alt[ex.id] && ex.alternative ? ex.alternative : ex.name;
  const letter = step.pairSize > 1 ? String.fromCharCode(65 + step.posInPair) : '';
  return html`<div class="runner tone-gym">
    ${top}${progress}
    <div class="r-body">
      <span class="pill">${step.pairName}${letter ? ` · ${letter}` : ''}</span>
      <h2 class="r-ex">${name}</h2>
      <p class="r-set">Série <b>${step.set}</b> sur ${step.sets} · objectif ${ex.repRange[0]}${ex.repRange[1] !== ex.repRange[0] ? '–' + ex.repRange[1] : ''} ${repsLabel(ex)}</p>
      <div class="r-tools">
        <button class="chip ${r.showCue ? 'active' : ''}" data-act="r:cue">${icon('info')} Consigne</button>
        ${ex.alternative ? html`<button class="chip ${r.alt[ex.id] ? 'active' : ''}" data-act="r:alt">${icon('swap')} ${r.alt[ex.id] ? 'Exercice original' : 'Machine prise ?'}</button>` : ''}
      </div>
      ${r.showCue ? html`<p class="cue">${ex.cue}</p>` : ''}
      ${r.why ? html`<p class="why st-${r.status}">${icon(r.status === 'bump' ? 'bolt' : r.status === 'deload' ? 'shield' : 'spark')} ${r.why}</p>` : ''}
      <div class="steppers">
        ${stepper(ex.increment ? `Charge (${ex.unit})` : 'Charge', ex.increment ? String(r.weight).replace('.', ',') : 'PDC', 'w', ex.increment ? 'kg' : '', !ex.increment)}
        ${stepper(ex.timed ? 'Durée' : 'Répétitions', r.reps, 'reps', ex.timed ? 's' : '')}
      </div>
    </div>
    <div class="r-foot">
      <p class="r-ask">Série faite ? Dis-moi comment c’était :</p>
      <div class="feel-row">
        <button class="feel easy" data-act="r:feel" data-v="easy"><b>Facile</b><small>j’en avais encore</small></button>
        <button class="feel perfect" data-act="r:feel" data-v="perfect">${icon('check')}<b>Parfait</b></button>
        <button class="feel hard" data-act="r:feel" data-v="hard"><b>Dur</b><small>forme limite</small></button>
      </div>
      <div class="r-links">
        ${r.done.length ? html`<button class="link" data-act="r:undo">${icon('undo')} Annuler</button>` : html`<span></span>`}
        <button class="link" data-act="r:skip">Passer cette série ${icon('skip')}</button>
      </div>
    </div>
  </div>`;
}

function rowerView(r) {
  if (r.phase === 'done') {
    const spi = r.spm ? (r.watts / r.spm).toFixed(2) : '—';
    return html`<div class="runner tone-row">
      ${runnerTop(r, ROWER.title, 'Saisis tes moyennes du moniteur PM5', html`<span class="r-spacer"></span>`)}
      <div class="r-body center">
        <div class="trophy">${icon('waves')}</div>
        <h2 class="r-ex">Bien ramé</h2>
        <div class="steppers">
          ${stepper('Watts moyens', r.watts, 'watts', 'W', false, 5)}
          ${stepper('Cadence', r.spm, 'spm', 's/m')}
        </div>
        <p class="spi">SPI <b>${spi}</b> <small>watts par coup</small></p>
      </div>
      <div class="r-foot">
        <button class="btn btn-primary btn-lg block" data-act="r:save">${icon('check')} Enregistrer</button>
        <div class="btn-row">
          ${r.seg < ROWER_SEGS.length ? html`<button class="btn btn-soft" data-act="r:resume">${icon('play')} Reprendre</button>` : ''}
          <button class="btn btn-danger-ghost" data-act="r:discard">${icon('trash')} Abandonner</button>
        </div>
      </div>
    </div>`;
  }
  const seg = ROWER_SEGS[r.seg];
  const left = r.paused ? r.left : (r.segEnd - now()) / 1000;
  const label = seg.type === 'warmup' ? 'Échauffement · pieds libres' : seg.type === 'work' ? 'Effort' : 'Récupération';
  return html`<div class="runner tone-row phase-${seg.type} ${r.paused ? 'paused' : ''}">
    ${runnerTop(r, ROWER.title, html`<span id="r-elapsed">${fmtClock((now() - r.startedAt) / 1000)}</span> · damper ${ROWER.damper}`, html`<button class="link" data-act="r:end">Terminer</button>`)}
    <div class="rounds">${Array.from({ length: ROWER.rounds }, (_, i) => html`<i class="${i + 1 < seg.round || (i + 1 === seg.round && seg.type === 'rest') ? 'done' : i + 1 === seg.round ? 'cur' : ''}"></i>`)}</div>
    <div class="r-body center">
      <span class="pill">${label}${seg.round ? ` · round ${seg.round}/${ROWER.rounds}` : ''}</span>
      ${bigRing(1 - left / seg.sec, fmtClock(left), r.paused ? 'en pause' : seg.type === 'work' ? ROWER.targetWatts : 'restant')}
      <div class="kv">
        <div><small>Puissance</small><b>${ROWER.targetWatts}</b></div>
        <div><small>Cadence</small><b>${ROWER.targetSpm}</b></div>
      </div>
      <p class="cue">${seg.type === 'warmup' ? ROWER.cues[1] : seg.type === 'work' ? ROWER.cues[2] : 'Respire par le ventre, garde le dos long. Prochain effort dans un instant.'}</p>
    </div>
    <div class="r-foot">
      <div class="btn-row">
        <button class="btn btn-primary btn-lg" data-act="r:pause">${icon(r.paused ? 'play' : 'pause')} ${r.paused ? 'Reprendre' : 'Pause'}</button>
        <button class="btn btn-soft btn-lg" data-act="r:next">${icon('skip')} Passer</button>
      </div>
    </div>
  </div>`;
}

function routineView(r) {
  const rt = ROUTINES[r.id];
  const step = rt.steps[r.idx];
  const total = holdsOf(step);
  const n = r.done[r.idx] || 0;
  const last = r.idx === rt.steps.length - 1;
  const tone = r.id === 'desk' ? 'desk' : 'core';
  const left = r.timerEnd ? (r.timerEnd - now()) / 1000 : step.timerSec;
  return html`<div class="runner tone-${tone}">
    ${runnerTop(r, rt.title, `Exercice ${r.idx + 1} sur ${rt.steps.length}`, html`<button class="link" data-act="r:discard">Quitter</button>`)}
    <div class="r-progress">${rt.steps.map((_, i) => html`<i class="${i < r.idx ? 'done' : i === r.idx ? 'cur' : ''}"></i>`)}</div>
    <div class="r-body center">
      <h2 class="r-ex">${step.name}</h2>
      <span class="pill">${step.dose}</span>
      ${step.timerSec ? html`<button class="ring-btn" data-act="r:timer" ${n >= total && !r.timerEnd ? 'disabled' : ''}>
        ${bigRing(r.timerEnd ? 1 - left / r.timerTotal : 0, fmtClock(left), r.timerEnd ? 'touche pour arrêter' : n >= total ? 'terminé' : `démarrer · ${holdLabel(step, n).toLowerCase()}`, { size: 210, stroke: 11 })}
      </button>` : ''}
      <p class="cue">${step.cue}</p>
      <div class="holds">
        ${Array.from({ length: total }, (_, h) => html`<button class="hold ${h < n ? 'done' : ''}" data-act="r:hold" data-v="${h}">${h < n ? icon('check') : ''}<span>${holdLabel(step, h)}</span></button>`)}
      </div>
    </div>
    <div class="r-foot">
      <div class="btn-row">
        ${r.idx ? html`<button class="btn btn-soft" data-act="r:prev">${icon('left')} Précédent</button>` : ''}
        <button class="btn btn-primary btn-lg" data-act="r:next">${last ? html`${icon('check')} Terminer` : html`Suivant ${icon('right')}`}</button>
      </div>
    </div>
  </div>`;
}

export function runnerView() {
  const r = S.runner;
  if (!r || r.hidden) return '';
  if (r.kind === 'gym') return gymView(r);
  if (r.kind === 'rower') return rowerView(r);
  if (r.kind === 'routine') return routineView(r);
  return '';
}
