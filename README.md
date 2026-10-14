# Health & Longevity OS

Application web progressive (PWA) personnelle dédiée à la longévité athlétique, la santé discale (L4-L5) et l'optimisation biomécanique sur rameur Concept2, natation et montagne.

---

## 🎯 Philosophie & Principes

* **Sécurité lombaire absolue** : Prévention des spasmes du psoas, sas de décompression bureau → sport, renforcement du transverse et des fessiers.
* **Puissance à basse cadence (Torque)** : Travail systématique à 18–22 s/m avec un *Stroke Power Index* (SPI) élevé (≥ 5.0).
* **Zéro friction** : Bilan en 3 taps, validation des séances en 1 clic, fonctionnement autonome et 100% hors-ligne.

---

## ⚡ Architecture 3 Onglets & Ergonomie

* **1. Aujourd'hui (Centre de décision quotidien)** :
  * Triage biomécanique instantané (0 ms) et prescription ajustée du jour avec steppers rapides (+/- 5W, +/- 1 cad).
  * **Programme Musculation 35m (A/B)** : Alternance Workout A / B avec lanceur guidé pas-à-pas (supersets & repos 45s) et validation 1-Tap.
  * **Rameur Rebuild 10×1m** : Bascule 1-clic entre le protocole décompressif 10×(1m ON / 1m OFF @ 120–140W) et la roadmap classique.
  * **Routine Sol Soir (4 min)** : Anti-flexion lombaire pour le soir (Glute bridge, Bird-Dog, Gainage latéral) avec timer guidé ou 1-Tap.
  * **Sas Bureau & Disciplines Alternatives** : Raccourcis rapides 1-Tap (Sas décompression bureau, Natation 750m, Rando Zone 2) et tiroir unifié.
* **2. Entraînement & Progression (Hub 5 Sous-onglets)** :
  * **Muscu 35m** : Détail complet des séances A & B, consignes biomécaniques (Spine-First, banc 30-45°, trépied plantaire), lanceur et timer 45s.
  * **Rameur Fix** : Diagnostic Concept2, réglage Damper 3-4 (Drag 110-115), échauffement 3m Feet Out, chrono d'intervalles 10×1m, métronome 1:2 et SPI.
  * **Sol & Core** : Routine Sol Soirée 4 min (zéro crunch, renforcement fessiers/obliques) et routine Core Shield 5 min.
  * **Audit & Nutri** : Audit biomécanique complet (posture assise, lordose/bassin, affaissement voûte plantaire) et calculateur interactif protéines (1.6g/kg) & déficit (-300 à -500 kcal).
  * **12 Paliers** : Feuille de route 24 mois (de 100W à 180W+ sans dépasser 25 minutes).
* **3. Journal & Outils (Synthèse, Sauvegarde & Coach IA)** :
  * **Synthèse Globale** : Compteur d'activités, palier actif et dernier SPI enregistré.
  * **Barre d'actions 1-Tap** : Sauvegarde directe Google Drive, import Huawei/Concept2 et audit de régularité par IA.
  * **Coach IA Biomécanique & Chat** : Échange interactif direct, intégration de l'audit postural et des règles Spine-First, génération de tickets séances [SESSION_DATA] exécutables en 1-Tap, multi-clés Gemini gratuites et fallback local.
  * **Historique des Séances** : Journal chronologique complet avec badges spécifiques (`WORKOUT A`, `WORKOUT B`, `RAMEUR 10×1M`, `SOL SOIR`, `CORE SHIELD`).
* **🔔 Rappels PWA Automatiques** :
  * **Matin (< 8h)** : Notification pour lancer le check-in quotidien et la séance conseillée.
  * **Soir (~ 21h)** : Rappel de bienveillance pour la routine sol soirée de 4 minutes ou Core Shield.
* **☁️ Synchronisation & Imports** :
  * **Drive 1-Tap** : Sauvegarde instantanée vers Google Drive sans manipulation de fichiers intermédiaires.
  * **Imports Matériel** : Montre Huawei Santé (`.tcx`, `.gpx`), Concept2 ErgData (`.csv`) ou collage de texte partagé.

---

## 📱 Installation (PWA Mobile)

1. Ouvrez l'application dans votre navigateur mobile (Safari sur iOS, Chrome sur Android).
2. Touchez **Partager** (iOS) ou le **Menu ⋮** (Android) puis sélectionnez **« Sur l'écran d'accueil »**.
3. L'application s'exécute en plein écran avec prise en charge du mode hors-ligne.

---

## 🔒 Confidentialité & Sécurité

* **100% Local** : Toutes les séances et constantes restent stockées dans le `localStorage` de votre appareil.
* **Clé API Gemini** : Si renseignée, elle est conservée strictement sur votre téléphone et n'est jamais exposée ni envoyée à un serveur tiers.
