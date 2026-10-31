// ============================================================
// Moteur coach : charges de départ, double progression, adaptation intra-séance
// ============================================================

import { WORKOUTS } from './data.js';

const START = {
  chest_supported_db_row: 0.15,
  incline_db_bench_press: 0.16,
  bulgarian_split_squat: 0.08,
  db_lateral_raise: 0.07,
  lat_pulldown: 0.45,
  seated_db_ohp: 0.12,
  seated_leg_curl: 0.40,
  leg_press: 0.80,
  suitcase_carry: 0.20,
  deadbug: 0
};

export const ALL_EXERCISES = Object.values(WORKOUTS).flatMap((w) =>
  w.pairs.flatMap((p) => p.exercises.map((ex) => ({ ...ex, workout: w.id })))
);
export const exerciseById = (id) => ALL_EXERCISES.find((e) => e.id === id);

const roundTo = (v, step) => (step > 0 ? Math.round(v / step) * step : v);

export function startingLoad(ex, bodyweight = 78) {
  if (!ex.increment) return 0;
  const raw = bodyweight * (START[ex.id] ?? 0.1);
  return Math.min(ex.maxWeight, Math.max(ex.minWeight, roundTo(raw, ex.increment)));
}

/**
 * Regroupe l'historique « une ligne par série » en séances.
 * Les entrées sont stockées de la plus récente à la plus ancienne.
 * Retourne [{ date, sets: [{weight, reps, feel}] (ordre chronologique) }], plus récente d'abord.
 */
export function sessionsOf(exId, lifts) {
  const rows = (lifts && lifts[exId]) || [];
  const groups = [];
  const index = new Map();
  for (const r of rows) {
    const key = r.sessionId || String(r.date || '').slice(0, 16);
    if (!index.has(key)) {
      const g = { key, date: r.date, sets: [] };
      index.set(key, g);
      groups.push(g);
    }
    index.get(key).sets.push(r);
  }
  groups.forEach((g) => {
    g.sets.reverse();
    if (g.sets.every((x) => x.set != null)) g.sets.sort((a, b) => a.set - b.set);
  });
  return groups;
}

const unitLabel = (ex) => (ex.unit === 'pdc' ? '' : ` ${ex.unit.split('/')[0]}`);
export const fmtLoad = (ex, w) => (ex.increment ? `${w}${unitLabel(ex)}` : 'PDC');
export const repsLabel = (ex) => (ex.timed ? 's' : 'reps');

/**
 * Prochaine cible pour un exercice.
 * checkin : null | 'good' | 'medium' | 'pain'
 */
export function nextTarget(ex, lifts, checkin, bodyweight) {
  const [lo, hi] = ex.repRange;
  const step = ex.increment;
  const sessions = sessionsOf(ex.id, lifts);

  if (!sessions.length) {
    const w = startingLoad(ex, bodyweight);
    return {
      weight: w,
      reps: lo,
      status: 'start',
      why: step ? `Charge de départ prudente, calculée pour ${bodyweight} kg` : 'Première séance : qualité avant quantité'
    };
  }

  const last = sessions[0].sets;
  const lastSet = last[last.length - 1];
  const weight = Number(lastSet.weight) || 0;
  const working = last.filter((s) => Number(s.weight) === weight);
  const minReps = Math.min(...working.map((s) => Number(s.reps) || 0));
  const allTop = working.length >= Math.min(ex.sets, last.length) && working.every((s) => s.reps >= hi);
  const hardCount = last.filter((s) => s.feel === 'hard').length;
  const struggled = last.some((s) => s.reps < lo) || hardCount >= Math.ceil(last.length / 2);

  if (checkin === 'pain') {
    return {
      weight: step ? Math.max(ex.minWeight, weight - step * 2) : 0,
      reps: lo,
      status: 'deload',
      why: 'Dos douloureux : charge nettement allégée, amplitude confortable'
    };
  }

  if (allTop && !hardCount) {
    if (!step) {
      return { weight: 0, reps: hi, status: 'hold', why: `${hi} ${repsLabel(ex)} maîtrisées : ralentis le tempo pour progresser` };
    }
    if (checkin === 'medium') {
      return { weight, reps: hi, status: 'hold', why: 'Prêt à monter, mais dos tendu : on consolide aujourd’hui' };
    }
    const w = Math.min(ex.maxWeight, weight + step);
    return {
      weight: w,
      reps: lo,
      status: 'bump',
      why: `+${step}${unitLabel(ex)} : toutes les séries à ${hi} ${repsLabel(ex)} la dernière fois`
    };
  }

  if (struggled) {
    const w = step ? Math.max(ex.minWeight, weight - step) : 0;
    return {
      weight: w,
      reps: lo,
      status: 'deload',
      why: step ? `−${step}${unitLabel(ex)} pour retrouver une forme propre` : 'Amplitude réduite, contrôle total'
    };
  }

  const reps = Math.min(hi, Math.max(lo, minReps + 1));
  return {
    weight,
    reps,
    status: 'reps',
    why: checkin === 'medium'
      ? 'Dos tendu : même charge, mouvement lent et contrôlé'
      : `Vise ${reps} ${repsLabel(ex)} à ${fmtLoad(ex, weight)} avant d’augmenter`
  };
}

/** Ajustement entre deux séries d'un même exercice selon le ressenti. */
export function adaptAfterSet(ex, lastSet) {
  let weight = Number(lastSet.weight) || 0;
  let reps = Number(lastSet.reps) || ex.repRange[0];
  let why = `Série suivante : même charge (${fmtLoad(ex, weight)})`;
  if (ex.increment && lastSet.feel === 'easy' && weight + ex.increment <= ex.maxWeight) {
    weight += ex.increment;
    why = `Trop facile : +${ex.increment}${unitLabel(ex)} sur cette série`;
  } else if (ex.increment && lastSet.feel === 'hard') {
    weight = Math.max(ex.minWeight, weight - ex.increment);
    why = `Trop dur : −${ex.increment}${unitLabel(ex)} pour protéger le dos`;
  } else if (!ex.increment && lastSet.feel === 'easy') {
    reps = Math.min(ex.repRange[1] + 4, reps + 1);
    why = 'Trop facile : +1 rep, garde le contrôle';
  }
  return { weight, reps, why };
}

/** Séquence à plat des séries pour une séance (supersets alternés). */
export function buildSequence(workoutId, short) {
  const w = WORKOUTS[workoutId];
  const pairs = short ? w.pairs.filter((p) => !p.accessory) : w.pairs;
  const seq = [];
  pairs.forEach((pair, pi) => {
    const sets = pair.exercises[0].sets;
    for (let s = 1; s <= sets; s++) {
      pair.exercises.forEach((ex, ei) => {
        seq.push({ pair: pi, pairName: pair.name, set: s, sets, ex, posInPair: ei, pairSize: pair.exercises.length });
      });
    }
  });
  return seq;
}

/** Meilleure charge par séance (pour les courbes). */
export function loadTrend(exId, lifts, n = 10) {
  return sessionsOf(exId, lifts)
    .slice(0, n)
    .map((s) => ({ date: s.date, weight: Math.max(...s.sets.map((x) => Number(x.weight) || 0)), reps: Math.max(...s.sets.map((x) => Number(x.reps) || 0)) }))
    .reverse();
}
