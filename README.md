# Health OS

Coach sport-santé personnel (PWA) : musculation **Spine-First** pour protéger L4-L5, rameur Concept2 à basse cadence, routine dos du soir. Tout est stocké sur le téléphone et l’app fonctionne **100 % hors-ligne**.

## Les 4 onglets

| Onglet | Contenu |
| --- | --- |
| **Aujourd’hui** | Semaine en un coup d’œil (jours actifs + objectifs 3 muscu / 2 rameur / 7 sol), check-in dos en 1 tap, prochaine séance avec les **charges cibles déjà calculées**, rituels du jour (routine sol, finisher rameur, sas bureau) à lancer ou valider en 1 tap, ajout d’une activité libre (natation, rando, etc.). |
| **Programme** | Semaine type, fiches complètes Muscu A / B (consignes, matériel, alternatives, prochaine cible), protocole rameur, feuille de route 12 paliers, routines sol et bureau, bilan biomécanique. |
| **Progrès** | Anneaux d’objectifs de la semaine, statistiques sur 30 jours, graphique des 8 dernières semaines, courbe de charge par exercice, puissance/SPI rameur, poids et cible protéines, journal détaillé (touche une séance pour le détail ou la supprimer). |
| **Profil** | Poids de corps, durée de repos, sons / vibrations / voix, thème (auto, clair, sombre), coach IA, export / import / effacement des données. |

## Modes séance plein écran

- **Muscu** : un exercice à la fois, grandes commandes charge/reps, consigne et alternative « machine prise ? ». On valide chaque série par son ressenti (*Facile / Parfait / Dur*) : la série suivante est ajustée automatiquement. Supersets : 20 s d’enchaînement entre A et B, repos complet (45 s par défaut) en fin de tour. Annuler / passer une série, récapitulatif avant enregistrement, séance reprise automatiquement si l’app est fermée.
- **Rameur** : échauffement 3 min pieds libres puis 10 × (1′ effort / 1′ repos), bips et annonces à chaque phase, pause, puis saisie des watts/cadence moyens (SPI calculé).
- **Routines sol / bureau / décompression** : minuteurs pour les tenues, suivi des côtés et des séries.

Les minuteurs reposent sur l’heure réelle : ils restent justes même écran verrouillé. L’écran reste allumé pendant une séance (Wake Lock).

## Moteur de progression

- Charges de départ prudentes calculées à partir du poids de corps.
- **Double progression** : toutes les séries au haut de la fourchette → +1 palier de charge et retour au bas de la fourchette ; sinon +1 rep visée ; séance difficile → charge allégée.
- Check-in **Tendu** : charges maintenues. **Douleur** : la séance muscu est remplacée par le protocole décompression (sas bureau + routine sol).

## Coach IA (optionnel)

Ajoute une clé API Gemini (gratuite sur aistudio.google.com) dans **Profil → Coach IA**. Le coach connaît ton programme, ton état du jour et tes dernières séances ; il peut proposer une séance à enregistrer en 1 tap. La clé reste sur l’appareil et n’est envoyée qu’à l’API Google.

## Installation

1. Ouvre le site dans Safari (iOS) ou Chrome (Android).
2. **Partager → Sur l’écran d’accueil** (iOS) ou **⋮ → Installer l’application** (Android).

## Technique

- HTML/CSS/JavaScript natif (modules ES), **aucune dépendance ni étape de build** : il suffit de servir le dossier (GitHub Pages).
- `js/data.js` programmes · `js/engine.js` progression · `js/store.js` état et stockage · `js/views.js` écrans · `js/runners.js` modes séance · `js/coach.js` coach IA · `js/app.js` démarrage et actions.
- Données dans `localStorage` (clés `health_os_*`) — les données des versions précédentes sont reprises automatiquement. L’export JSON contient séances, charges, pesées et réglages (sans la clé API).
- Test local : `python3 -m http.server` puis http://localhost:8000.
