// ============================================================
// Programmes, protocoles et contenus (source unique de vérité)
// ============================================================

export const WORKOUTS = {
  A: {
    id: 'A',
    kind: 'gym_a',
    title: 'Muscu A',
    subtitle: 'Tirage buste appuyé & développé incliné',
    minutes: 35,
    rule: 'Spine-First : banc incliné 30–45°, zéro charge axiale lombaire.',
    pairs: [
      {
        name: 'Superset 1 · Dos & pectoraux',
        exercises: [
          {
            id: 'chest_supported_db_row',
            name: 'Rowing buste appuyé',
            full: 'Chest-Supported DB Row',
            sets: 3, repRange: [10, 12], increment: 1, unit: 'kg/haltère',
            minWeight: 4, maxWeight: 32,
            cue: 'Banc incliné 30–45°. Buste relâché sur le dossier. Tire les coudes vers les hanches, zéro tension lombaire.',
            equipment: 'Banc inclinable + 2 haltères'
          },
          {
            id: 'incline_db_bench_press',
            name: 'Développé incliné haltères',
            full: 'Incline DB Bench Press',
            sets: 3, repRange: [10, 12], increment: 1, unit: 'kg/haltère',
            minWeight: 4, maxWeight: 36,
            cue: 'Banc à 30°. Plaque le bas du dos contre le dossier (pieds sur le rebord du banc si tu cambres).',
            equipment: 'Banc incliné + 2 haltères'
          }
        ]
      },
      {
        name: 'Superset 2 · Jambes & gainage',
        exercises: [
          {
            id: 'bulgarian_split_squat',
            name: 'Split squat bulgare',
            full: 'Bulgarian Split Squat',
            sets: 3, repRange: [8, 10], increment: 1, unit: 'kg/haltère',
            minWeight: 0, maxWeight: 26,
            cue: 'Trépied plantaire : gros orteil, petit orteil et talon dans le sol. Genou avant aligné avec le 2e orteil.',
            alternative: 'Goblet squat (talons calés sur disques)',
            equipment: 'Banc + haltères (ou poids de corps)'
          },
          {
            id: 'deadbug',
            name: 'Deadbug',
            full: 'Deadbug anti-extension',
            sets: 3, repRange: [8, 8], increment: 0, unit: 'pdc',
            minWeight: 0, maxWeight: 0,
            cue: 'Écrase les lombaires dans le sol. Si le bas du dos décolle quand la jambe s’allonge, réduis l’amplitude.',
            alternative: 'Planche sur les genoux avec rétroversion',
            equipment: 'Tapis de sol'
          }
        ]
      },
      {
        name: 'Finisher · Épaules',
        accessory: true,
        exercises: [
          {
            id: 'db_lateral_raise',
            name: 'Élévations latérales',
            full: 'DB Lateral Raise',
            sets: 3, repRange: [12, 15], increment: 1, unit: 'kg/haltère',
            minWeight: 2, maxWeight: 16,
            cue: 'Assis sur banc droit. Coudes légèrement fléchis, élève à 45° dans le plan scapulaire.',
            equipment: 'Haltères légers'
          }
        ]
      }
    ]
  },
  B: {
    id: 'B',
    kind: 'gym_b',
    title: 'Muscu B',
    subtitle: 'Tirage vertical & presse à cuisses',
    minutes: 35,
    rule: 'Spine-First : banc à 75–80°, presse sans jamais décoller le coccyx.',
    pairs: [
      {
        name: 'Superset 1 · Dos large & épaules',
        exercises: [
          {
            id: 'lat_pulldown',
            name: 'Tirage vertical poulie',
            full: 'Lat Pulldown Machine',
            sets: 3, repRange: [10, 12], increment: 5, unit: 'kg',
            minWeight: 15, maxWeight: 90,
            cue: 'Buste incliné à 10° max. Côtes verrouillées vers le bas, sans cambrer.',
            equipment: 'Machine tirage vertical'
          },
          {
            id: 'seated_db_ohp',
            name: 'Développé épaules assis',
            full: 'Seated DB Overhead Press',
            sets: 3, repRange: [10, 12], increment: 1, unit: 'kg/haltère',
            minWeight: 4, maxWeight: 28,
            cue: 'Banc à 75–80° (jamais 90°) pour protéger les épaules et supprimer le stress lombaire.',
            equipment: 'Banc réglable + haltères'
          }
        ]
      },
      {
        name: 'Superset 2 · Ischios & presse',
        exercises: [
          {
            id: 'seated_leg_curl',
            name: 'Leg curl assis',
            full: 'Seated Leg Curl Machine',
            sets: 3, repRange: [10, 12], increment: 5, unit: 'kg',
            minWeight: 15, maxWeight: 80,
            cue: 'Stabilise le bassin en rétroversion. Contrôle la descente sur 2 secondes.',
            alternative: 'Romanian deadlift haltères (stop aux genoux)',
            equipment: 'Machine leg curl (ou 2 haltères)'
          },
          {
            id: 'leg_press',
            name: 'Presse à cuisses',
            full: 'Leg Press Machine',
            sets: 3, repRange: [10, 12], increment: 5, unit: 'kg',
            minWeight: 30, maxWeight: 160,
            cue: 'Ne descends JAMAIS au point où le coccyx décolle du siège (sécurité L4-L5).',
            alternative: 'Step-ups haltères lents sur banc',
            equipment: 'Presse à cuisses'
          }
        ]
      },
      {
        name: 'Finisher · Gainage latéral',
        accessory: true,
        exercises: [
          {
            id: 'suitcase_carry',
            name: 'Marche de la valise',
            full: 'Suitcase Carry',
            sets: 3, repRange: [40, 40], timed: true, increment: 2, unit: 'kg/main',
            minWeight: 8, maxWeight: 36,
            cue: 'Marche droite avec un seul haltère lourd. Verrouille le carré des lombes et les obliques.',
            equipment: '1 haltère lourd'
          }
        ]
      }
    ]
  }
};

export const ROWER = {
  id: 'rower',
  kind: 'rower',
  title: 'Rameur Rebuild 10×1′',
  subtitle: 'Finisher post-séance ou à la maison',
  minutes: 23,
  rounds: 10,
  workSec: 60,
  restSec: 60,
  warmupSec: 180,
  targetWatts: '120–140 W',
  targetSpm: '22–24 s/m',
  damper: '3–4 (drag 110–115)',
  cues: [
    'Damper 3–4 (drag 110–115 sur le PM5) : jamais de damper haut qui détruit le bas du dos.',
    'Échauffement 3 min pieds libres (feet out) : empêche de tirer avec les psoas.',
    '10 × (1 min ON / 1 min OFF) : buste à 11 h avant que les genoux fléchissent au retour.'
  ]
};

// Routines guidées (sol, bureau). `sides` double le nombre de tenues (gauche/droite).
export const ROUTINES = {
  floor: {
    id: 'floor',
    kind: 'floor',
    title: 'Routine sol du soir',
    subtitle: 'Anti-flexion lombaire · 4 min',
    minutes: 4,
    steps: [
      { name: 'Glute bridge', dose: '2 × 12 reps · tenue 3 s en haut', sets: 2,
        cue: 'Serre fort les fessiers en haut en gardant les côtes basses. Réveille les fessiers endormis par la position assise.' },
      { name: 'Bird-dog', dose: '2 × 6 reps / côté · tenue 5 s', sets: 2,
        cue: 'À 4 pattes, allonge bras et jambe opposée à l’horizontale. Ne cambre pas, ne vrille pas le bassin.' },
      { name: 'Gainage latéral (genoux)', dose: '2 × 30 s / côté', sets: 2, sides: true, timerSec: 30,
        cue: 'En appui sur le coude et les genoux fléchis. Stabilise la colonne avec un stress discal minimal.' }
    ]
  },
  desk: {
    id: 'desk',
    kind: 'desk',
    title: 'Sas décompression bureau',
    subtitle: 'Transition assis → entraînement · 3 min',
    minutes: 3,
    steps: [
      { name: 'Chevalier servant actif', dose: '60 s / côté', sets: 1, sides: true, timerSec: 60,
        cue: 'Rétroverse le bassin et contracte le fessier arrière pour étirer le psoas.' },
      { name: 'Suspension passive', dose: '45 s', sets: 1, timerSec: 45,
        cue: 'Suspends-toi à une barre, ou étire la colonne mains posées sur le bureau.' },
      { name: 'Respiration diaphragmatique 360°', dose: '45 s', sets: 1, timerSec: 45,
        cue: 'Inspire dans le bas du dos et les flancs sans hausser les épaules.' }
    ]
  }
};

// Protocole « dos douloureux » : sas bureau puis routine sol.
ROUTINES.relief = {
  id: 'relief',
  kind: 'floor',
  title: 'Protocole décompression',
  subtitle: 'Sas bureau + routine sol · 7 min',
  minutes: 7,
  steps: [...ROUTINES.desk.steps, ...ROUTINES.floor.steps]
};

export const ROWER_LEVELS = [
  { level: 1, watts: '100–105 W', format: '3 × 4 min', spi: '5.00' },
  { level: 2, watts: '105–110 W', format: '4 × 4 min', spi: '5.25' },
  { level: 3, watts: '110–115 W', format: '4 × 4 min', spi: '5.50' },
  { level: 4, watts: '115–120 W', format: '4 × 4 min', spi: '5.75' },
  { level: 5, watts: '120–125 W', format: '4 × 4 min', spi: '6.00' },
  { level: 6, watts: '125–130 W', format: '4 × 4 min', spi: '6.25' },
  { level: 7, watts: '130–135 W', format: '4 × 4 min', spi: '6.50' },
  { level: 8, watts: '135–140 W', format: '4 × 4 min', spi: '6.75' },
  { level: 9, watts: '140–150 W', format: '4 × 4 min', spi: '7.00' },
  { level: 10, watts: '150–160 W', format: '4 × 4 min', spi: '7.50' },
  { level: 11, watts: '160–170 W', format: '4 × 4 min', spi: '8.00' },
  { level: 12, watts: '170–180+ W', format: '4 × 4 min', spi: '8.50' }
];
export const ROWER_LEVEL_CADENCE = '18–20 s/m';
export const ROWER_LEVEL_REST = '1 min';

export const AUDIT = [
  {
    title: 'Posture & châssis de bureau',
    text: 'Épaules enroulées, bascule antérieure du bassin (antéversion) qui tasse L4-L5. Masse musculaire pectoraux/deltoïdes/dorsaux basse par rapport au stockage abdominal.'
  },
  {
    title: 'Chaîne inférieure & pied droit',
    text: 'Faible volume fessiers/quadriceps et affaissement de la voûte plantaire droite (pronation). Elle entraîne une rotation interne tibia/fémur et surcharge le bas du dos.'
  },
  {
    title: 'Pourquoi le rameur fait mal à 100 W',
    text: '100 W à 20 s/m est une charge légère (~2:32/500 m). Si le dos fait mal, tu compenses des fessiers/ischios faibles en pliant les lombaires au lieu des hanches, et tu tires avec les psoas.'
  },
  {
    title: 'Zéro temps & nutrition',
    text: 'Impossible de perdre la graisse abdominale uniquement au rameur sans abîmer le dos. Solution : 3 séances muscu de 35 min/semaine + déficit de 300 à 500 kcal avec 1,6 g de protéines/kg.'
  }
];

// Types d'activité (champ `type` historique, conservé pour compatibilité)
export const TYPES = {
  WORK_GYM: { label: 'Muscu', tone: 'gym', icon: 'dumbbell' },
  CONCEPT2: { label: 'Rameur', tone: 'row', icon: 'waves' },
  CORE_SHIELD: { label: 'Gainage', tone: 'core', icon: 'shield' },
  SWIM: { label: 'Natation', tone: 'swim', icon: 'swim' },
  HIKE: { label: 'Rando', tone: 'hike', icon: 'mountain' },
  OTHER: { label: 'Autre', tone: 'other', icon: 'spark' }
};

// Sous-types plus fins (champ `kind`)
export const KINDS = {
  gym_a: { type: 'WORK_GYM', title: 'Muscu A' },
  gym_b: { type: 'WORK_GYM', title: 'Muscu B' },
  gym: { type: 'WORK_GYM', title: 'Muscu' },
  rower: { type: 'CONCEPT2', title: 'Rameur' },
  floor: { type: 'CORE_SHIELD', title: 'Routine sol' },
  desk: { type: 'CORE_SHIELD', title: 'Sas bureau' },
  swim: { type: 'SWIM', title: 'Natation' },
  hike: { type: 'HIKE', title: 'Randonnée' },
  other: { type: 'OTHER', title: 'Activité' }
};

// Formulaire « ajouter une activité »
export const QUICK_ADD = [
  { kind: 'swim', label: 'Natation', icon: 'swim', tone: 'swim', minutes: 40, distance: 750, distUnit: 'm', note: 'Piscine · décompression' },
  { kind: 'hike', label: 'Randonnée', icon: 'mountain', tone: 'hike', minutes: 90, distance: 6, distUnit: 'km', note: 'Zone 2 montagne' },
  { kind: 'rower', label: 'Rameur libre', icon: 'waves', tone: 'row', minutes: 20, watts: 130, spm: 22 },
  { kind: 'gym', label: 'Muscu libre', icon: 'dumbbell', tone: 'gym', minutes: 35 },
  { kind: 'desk', label: 'Sas bureau', icon: 'briefcase', tone: 'desk', minutes: 3 },
  { kind: 'other', label: 'Autre', icon: 'spark', tone: 'other', minutes: 30 }
];

export const GOALS = [
  { id: 'gym', label: 'Muscu', target: 3, tone: 'gym' },
  { id: 'row', label: 'Rameur', target: 2, tone: 'row' },
  { id: 'floor', label: 'Sol', target: 7, tone: 'core' }
];

export const PROTEIN_PER_KG = 1.6;
