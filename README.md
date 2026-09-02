# Hangman AI 🕵️‍♂️🔍

A full-stack, real-time Noir Detective Hangman web application featuring a character-level Statistical N-Gram Language Model, an unlockable **4-Tier Character Companion Progression System**, real-time WebSockets multiplayer, an interactive 3D animated game board, and a live AI Reasoning Explainer dashboard.

Live Demo: https://hangman-ai-orpin.vercel.app/

---

## Technology Stack

- **Frontend:** React 19, Vite, TailwindCSS, Three.js (@react-three/fiber & @react-three/drei), Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express, Socket.IO, Zod schema validation.
- **AI Linguistic Engine:** Character-level Statistical N-Gram Language Model (Order-2 -> Order-1 -> Positional -> Global backoff) with candidate entropy filtering and dynamic learning memory.
- **Data & APIs:** 220k-word English dictionary, curated 1,968-word game dictionary, live Datamuse Lexical API, and MongoDB Atlas (with automatic in-memory fallback).

---

## 4-Tier Inspector Progression & Character Abilities

Players can choose their active companion investigator from the **Inspector Directory (`/inspectors`)**. Higher tiers unlock through career win milestones, granting active in-game investigative powers!

| Level | Character | Unlock Milestone | Special Ability | Mechanical In-Game Effect | Voice & Style |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **LVL 1** | **🧽 SpongeBob** | **0 Wins (Default)** | **None (Rookie Mascot)** | Baseline detective companion. Rule reminders, countdowns, and dialogue with no active powers. | *"I'm ready! I'm ready! Let's crack this case!"* |
| **LVL 2** | **🍌 Minion** | **2 Career Wins** 🔒 | **Banana Strike Shield** | Absorbs 1 wrong strike penalty per game without losing an attempt. | 100% Authentic Minionese (*"Bello! Baboi tulaliloo papoy banana!"*) |
| **LVL 3** | **🐱 Doraemon** | **5 Career Wins** 🔒 | **Pocket Letter Probe** | Scans candidate dictionary and automatically exposes 1 correct letter position for free. | *"Deploying Future-Vision Letter Probe from my 4D pocket!"* |
| **LVL 4** | **🕷️ Spider-Man** | **10 Career Wins** 🔒 | **Spider-Sense Purge** | Scans and permanently webs up (`🕸️`) 3 wrong trap letters on the typewriter keyboard. | *"My spider-sense is tingling. That letter is a trap!"* |

---

## Game Modes

| Mode | Type | Description |
| :--- | :--- | :--- |
| **Solo** | Player vs AI | The AI chooses a word from curated difficulty buckets; the player investigates using their companion inspector. |
| **Reverse** | AI vs Player | The player inputs any secret word (including slang/proper nouns); the AI attempts to deduce it within 6 strikes using candidate reasoning and live Datamuse queries. |
| **Local Duel** | 2 Players | Pass-and-play on a single device with secret word input, strike tracking, and companion commentary. |
| **Multiplayer** | Real-Time Online | Live WebSocket rooms with matchmaking, shared game state, role swaps, and pure classic competitive deduction (abilities disabled). |

---

## Quick Start & Gameplay Guide

- **Solo Mode (You vs AI):**
  Click **Open Case File** -> Select **Solo** -> Choose difficulty (Rookie, Detective, or Chief). Click letters on the typewriter to solve the secret word before 6 strikes.
  
- **Inspector Abilities:**
  During matches, click your companion's **`[Activate Ability]`** button in the bottom-right speech bubble to trigger their special power.

- **Reverse Mode (AI Solves Your Word):**
  Click **Open Case File** -> Select **Reverse** -> Enter any word, slang, or proper noun (e.g. `DIDDY`). Watch the AI deduce your word turn-by-turn. Click **View AI Explainer** to see real-time letter probability scores and candidate lists.

- **Multiplayer Mode (Live 1v1 Rooms):**
  Click **Multiplayer** -> Create a room or share a 6-character room code to challenge a friend live over WebSockets with real-time turn synchronization.

---

## AI Solver and Linguistic Engine

1. **Character-Level N-Gram Context Model:**
   Trained on a 220,000-word corpus at server boot. Uses bi-gram and tri-gram character contexts to predict missing letters based on neighboring revealed letters (e.g. predicting U after Q, or identifying patterns like TH, ING, ED).

2. **Positional Frequency Matrices:**
   Instead of flat global letter frequency, the AI computes exact slot likelihoods per word length (analyzing letter frequency at position 1 vs position 5).

3. **Blank-Slot Multi-Occurrence Weighting:**
   Evaluates how many unresolved blank slots a letter fills across matching candidates, prioritizing high-information guesses that resolve multiple letters simultaneously.

4. **Live Datamuse Parallel Fallback:**
   In Reverse mode, when players enter modern slang or proper nouns (e.g., DIDDY), the engine concurrently queries the Datamuse Lexical API to expand candidate sets in real time.

5. **Adaptive Learning Loop:**
   When the AI loses a match, failed letters are recorded to `ai_learning.json`. Future games scale down failed letters by up to 95%, forcing the solver to pivot to alternative consonant/vowel clusters.

---

## AI Benchmark Performance

Evaluated across production word sets (SAMPLE_SIZE = 100 per tier):

| Difficulty | Word Length | Win Rate | Avg Turns | Avg Wrong Guesses | Latency |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Rookie (Easy)** | 4 - 5 letters | 64.0% | 7.4 | 3.9 | < 2 ms |
| **Detective (Medium)** | 6 - 7 letters | 88.0% | 8.2 | 2.6 | < 15 ms |
| **Chief (Hard)** | 8 - 10 letters | 94.0% | 8.9 | 1.8 | < 30 ms |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/salim7-s/Hangman-AI.git
cd Hangman-AI
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

Environment Variables (`backend/.env`):
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hangman
JWT_SECRET=your_jwt_secret_key
```
*Note: `MONGO_URI` is optional. The backend automatically uses an in-memory session engine if omitted.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Testing and Verification

```bash
# Run backend regression tests (26 specs)
npm test

# Test live in-game abilities execution
node scripts/test_abilities_live.js

# Run frontend ESLint checks
npm --prefix frontend run lint

# Build production bundle
npm --prefix frontend run build
```

---

## Repository Structure

```text
hangman-ai/
├── backend/
│   ├── config/          # Database connection & non-fatal fallback
│   ├── controllers/     # REST game, auth, and explain handlers
│   ├── data/            # 220k word corpus, curated gameplay words, blocklists
│   ├── routes/          # Express API endpoints
│   ├── services/        # N-Gram language model & AI solving logic
│   ├── socket/          # Socket.IO multiplayer room engine
│   └── test/            # 26 automated regression tests
├── frontend/
│   ├── src/components/  # NoirCartoonAvatar, InspectorGuide, 3D Gallows, Keyboard, Modals
│   ├── src/context/     # Auth and theme context providers
│   ├── src/hooks/       # Custom hooks (useStreak, useSounds, useSocket)
│   ├── src/pages/       # Route views (Home, Game, InspectorModels, MultiplayerLobby)
│   └── src/utils/       # Character tiers, milestone logic, and helper functions
└── scripts/             # Live ability validation and word curation utilities
```

---

## License
This project is open source and available under the MIT License.
