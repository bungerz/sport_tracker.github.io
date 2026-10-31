// ============================================================
// Coach IA (Gemini) : vrai appel API, contexte personnel, tickets de séance
// ============================================================

import { WORKOUTS, ROWER, ROUTINES, TYPES } from './data.js';
import { html, raw, esc, icon, fmtShort } from './lib.js';
import { S, titleOf, goalProgress } from './store.js';

const TICKET_RE = /```(?:json)?\s*\[SESSION_DATA\]([\s\S]*?)\[\/SESSION_DATA\]\s*```|\[SESSION_DATA\]([\s\S]*?)\[\/SESSION_DATA\]/;

function systemPrompt() {
  const recent = S.workouts.slice(0, 12).map((w) => {
    const bits = [`${fmtShort(w.date)} ${titleOf(w)}`];
    if (w.durationMin) bits.push(`${w.durationMin} min`);
    if (w.watts) bits.push(`${w.watts} W @ ${w.cadence || '?'} s/m`);
    if (w.sets?.length) bits.push(w.sets.map((s) => `${s.name || s.exerciseId} ${s.weight}×${s.reps}${s.feel === 'hard' ? '(dur)' : ''}`).join(', '));
    return '- ' + bits.join(' · ');
  }).join('\n') || '- (aucune séance enregistrée)';
  const goals = goalProgress().map((g) => `${g.label} ${g.done}/${g.target}`).join(', ');
  const progs = Object.values(WORKOUTS).map((w) => `${w.title} : ${w.pairs.flatMap((p) => p.exercises).map((e) => `${e.name} ${e.sets}×${e.repRange.join('-')}`).join(', ')}`).join('\n');

  return `Tu es le coach biomécanique personnel de l'utilisateur, dans l'app « Health OS ». Réponds en français, en tutoyant, de façon concise et concrète (listes courtes, pas de longs paragraphes).

PROFIL
- Poids : ${S.bodyweight} kg. Fragilité discale L4-L5, posture de bureau (antéversion, épaules enroulées), voûte plantaire droite affaissée.
- Dos aujourd'hui : ${S.checkin.status || 'non renseigné'} (good = solide, medium = tendu, pain = douleur).
- Règles Spine-First : aucune charge axiale lombaire, bancs 30–45° / 75–80°, trépied plantaire, rameur damper 3–4 à basse cadence (puissance par coup, SPI = W ÷ cadence).
- Objectifs hebdo : 3 muscu, 2 rameur, routine sol tous les soirs. Cette semaine : ${goals}.
- Nutrition : 1,6 g protéines/kg, déficit 300–500 kcal.

PROGRAMME
${progs}
${ROWER.title} : échauffement 3 min feet out puis 10 × (1 min ${ROWER.targetWatts} @ ${ROWER.targetSpm} / 1 min repos).
${ROUTINES.floor.title} : ${ROUTINES.floor.steps.map((s) => s.name).join(', ')}.
${ROUTINES.desk.title} : ${ROUTINES.desk.steps.map((s) => s.name).join(', ')}.

DERNIÈRES SÉANCES
${recent}

SÉCURITÉ : en cas de douleur aiguë, irradiante, d'engourdissement ou de perte de force, recommande de consulter un professionnel de santé plutôt que d'adapter l'entraînement.

TICKET DE SÉANCE : si l'utilisateur te demande de consigner ou de proposer une séance qu'il va réaliser, termine ta réponse par un seul bloc :
[SESSION_DATA]{"type":"WORK_GYM|CONCEPT2|CORE_SHIELD|SWIM|HIKE|OTHER","title":"titre court","durationMin":30,"notes":"détail en une ligne"}[/SESSION_DATA]
L'utilisateur pourra l'enregistrer en un tap. N'en mets pas sinon.`;
}

export function parseTicket(text) {
  const m = text.match(TICKET_RE);
  if (!m) return null;
  try {
    const data = JSON.parse((m[1] || m[2]).trim());
    const type = TYPES[data.type] ? data.type : 'OTHER';
    return {
      type,
      title: String(data.title || TYPES[type].label).slice(0, 60),
      durationMin: Math.max(1, Math.min(600, Number(data.durationMin) || 30)),
      notes: String(data.notes || '').slice(0, 300)
    };
  } catch (e) {
    return null;
  }
}

function formatText(text) {
  const clean = text.replace(TICKET_RE, '').trim();
  const lines = esc(clean).split('\n');
  let out = '';
  let inList = false;
  for (const line of lines) {
    const li = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (li) {
      if (!inList) { out += '<ul>'; inList = true; }
      out += `<li>${li[1]}</li>`;
      continue;
    }
    if (inList) { out += '</ul>'; inList = false; }
    out += line.trim() ? `<p>${line}</p>` : '';
  }
  if (inList) out += '</ul>';
  return out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
}

export function renderMessage(m, i) {
  if (m.role === 'user') return html`<div class="bubble me">${m.text}</div>`;
  const ticket = !m.error && parseTicket(m.text);
  return html`<div class="bubble ai ${m.error ? 'err' : ''}">
    ${raw(formatText(m.text))}
    ${ticket ? html`<button class="ticket" data-act="ticket" data-v="${i}" ${m.saved ? 'disabled' : ''}>
      ${icon(m.saved ? 'check' : 'bolt')}
      <span><b>${m.saved ? 'Enregistrée' : 'Enregistrer cette séance'}</b><small>${ticket.title} · ${ticket.durationMin} min</small></span>
    </button>` : ''}
  </div>`;
}

export async function askCoach(question) {
  const { geminiKey, geminiModel } = S.settings;
  const history = S.chat.messages.filter((m) => !m.error).slice(-12).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));
  history.push({ role: 'user', parts: [{ text: question }] });

  const model = (geminiModel || 'gemini-2.5-flash').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey.trim() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt() }] },
        contents: history,
        generationConfig: { temperature: 0.6, maxOutputTokens: 1200 }
      }),
      signal: ctrl.signal
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `Erreur ${res.status}`;
      throw new Error(res.status === 400 || res.status === 403 ? `Clé ou modèle refusé : ${msg}` : msg);
    }
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (!text) throw new Error('Réponse vide du modèle.');
    return text;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Le coach met trop de temps à répondre. Réessaie.');
    if (!navigator.onLine) throw new Error('Hors-ligne : le coach IA a besoin d’une connexion.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const ticketToWorkout = (t) => ({
  type: t.type,
  kind: { WORK_GYM: 'gym', CONCEPT2: 'rower', CORE_SHIELD: 'floor', SWIM: 'swim', HIKE: 'hike' }[t.type] || 'other',
  title: t.title,
  durationMin: t.durationMin,
  notes: t.notes ? `${t.notes} (coach IA)` : 'Proposée par le coach IA'
});

