// ============================================================
// Écrans principaux (fonctions pures : état → HTML)
// ============================================================

import { WORKOUTS, ROWER, ROUTINES, ROWER_LEVELS, ROWER_LEVEL_CADENCE, ROWER_LEVEL_REST, AUDIT, TYPES, QUICK_ADD, PROTEIN_PER_KG } from './data.js';
import { html, raw, icon, fmtLong, fmtShort, fmtTime, fmtDayLabel, fmtNum, dayKey, addDays, startOfWeek } from './lib.js';
import { S, streak, weekInfo, goalProgress, doneToday, kindOf, typeOf, metaOf, titleOf, byDay } from './store.js';
import { nextTarget, fmtLoad, repsLabel, ALL_EXERCISES, loadTrend, buildSequence, exerciseById } from './engine.js';
import { renderMessage } from './coach.js';
import { runnerTitle } from './runners.js';

// ---------- Petits composants ----------

const toneVar = (tone) => `tone-${tone}`;

function sparkline(values, { w = 120, h = 36, cls = '' } = {}) {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - 4 - ((v - min) / span) * (h - 8)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return raw(`<svg class="spark ${cls}" viewBox="-3 0 ${w + 6} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="currentColor"/></svg>`);
}

function ring(pct, { size = 64, stroke = 7, label = '', sub = '' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct)));
  return html`<div class="ring" style="width:${size}px;height:${size}px">
    ${raw(`<svg viewBox="0 0 ${size} ${size}"><circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
    <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/></svg>`)}
    <div class="ring-txt"><b>${label}</b>${sub ? html`<small>${sub}</small>` : ''}</div>
  </div>`;
}

const toggle = (on, act, label, hint = '') => html`
  <button class="setting" data-act="${act}" role="switch" aria-checked="${on ? 'true' : 'false'}">
    <span class="setting-txt"><b>${label}</b>${hint ? html`<small>${hint}</small>` : ''}</span>
    <span class="switch ${on ? 'on' : ''}"><i></i></span>
  </button>`;

const header = (title, eyebrow = '', right = '') => html`
  <header class="top">
    <div>${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}<h1 class="title">${title}</h1></div>
    ${right}
  </header>`;

function entryMeta(w) {
  const bits = [];
  if (w.durationMin) bits.push(`${w.durationMin} min`);
  if (w.volume) bits.push(`${fmtNum(w.volume)} kg soulevés`);
  else if (w.sets && w.sets.length) bits.push(`${w.sets.length} séries`);
  if (w.watts) bits.push(`${w.watts} W`);
  if (w.cadence) bits.push(`${w.cadence} s/m`);
  if (w.distance) bits.push(`${w.distance} ${w.distUnit || (typeOf(w) === 'SWIM' ? 'm' : 'km')}`);
  return bits.join(' · ');
}

export function entryRow(w) {
  const m = metaOf(w);
  return html`<button class="row ${toneVar(m.tone)}" data-act="entry" data-v="${w.id}">
    <span class="row-ic">${icon(m.icon)}</span>
    <span class="row-main"><b>${titleOf(w)}</b><span>${entryMeta(w) || w.notes || m.label}</span></span>
    <span class="row-side">${fmtTime(w.date)}</span>
  </button>`;
}

// ---------- Aujourd'hui ----------

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}

function weekCard() {
  const week = weekInfo();
  const goals = goalProgress();
  return html`<section class="card week-card">
    <div class="week">
      ${week.map((d) => html`<div class="wd ${d.isToday ? 'today' : ''} ${d.items.length ? 'has' : ''} ${d.isFuture ? 'future' : ''}">
        <span class="wd-l">${d.label}</span>
        <span class="wd-n">${d.items.length ? icon('check') : d.num}</span>
        <span class="wd-dots">${d.tones.slice(0, 3).map((t) => html`<i class="${toneVar(t)}"></i>`)}</span>
      </div>`)}
    </div>
    <div class="goals">
      ${goals.map((g) => html`<div class="goal ${toneVar(g.tone)} ${g.done >= g.target ? 'met' : ''}">
        <div class="goal-top"><span>${g.label}</span><b>${g.done}<small>/${g.target}</small></b></div>
        <div class="bar"><i style="width:${Math.min(100, (g.done / g.target) * 100)}%"></i></div>
      </div>`)}
    </div>
  </section>`;
}

const CHECKIN = {
  good: { label: 'Solide', hint: 'Feu vert : séance normale' },
  medium: { label: 'Tendu', hint: 'Charges maintenues, tempo lent' },
  pain: { label: 'Douleur', hint: 'Pas de charge aujourd’hui' }
};

function checkinCard() {
  const st = S.checkin.status;
  return html`<section class="card checkin ${st ? 'st-' + st : 'unset'}">
    <div class="card-head">
      <h3>Comment va ton dos ?</h3>
      <span class="muted">${st ? CHECKIN[st].hint : 'Un tap pour adapter la séance'}</span>
    </div>
    <div class="seg seg-3" role="radiogroup" aria-label="État du dos">
      ${Object.entries(CHECKIN).map(([k, v]) => html`<button class="seg-btn st-${k} ${st === k ? 'active' : ''}" role="radio" aria-checked="${st === k}" data-act="checkin" data-v="${k}">
        <i class="st-dot"></i>${v.label}</button>`)}
    </div>
  </section>`;
}

function gymHero() {
  const w = WORKOUTS[S.nextGym];
  const other = S.nextGym === 'A' ? 'B' : 'A';
  const exs = w.pairs.flatMap((p) => p.exercises);
  const medium = S.checkin.status === 'medium';
  const done = doneToday('gym');
  return html`<section class="hero tone-gym">
    <div class="hero-top">
      <span class="eyebrow">${done ? 'Prochaine séance · demain ou plus tard' : 'Prochaine séance'}</span>
      <button class="link" data-act="swapGym">${icon('swap')} Passer à ${other}</button>
    </div>
    <h2 class="hero-title">${w.title}</h2>
    <p class="hero-sub">${w.subtitle} · ${w.minutes} min</p>
    ${done ? html`<p class="note ok">${icon('check')} Muscu déjà faite aujourd’hui. Récupère : le muscle se construit au repos.</p>` : ''}
    ${medium && !done ? html`<p class="note warn">${icon('info')} Dos tendu : on garde les charges, tempo lent et amplitude contrôlée.</p>` : ''}
    <ol class="ex-list">
      ${exs.map((ex) => {
        const t = nextTarget(ex, S.lifts, S.checkin.status, S.bodyweight);
        return html`<li>
          <span class="ex-name">${ex.name}</span>
          <span class="ex-target">${ex.sets}×${t.reps}${ex.timed ? ' s' : ''} · ${fmtLoad(ex, t.weight)}${t.status === 'bump' ? html` <em class="up">↑</em>` : ''}</span>
        </li>`;
      })}
    </ol>
    <div class="hero-actions">
      <button class="btn btn-primary btn-lg block" data-act="start" data-v="gym">${icon('play')} ${done ? 'Refaire une séance' : 'Commencer la séance'}</button>
      <div class="btn-row">
        <button class="btn btn-soft" data-act="start" data-v="gym-short">${icon('bolt')} Express 20 min</button>
        <button class="btn btn-soft" data-act="quick" data-v="gym">${icon('check')} Déjà faite</button>
      </div>
    </div>
  </section>`;
}

function reliefHero() {
  const r = ROUTINES.relief;
  return html`<section class="hero tone-desk">
    <div class="hero-top"><span class="eyebrow">Protocole du jour · dos sensible</span></div>
    <h2 class="hero-title">${r.title}</h2>
    <p class="hero-sub">${r.subtitle}</p>
    <p class="note warn">${icon('shield')} Pas de charges aujourd’hui. Priorité à la décompression discale et au relâchement des psoas. Si la douleur irradie dans la jambe ou persiste, consulte.</p>
    <ol class="ex-list">${r.steps.map((s) => html`<li><span class="ex-name">${s.name}</span><span class="ex-target">${s.dose}</span></li>`)}</ol>
    <div class="hero-actions">
      <button class="btn btn-primary btn-lg block" data-act="start" data-v="relief">${icon('play')} Lancer la décompression</button>
    </div>
  </section>`;
}

function ritualRow(kind, title, sub, tone, ic, startKey) {
  const done = doneToday(kind);
  return html`<div class="row ${toneVar(tone)} ${done ? 'is-done' : ''}">
    <span class="row-ic">${done ? icon('check') : icon(ic)}</span>
    <span class="row-main"><b>${title}</b><span>${done ? 'Fait aujourd’hui' : sub}</span></span>
    <span class="row-act">
      ${done ? '' : html`<button class="icon-btn" data-act="quick" data-v="${kind}" aria-label="Marquer comme fait">${icon('check')}</button>`}
      <button class="icon-btn solid" data-act="start" data-v="${startKey}" aria-label="Lancer">${icon('play')}</button>
    </span>
  </div>`;
}

function resumeBanner() {
  const r = S.runner;
  if (!r || !r.hidden) return '';
  const sub = r.kind === 'gym'
    ? `${r.done.length} / ${buildSequence(r.workoutId, r.short).length} séries — touche pour reprendre`
    : 'Touche pour reprendre';
  return html`<button class="banner" data-act="resume">
    <span class="banner-ic">${icon('play')}</span>
    <span><b>Séance en cours · ${runnerTitle(r)}</b><small>${sub}</small></span>
    ${icon('right')}
  </button>`;
}

export function todayView() {
  const st = streak();
  const pain = S.checkin.status === 'pain';
  return html`
    ${header(greeting(), fmtLong(), html`<div class="streak ${st ? 'on' : ''}" title="Jours d’activité consécutifs">${icon('flame')}<b>${st}</b><span>j</span></div>`)}
    ${resumeBanner()}
    ${weekCard()}
    ${checkinCard()}
    ${pain ? reliefHero() : gymHero()}
    <h2 class="section-title">Rituels du jour</h2>
    <div class="stack">
      ${ritualRow('floor', ROUTINES.floor.title, ROUTINES.floor.subtitle, 'core', 'shield', 'floor')}
      ${pain ? '' : ritualRow('rower', 'Finisher rameur 10×1′', `${ROWER.targetWatts} · ${ROWER.targetSpm} · damper 3–4`, 'row', 'waves', 'rower')}
      ${ritualRow('desk', ROUTINES.desk.title, ROUTINES.desk.subtitle, 'desk', 'briefcase', 'desk')}
    </div>
    <button class="btn btn-dashed block mt" data-act="sheet" data-v="add">${icon('plus')} Ajouter une activité</button>
  `;
}

// ---------- Programme ----------

function acc(key, head, body, cls = '') {
  const open = !!S.open[key];
  return html`<div class="acc ${open ? 'open' : ''} ${cls}">
    <button class="acc-head" data-act="toggle" data-v="${key}" aria-expanded="${open}">${head}<span class="acc-chev">${icon('down')}</span></button>
    ${open ? html`<div class="acc-body">${body}</div>` : ''}
  </div>`;
}

function workoutCard(w) {
  const isNext = S.nextGym === w.id;
  const body = html`
    <p class="rule">${icon('shield')} ${w.rule}</p>
    ${w.pairs.map((p) => html`<div class="pair">
      <h4>${p.name}${p.accessory ? html` <span class="tag">sauté en express</span>` : ''}</h4>
      ${p.exercises.map((ex) => {
        const t = nextTarget(ex, S.lifts, S.checkin.status, S.bodyweight);
        return html`<div class="ex">
          <div class="ex-head"><b>${ex.name}</b><span>${ex.sets} × ${ex.repRange[0]}${ex.repRange[1] !== ex.repRange[0] ? '–' + ex.repRange[1] : ''} ${repsLabel(ex)}</span></div>
          <p>${ex.cue}</p>
          <div class="ex-meta">
            <span>${icon('dumbbell')} ${ex.equipment}</span>
            <span class="tgt">Prochaine cible : ${t.reps}${ex.timed ? ' s' : ''} @ ${fmtLoad(ex, t.weight)}</span>
            ${ex.alternative ? html`<span>${icon('swap')} Alternative : ${ex.alternative}</span>` : ''}
          </div>
        </div>`;
      })}
    </div>`)}
    <button class="btn btn-primary block" data-act="start" data-v="gym-${w.id}">${icon('play')} Lancer ${w.title}</button>`;
  return acc(`w${w.id}`, html`<span class="acc-ic tone-gym">${icon('dumbbell')}</span>
    <span class="acc-title"><b>${w.title}${isNext ? html` <span class="tag tag-accent">prochaine</span>` : ''}</b><small>${w.subtitle} · ${w.minutes} min</small></span>`, body, 'tone-gym');
}

function routineCard(r, ic, tone) {
  const body = html`
    ${r.steps.map((s, i) => html`<div class="ex">
      <div class="ex-head"><b>${i + 1}. ${s.name}</b><span>${s.dose}</span></div>
      <p>${s.cue}</p>
    </div>`)}
    <button class="btn btn-primary block" data-act="start" data-v="${r.id}">${icon('play')} Lancer</button>`;
  return acc(r.id, html`<span class="acc-ic ${toneVar(tone)}">${icon(ic)}</span>
    <span class="acc-title"><b>${r.title}</b><small>${r.subtitle}</small></span>`, body, toneVar(tone));
}

function rowerCard() {
  const body = html`
    <div class="kv">
      <div><small>Puissance</small><b>${ROWER.targetWatts}</b></div>
      <div><small>Cadence</small><b>${ROWER.targetSpm}</b></div>
      <div><small>Damper</small><b>${ROWER.damper}</b></div>
    </div>
    <ul class="bullets">${ROWER.cues.map((c) => html`<li>${c}</li>`)}</ul>
    <button class="btn btn-primary block" data-act="start" data-v="rower">${icon('play')} Lancer les intervalles</button>`;
  return acc('rower', html`<span class="acc-ic tone-row">${icon('waves')}</span>
    <span class="acc-title"><b>${ROWER.title}</b><small>${ROWER.subtitle} · ~${ROWER.minutes} min</small></span>`, body, 'tone-row');
}

function levelsCard() {
  const cur = S.settings.rowerLevel;
  const body = html`
    <p class="muted small">Travail à basse cadence (${ROWER_LEVEL_CADENCE}), repos ${ROWER_LEVEL_REST}. Passe au palier suivant quand le SPI cible est tenu sur toute la séance. Touche un palier pour le définir comme actuel.</p>
    <div class="levels">
      ${ROWER_LEVELS.map((l) => html`<button class="level ${l.level === cur ? 'current' : ''} ${l.level < cur ? 'past' : ''}" data-act="setLevel" data-v="${l.level}">
        <span class="lv-n">${l.level}</span>
        <span class="lv-main"><b>${l.watts}</b><small>${l.format}</small></span>
        <span class="lv-spi">SPI ≥ ${l.spi}</span>
      </button>`)}
    </div>`;
  return acc('levels', html`<span class="acc-ic tone-row">${icon('chart')}</span>
    <span class="acc-title"><b>Feuille de route 24 mois</b><small>12 paliers rameur · actuel : palier ${cur}</small></span>`, body, 'tone-row');
}

export function planView() {
  return html`
    ${header('Programme', 'Spine-First · 3 × 35 min / semaine')}
    <section class="card plan-week">
      <h3>Semaine type</h3>
      <div class="pw-grid">
        ${[['L', 'gym', 'A'], ['M', 'row', ''], ['M', 'gym', 'B'], ['J', 'swim', ''], ['V', 'gym', 'A'], ['S', 'hike', ''], ['D', 'rest', '']].map(([d, t, l]) => html`
          <div class="pw ${toneVar(t)}"><span>${d}</span><i>${t === 'rest' ? '–' : l || icon(TYPES[{ gym: 'WORK_GYM', row: 'CONCEPT2', swim: 'SWIM', hike: 'HIKE' }[t]].icon)}</i></div>`)}
      </div>
      <p class="muted small">Alternance <b>A-B-A</b> puis <b>B-A-B</b> la semaine suivante. Finisher rameur 2×/semaine, routine sol chaque soir. L’app retient automatiquement la prochaine séance.</p>
    </section>
    <h2 class="section-title">Musculation</h2>
    <div class="stack">${workoutCard(WORKOUTS.A)}${workoutCard(WORKOUTS.B)}</div>
    <h2 class="section-title">Cardio & dos</h2>
    <div class="stack">
      ${rowerCard()}
      ${levelsCard()}
      ${routineCard(ROUTINES.floor, 'shield', 'core')}
      ${routineCard(ROUTINES.desk, 'briefcase', 'desk')}
    </div>
    <h2 class="section-title">Pourquoi ce programme</h2>
    <div class="stack">
      ${AUDIT.map((a, i) => acc(`audit${i}`, html`<span class="acc-title"><b>${a.title}</b></span>`, html`<p class="prose">${a.text}</p>`, 'plain'))}
    </div>
  `;
}

// ---------- Progrès ----------

function weeksChart() {
  const tones = ['gym', 'row', 'core', 'swim', 'hike', 'other'];
  const days = byDay();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const mon = startOfWeek(addDays(new Date(), -7 * i));
    const counts = Object.fromEntries(tones.map((t) => [t, 0]));
    for (let d = 0; d < 7; d++) {
      (days.get(dayKey(addDays(mon, d))) || []).forEach((w) => { counts[metaOf(w).tone]++; });
    }
    weeks.push({ mon, counts, total: Object.values(counts).reduce((a, b) => a + b, 0), current: i === 0 });
  }
  const max = Math.max(6, ...weeks.map((w) => w.total));
  return html`<div class="wchart">
    ${weeks.map((w) => html`<div class="wcol ${w.current ? 'current' : ''}">
      <span class="wval">${w.total || ''}</span>
      <div class="wbar">${tones.filter((t) => w.counts[t]).map((t) => html`<i class="${toneVar(t)}" style="height:${(w.counts[t] / max) * 100}%"></i>`)}</div>
      <span class="wlab">${w.current ? 'Cette sem.' : fmtShort(w.mon).replace('.', '')}</span>
    </div>`)}
  </div>
  <div class="legend">${[['gym', 'Muscu'], ['row', 'Rameur'], ['core', 'Gainage'], ['swim', 'Natation'], ['hike', 'Rando']].map(([t, l]) => html`<span class="${toneVar(t)}"><i></i>${l}</span>`)}</div>`;
}

function liftsCard() {
  return html`<div class="lifts">
    ${ALL_EXERCISES.map((ex) => {
      const trend = loadTrend(ex.id, S.lifts);
      const t = nextTarget(ex, S.lifts, S.checkin.status, S.bodyweight);
      const last = trend[trend.length - 1];
      const values = ex.increment ? trend.map((p) => p.weight) : trend.map((p) => p.reps);
      return html`<div class="lift">
        <div class="lift-main">
          <b>${ex.name}</b>
          <small>${last ? `Dernière : ${fmtLoad(ex, last.weight)} × ${last.reps}${ex.timed ? ' s' : ''}` : 'Pas encore réalisée'} · <span class="tgt">Cible : ${fmtLoad(ex, t.weight)} × ${t.reps}${ex.timed ? ' s' : ''}</span></small>
        </div>
        <div class="lift-spark tone-gym">${sparkline(values, { w: 80, h: 30 }) || html`<span class="muted small">—</span>`}</div>
      </div>`;
    })}
  </div>`;
}

function rowerStats() {
  const rows = S.workouts.filter((w) => typeOf(w) === 'CONCEPT2' && Number(w.watts));
  const recent = rows.slice(0, 12).reverse();
  const last = rows[0];
  const lv = ROWER_LEVELS.find((l) => l.level === S.settings.rowerLevel) || ROWER_LEVELS[0];
  return html`<section class="card">
    <div class="card-head"><h3>${icon('waves')} Rameur</h3><button class="link" data-act="gotoLevels">Palier ${lv.level} · ${lv.watts}</button></div>
    <div class="stat-row">
      <div class="stat"><small>Dernière puissance</small><b>${last ? `${last.watts} W` : '—'}</b></div>
      <div class="stat"><small>Dernier SPI</small><b>${last && last.spi ? last.spi : '—'}</b></div>
      <div class="stat tone-row">${sparkline(recent.map((r) => Number(r.watts)), { w: 90, h: 36 }) || html`<small class="muted">Courbe après 2 séances</small>`}</div>
    </div>
    <p class="muted small">SPI = watts ÷ cadence. Objectif du palier : ≥ ${lv.spi}.</p>
  </section>`;
}

function weightCard() {
  const log = [...S.weightLog].sort((a, b) => (a.date < b.date ? -1 : 1));
  const loggedToday = log.some((e) => e.date === dayKey());
  const first = log[0];
  const delta = first ? (S.bodyweight - first.kg) : 0;
  return html`<section class="card">
    <div class="card-head"><h3>${icon('scale')} Poids & protéines</h3>${first && log.length > 1 ? html`<span class="muted small">${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg depuis le ${fmtShort(first.date)}</span>` : ''}</div>
    <div class="weight">
      <div class="stepper sm">
        <button data-act="bw" data-v="-0.5" aria-label="Moins 0,5 kg">${icon('minus')}</button>
        <div class="stepper-val"><b>${S.bodyweight.toLocaleString('fr-FR')}</b><small>kg</small></div>
        <button data-act="bw" data-v="0.5" aria-label="Plus 0,5 kg">${icon('plus')}</button>
      </div>
      <div class="tone-core weight-spark">${sparkline(log.slice(-20).map((e) => e.kg), { w: 110, h: 40 })}</div>
    </div>
    <button class="btn btn-soft block" data-act="logWeight">${icon('check')} ${loggedToday ? 'Mettre à jour la pesée du jour' : 'Enregistrer la pesée du jour'}</button>
    <div class="kv mt">
      <div><small>Protéines / jour</small><b>${Math.round(S.bodyweight * PROTEIN_PER_KG)} g</b></div>
      <div><small>Ratio</small><b>${PROTEIN_PER_KG} g/kg</b></div>
      <div><small>Déficit cible</small><b>−300 à −500 kcal</b></div>
    </div>
  </section>`;
}

function journal() {
  if (!S.workouts.length) {
    return html`<div class="empty">${icon('leaf')}<p>Aucune séance pour l’instant.<br>Lance ta première depuis l’onglet Aujourd’hui.</p></div>`;
  }
  const shown = S.workouts.slice(0, S.historyLimit);
  const groups = byDay(shown);
  return html`
    ${[...groups.entries()].map(([k, items]) => html`<div class="day-group">
      <h4>${fmtDayLabel(k)}</h4>
      <div class="stack tight">${items.map(entryRow)}</div>
    </div>`)}
    ${S.workouts.length > S.historyLimit ? html`<button class="btn btn-soft block" data-act="more">Afficher plus (${S.workouts.length - S.historyLimit})</button>` : ''}`;
}

export function progressView() {
  const goals = goalProgress();
  const since = addDays(new Date(), -30);
  const last30 = S.workouts.filter((w) => new Date(w.date) >= since);
  const minutes = last30.reduce((a, w) => a + (Number(w.durationMin) || 0), 0);
  const volume = last30.reduce((a, w) => a + (Number(w.volume) || (w.sets || []).reduce((v, x) => v + (Number(x.weight) || 0) * (Number(x.reps) || 0), 0)), 0);
  return html`
    ${header('Progrès', 'Cette semaine & 30 derniers jours')}
    <section class="card">
      <div class="rings">
        ${goals.map((g) => html`<div class="ring-item ${toneVar(g.tone)}">
          ${ring(g.done / g.target, { label: `${g.done}`, sub: `/${g.target}` })}
          <span>${g.label}</span>
        </div>`)}
      </div>
    </section>
    <div class="tiles">
      <div class="tile"><small>Séances · 30 j</small><b>${last30.length}</b></div>
      <div class="tile"><small>Minutes · 30 j</small><b>${fmtNum(minutes)}</b></div>
      <div class="tile"><small>Série en cours</small><b>${streak()} <span>j</span></b></div>
      <div class="tile"><small>Volume · 30 j</small><b>${(volume / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} <span>t</span></b></div>
    </div>
    <section class="card">
      <div class="card-head"><h3>${icon('chart')} 8 dernières semaines</h3></div>
      ${weeksChart()}
    </section>
    <section class="card">
      <div class="card-head"><h3>${icon('dumbbell')} Charges</h3><span class="muted small">double progression</span></div>
      ${liftsCard()}
    </section>
    ${rowerStats()}
    ${weightCard()}
    <h2 class="section-title">Journal <span class="count">${S.workouts.length}</span></h2>
    ${journal()}
  `;
}

// ---------- Profil ----------

export function profileView() {
  const s = S.settings;
  return html`
    ${header('Profil', 'Réglages, coach & données')}
    <button class="card coach-card" data-act="sheet" data-v="chat">
      <span class="coach-ic">${icon('chat')}</span>
      <span><b>Coach IA biomécanique</b><small>${s.geminiKey ? 'Pose une question sur ta posture, une douleur, ta charge…' : 'Ajoute une clé API Gemini pour l’activer'}</small></span>
      ${icon('right')}
    </button>

    <h2 class="section-title">Corps</h2>
    <section class="card">
      <div class="setting static">
        <span class="setting-txt"><b>Poids de corps</b><small>Sert aux charges de départ et à la cible protéines</small></span>
        <div class="stepper xs">
          <button data-act="bw" data-v="-0.5" aria-label="Moins">${icon('minus')}</button>
          <div class="stepper-val"><b>${S.bodyweight.toLocaleString('fr-FR')}</b><small>kg</small></div>
          <button data-act="bw" data-v="0.5" aria-label="Plus">${icon('plus')}</button>
        </div>
      </div>
    </section>

    <h2 class="section-title">Séances</h2>
    <section class="card">
      <div class="setting static col">
        <span class="setting-txt"><b>Repos entre les tours</b><small>Entre deux exercices d’un superset : 20 s d’enchaînement</small></span>
        <div class="seg seg-4">${[30, 45, 60, 90].map((v) => html`<button class="seg-btn ${s.restSec === v ? 'active' : ''}" data-act="rest" data-v="${v}">${v} s</button>`)}</div>
      </div>
      ${toggle(s.sound, 'tSound', 'Sons', 'Bips de fin de repos et de phase')}
      ${toggle(s.haptics, 'tHaptics', 'Vibrations', 'Retour haptique (Android)')}
      ${toggle(s.voice, 'tVoice', 'Annonces vocales', 'Le coach lit les cibles à voix haute')}
    </section>

    <h2 class="section-title">Apparence</h2>
    <section class="card">
      <div class="seg seg-3">${[['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) => html`<button class="seg-btn ${s.theme === v ? 'active' : ''}" data-act="theme" data-v="${v}">${l}</button>`)}</div>
    </section>

    <h2 class="section-title">Coach IA</h2>
    <section class="card">
      <form data-form="ai" class="form">
        <label class="field"><span>Clé API Gemini</span>
          <input type="password" name="key" value="${s.geminiKey}" placeholder="AIza…" autocomplete="off" spellcheck="false"></label>
        <label class="field"><span>Modèle</span>
          <input type="text" name="model" value="${s.geminiModel}" placeholder="gemini-2.5-flash" autocomplete="off" spellcheck="false"></label>
        <p class="muted small">La clé reste sur ce téléphone et n’est envoyée qu’à l’API Google lorsque tu écris au coach. Clé gratuite sur aistudio.google.com.</p>
        <button class="btn btn-soft block" type="submit">Enregistrer</button>
      </form>
    </section>

    <h2 class="section-title">Données</h2>
    <section class="card">
      <div class="btn-row">
        <button class="btn btn-soft" data-act="export">${icon('download')} Exporter</button>
        <label class="btn btn-soft">${icon('upload')} Importer<input type="file" accept="application/json,.json" data-input="import" hidden></label>
      </div>
      <p class="muted small mt">${S.workouts.length} séances · tout est stocké localement sur cet appareil, l’app fonctionne hors-ligne.</p>
      <button class="btn btn-danger-ghost block mt" data-act="wipe">${icon('trash')} Tout effacer</button>
    </section>
    <p class="foot">Health OS · v11</p>
  `;
}

// ---------- Barre d'onglets ----------

export function tabbar() {
  const tabs = [['today', 'Aujourd’hui', 'sun'], ['plan', 'Programme', 'list'], ['progress', 'Progrès', 'chart'], ['profile', 'Profil', 'user']];
  return html`<nav class="tabbar" aria-label="Navigation">
    ${tabs.map(([id, label, ic]) => html`<button class="tab ${S.tab === id ? 'active' : ''}" data-act="tab" data-v="${id}" aria-current="${S.tab === id ? 'page' : 'false'}">${icon(ic)}<span>${label}</span></button>`)}
  </nav>`;
}

// ---------- Feuilles (bottom sheets) ----------

function addSheet(sheet) {
  const opt = QUICK_ADD.find((q) => q.kind === sheet.kind) || QUICK_ADD[0];
  return html`<div class="sheet-head"><h3>Ajouter une activité</h3><button class="icon-btn" data-act="close" aria-label="Fermer">${icon('x')}</button></div>
    <div class="chips">
      ${QUICK_ADD.map((q) => html`<button class="chip ${toneVar(q.tone)} ${q.kind === opt.kind ? 'active' : ''}" data-act="addKind" data-v="${q.kind}">${icon(q.icon)}${q.label}</button>`)}
    </div>
    <form data-form="add" class="form">
      <input type="hidden" name="kind" value="${opt.kind}">
      <div class="field-row">
        <label class="field"><span>Durée (min)</span><input type="number" inputmode="numeric" name="minutes" min="1" max="600" value="${opt.minutes}"></label>
        ${opt.distance != null ? html`<label class="field"><span>Distance (${opt.distUnit})</span><input type="number" inputmode="decimal" step="any" name="distance" min="0" value="${opt.distance}"><input type="hidden" name="distUnit" value="${opt.distUnit}"></label>` : ''}
        ${opt.watts != null ? html`<label class="field"><span>Watts moy.</span><input type="number" inputmode="numeric" name="watts" min="0" value="${opt.watts}"></label>
          <label class="field"><span>Cadence</span><input type="number" inputmode="numeric" name="spm" min="0" value="${opt.spm}"></label>` : ''}
      </div>
      <div class="field-row">
        <label class="field"><span>Date</span><input type="date" name="day" value="${dayKey()}" max="${dayKey()}"></label>
      </div>
      <label class="field"><span>Note</span><input type="text" name="notes" value="${opt.note || ''}" placeholder="Optionnel"></label>
      <button class="btn btn-primary btn-lg block" type="submit">${icon('check')} Enregistrer</button>
    </form>`;
}

function entrySheet(sheet) {
  const w = S.workouts.find((x) => x.id === sheet.id);
  if (!w) return html`<div class="sheet-head"><h3>Séance introuvable</h3><button class="icon-btn" data-act="close">${icon('x')}</button></div>`;
  const m = metaOf(w);
  const byEx = new Map();
  (w.sets || []).forEach((s) => {
    const name = (s.exerciseId && exerciseById(s.exerciseId)?.name) || s.name || 'Série';
    const label = s.alt ? `${name} (alt.)` : name;
    if (!byEx.has(label)) byEx.set(label, []);
    byEx.get(label).push(s);
  });
  return html`<div class="sheet-head">
      <div class="entry-title ${toneVar(m.tone)}"><span class="row-ic">${icon(m.icon)}</span><div><h3>${titleOf(w)}</h3><small>${fmtDayLabel(dayKey(w.date))} · ${fmtTime(w.date)}</small></div></div>
      <button class="icon-btn" data-act="close" aria-label="Fermer">${icon('x')}</button>
    </div>
    ${entryMeta(w) ? html`<p class="entry-meta">${entryMeta(w)}${w.spi ? ` · SPI ${w.spi}` : ''}</p>` : ''}
    ${byEx.size ? html`<div class="sets-table">${[...byEx.entries()].map(([name, sets]) => html`<div class="st-row"><b>${name}</b><span>${sets.map((s) => html`<i class="feel-${s.feel || 'perfect'}">${s.weight ? `${s.weight}×` : ''}${s.reps}</i>`)}</span></div>`)}</div>` : ''}
    ${w.notes ? html`<p class="prose">${w.notes}</p>` : ''}
    <button class="btn btn-danger-ghost block mt" data-act="delete" data-v="${w.id}">${icon('trash')} Supprimer cette séance</button>`;
}

function chatSheet() {
  const s = S.settings;
  const msgs = S.chat.messages;
  return html`<div class="sheet-head"><h3>${icon('chat')} Coach IA</h3>
      <span class="row-act">${msgs.length ? html`<button class="link" data-act="chatClear">Effacer</button>` : ''}<button class="icon-btn" data-act="close" aria-label="Fermer">${icon('x')}</button></span></div>
    <div class="chat" id="chat-scroll">
      ${!s.geminiKey ? html`<div class="note warn">${icon('info')} Pour discuter avec le coach, ajoute ta clé API Gemini dans Profil → Coach IA.</div>` : ''}
      ${!msgs.length ? html`<div class="bubble ai">Salut ! Je connais ton programme Spine-First, ta fragilité L4-L5 et tes dernières séances. Que veux-tu ajuster aujourd’hui ?</div>
        <div class="suggest">${['J’ai mal au bas du dos après le rameur', 'Propose-moi une séance de 20 min', 'Comment progresser au développé incliné ?'].map((q) => html`<button class="chip" data-act="chatAsk" data-v="${q}" ${s.geminiKey ? '' : 'disabled'}>${q}</button>`)}</div>` : ''}
      ${msgs.map((m, i) => renderMessage(m, i))}
      ${S.chat.loading ? html`<div class="bubble ai typing"><i></i><i></i><i></i></div>` : ''}
    </div>
    <form data-form="chat" class="chat-input">
      <input type="text" name="q" value="${S.chat.draft}" data-input="draft" placeholder="${s.geminiKey ? 'Écris au coach…' : 'Clé API requise'}" autocomplete="off" ${s.geminiKey ? '' : 'disabled'}>
      <button class="icon-btn solid" type="submit" aria-label="Envoyer" ${s.geminiKey && !S.chat.loading ? '' : 'disabled'}>${icon('send')}</button>
    </form>`;
}

export function sheetView() {
  const sh = S.sheet;
  if (!sh) return '';
  const body = sh.type === 'add' ? addSheet(sh) : sh.type === 'entry' ? entrySheet(sh) : sh.type === 'chat' ? chatSheet() : '';
  return html`<div class="scrim" data-act="close"></div>
    <div class="sheet ${sh.type === 'chat' ? 'tall' : ''}" role="dialog" aria-modal="true">
      <div class="grabber"></div>
      ${body}
    </div>`;
}
