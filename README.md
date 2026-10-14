# Health & Longevity OS

Application web progressive (PWA) personnelle dédiée à la longévité athlétique, la santé discale (L4-L5) et l'optimisation biomécanique sur rameur Concept2, natation et montagne.

---

## 🎯 Philosophie & Principes

* **Sécurité lombaire absolue** : Prévention des spasmes du psoas, sas de décompression bureau → sport, renforcement du transverse et des fessiers.
* **Puissance à basse cadence (Torque)** : Travail systématique à 18–22 s/m avec un *Stroke Power Index* (SPI) élevé (≥ 5.0).
* **Zéro friction** : Bilan en 3 taps, validation des séances en 1 clic, fonctionnement autonome et 100% hors-ligne.

---

## ⚡ Architecture 4 Onglets & Companion UX (« No-Brainer »)

* **1. Aujourd'hui (Dashboard Zéro Friction)** :
  * **Carte Héro Prochaine Séance** : Grand bouton dominant `[ ▶ COMMENCER LA SÉANCE ]`, alternance A/B mémorisée, aperçu des exercices et mode express « ⚡ 20 min chrono ».
  * **Check-in Dos 1-Tap (👍 Solide / 😐 Tendu / ⚠️ Douleur)** : Triage biomécanique instantané qui adapte dynamiquement la séance principale (en cas de douleur, remplacement automatique par le Sas décompression + routine sol).
  * **Raccourcis 1-Ligne Rapides** : Routine Sol Soir (4 min) et Finisher Rameur 10×1m avec lancement direct ou validation 1-Tap.
  * **Rail Hebdomadaire (L M M J V S D)** : Visualisation immédiate des jours validés et du streak d'assiduité 🔥.
  * **Bouton « + Autre activité »** : Tiroir unifié pour la natation (750m), la rando, le sas bureau ou la saisie libre.
* **2. Plan (Feuille de Route & Bibliothèque)** :
  * **Cycle Hebdo Musculation** : Alternance A-B-A / B-A-B détaillée avec les règles biomécaniques Spine-First (bancs 30–45° et 75–80°, trépied plantaire).
  * **Fiches de Séances Complètes** : Workout A, Workout B, Rameur Rebuild 10×1m, Routine Sol Soirée 4 min et Sas Bureau 3 min.
  * **Feuille de Route 24 mois** : Progression guidée sur 12 paliers Concept2 (de 100W à 180W+ à basse cadence 18–20 s/m).
* **3. Progrès (Objectifs, Métriques & Historique)** :
  * **Jauges d'Objectifs Hebdo** : Suivi de complétion Muscu (3x), Rameur (2x) et Routine Sol (7x).
  * **Nutrition & Poids** : Calculateur interactif du ratio de protéines (1.6 g/kg de poids de corps) et déficit calorique cible (-300 à -500 kcal).
  * **Historique Complet & Détaillé** : Journal de toutes les séances enregistrées avec détail des séries (charges, répétitions, volume total en kg).
* **4. Moi (Bilan Biomécanique, IA & Réglages)** :
  * **Bilan Biomécanique & Réalité** : Diagnostic complet (posture assise, lordose, affaissement voûte plantaire, douleur à 100W sur rameur).
  * **Coach IA Biomécanique** : Chat interactif avec tickets de séance `[SESSION_DATA]` exécutables en 1-Tap.
  * **Retour Sensoriel & PWA** : Thème sombre haute visibilité / thème clair, carillons sonores synthétisés, retour haptique (vibrations) et annonces vocales (Web Speech API).
  * **Gestion des Données** : Export & Import JSON hors-ligne, sauvegarde automatique.

---

## 🏋️ Mode Salle Plein Écran (Session Runner)

* **Zéro réflexion mentale** : Un seul exercice à la fois avec grands chiffres tactiles (48px+), steppers poids/reps, et consigne clé en 1 ligne.
* **Moteur Coach Adaptatif** :
  * **Charges de départ suggérées** basées sur votre poids de corps et profil prudent (dos L4-L5).
  * **Adaptation INTRA-séance** : Enregistrement du ressenti (🟢 Facile / 🔵 Parfait / 🔴 Dur). Si une série est trop facile, le coach augmente la charge de la suivante ; si trop dure, il l'allège automatiquement pour sécuriser le dos.
  * **Adaptation INTER-séances** : Double progression automatique (rep max atteint sur toutes les séries → augmentation de charge).
  * **Option « Machine prise ? »** : Remplacement immédiat par l'alternative sans charge axiale (Bulgarian Split Squat ⇄ Goblet Squat talons calés, Leg Curl ⇄ RDL contrôlé).
* **Minuteur de Repos Automatique (45s)** : Décompte en anneau avec transitions sonores et vibrations.
* **Sécurité Écran Allumé (Wake Lock)** : L'écran reste allumé durant l'effort.
* **100% Hors-Ligne & Résilient** : Service worker v3 avec mise en cache runtime des CDN (Tailwind, React, Babel).

---

## 📱 Installation (PWA Mobile)

1. Ouvrez l'application dans votre navigateur mobile (Safari sur iOS, Chrome sur Android).
2. Touchez **Partager** (iOS) ou le **Menu ⋮** (Android) puis sélectionnez **« Sur l'écran d'accueil »**.
3. L'application s'exécute en plein écran avec prise en charge du mode hors-ligne.

---

## 🔒 Confidentialité & Sécurité

* **100% Local** : Toutes les séances et constantes restent stockées dans le `localStorage` de votre appareil.
* **Clé API Gemini** : Si renseignée, elle est conservée strictement sur votre téléphone et n'est jamais exposée ni envoyée à un serveur tiers.
