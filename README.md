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
  * Routine **Core Shield (5 min)** : validation 1-Tap autonome ou accès direct au chronomètre guidé.
  * **Disciplines Alternatives** : raccourcis rapides 1-Tap (750m Piscine, 1h30 Rando Zone 2, 20m Salle suspensions/dos) et tiroir unifié pour les formats personnalisés ou collés.
* **2. Progression (Feuille de route & Outils guidés)** :
  * **Roadmap 24 mois** : Progression guidée sur 12 paliers (de 100W à 180W+ sans dépasser 25 minutes).
  * **Core Shield (5 min)** : Chronomètre guidé des 4 exercices fondamentaux (Dead Bug, Bird-Dog, Glute Bridge, Fascia plantaire).
  * **Rameur & Tempo** : Métronome immersif 1:2 (1s poussée explosive / 2s glisse) et calculateur de SPI (Stroke Power Index).
* **3. Journal & Outils (Synthèse, Sauvegarde & Coach IA)** :
  * **Synthèse Globale** : Compteur d'activités, palier actif et dernier SPI enregistré.
  * **Barre d'actions 1-Tap** : Sauvegarde directe Google Drive, import Huawei/Concept2 et audit de régularité par IA.
  * **Coach IA Biomécanique & Chat** : Échange interactif direct, suggestions convertibles en séances (Ticket 1-Tap), multi-clés Gemini gratuites et bascule autonome sur moteur biomécanique local.
  * **Historique des Séances** : Journal chronologique complet avec badges de discipline.
* **🔔 Rappels PWA Automatiques** :
  * **Matin (< 8h)** : Notification pour lancer le check-in quotidien et la séance conseillée.
  * **Soir (~ 21h)** : Rappel de bienveillance si aucune activité ni Core Shield n'ont été validés.
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
