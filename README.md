# Health & Longevity OS

Application web progressive (PWA) personnelle dédiée à la longévité athlétique, la santé discale (L4-L5) et l'optimisation biomécanique sur rameur Concept2, natation et montagne.

---

## 🎯 Philosophie & Principes

* **Sécurité lombaire absolue** : Prévention des spasmes du psoas, sas de décompression bureau → sport, renforcement du transverse et des fessiers.
* **Puissance à basse cadence (Torque)** : Travail systématique à 18–22 s/m avec un *Stroke Power Index* (SPI) élevé (≥ 5.0).
* **Zéro friction** : Bilan en 3 taps, validation des séances en 1 clic, fonctionnement autonome et 100% hors-ligne.

---

## ⚡ Fonctionnalités Clés

* **Aujourd'hui** : Triage biomécanique instantané (0 ms), prescription ajustée du jour avec steppers rapides (+/- 5W, +/- 1 cad) et raccourcis 1-Tap (Piscine, Randonnée, Salle).
* **Entraînement (Hub unifié)** :
  * **Feuille de route 24 mois** : Progression guidée sur 12 paliers (de 100W à 180W+).
  * **Rameur & Tempo** : Métronome immersif 1:2 (1s poussée explosive / 2s glisse lente) et calculateur de SPI.
  * **Core Shield (5 min)** : Chronomètre guidé des 4 exercices fondamentaux (Dead Bug, Bird-Dog, Glute Bridge, Fascia plantaire).
* **Journal de bord** : Historique multi-disciplines (Concept2, Natation, Randonnée, Salle) et audit longitudinal.
* **Coach IA (Gemini & Moteur Local)** :
  * Générateur de séances sur-mesure avec **Ticket de Séance 1-Tap** intégrable directement dans le journal.
  * Chat biomécanique interactif avec suggestions convertibles en séances.
  * Support **multi-clés Gemini** avec testeur de connexion instantané et bascule transparente vers le moteur local autonome en cas d'absence de réseau ou de quota atteint.
* **Notifications PWA & Rappels** : Rappels quotidiens et alerte de fin de routine Core Shield.
* **Synchronisation & Sauvegarde** :
  * ☁️ **Drive 1-Tap** : Sauvegarde directe sur Google Drive via la Web Share API native.
  * ⌚ **Imports Matériel** : Prise en charge des fichiers Huawei Santé (`.tcx`, `.gpx`), exports Concept2 (`.csv`) et collage de résumés texte.
  * 🎨 **Thèmes visuels** : Épure Claire, Forêt Alpine, Graphite Mat.

---

## 📱 Installation (PWA Mobile)

1. Ouvrez l'application dans votre navigateur mobile (Safari sur iOS, Chrome sur Android).
2. Touchez **Partager** (iOS) ou le **Menu ⋮** (Android) puis sélectionnez **« Sur l'écran d'accueil »**.
3. L'application s'exécute en plein écran avec prise en charge du mode hors-ligne.

---

## 🔒 Confidentialité & Sécurité

* **100% Local** : Toutes les séances et constantes restent stockées dans le `localStorage` de votre appareil.
* **Clé API Gemini** : Si renseignée, elle est conservée strictement sur votre téléphone et n'est jamais exposée ni envoyée à un serveur tiers.
