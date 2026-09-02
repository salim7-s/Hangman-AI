# Hangman AI

A full-stack, real-time Hangman web application featuring a character-level Statistical N-Gram Language Model, real-time WebSockets multiplayer, an interactive 3D animated game board, and a live AI Reasoning Explainer dashboard.

Live Demo: https://hangman-ai-orpin.vercel.app/

---

## Architecture and Technology Stack

```mermaid
flowchart TD
    subgraph Client [Frontend: React + Vite SPA]
        UI[Detective Game UI]
        Canvas3D[Three.js 3D Gallows Scene]
        SocketIO[Socket.IO Client]
        Explainer[Live AI Reasoning Dashboard]
    end

    subgraph Server [Backend: Node.js + Express]
        API[Express REST API]
        SocketEngine[Socket.IO Multiplayer Engine]
        Solver[Candidate Pruning & Solver Engine]
        LanguageModel[Character N-Gram Language Model]
        LearningStore[Adaptive Learning Store]
    end

    subgraph Data [Data and External Services]
        Dictionary[(370k Word Corpus)]
        DatamuseAPI[Datamuse Lexical API]
        Database[(MongoDB Atlas / In-Memory Store)]
    end

    UI -->|REST Endpoints| API
    UI --> Canvas3D
    UI --> Explainer
    SocketIO <-->|WebSockets| SocketEngine
    API --> Solver
    Solver --> LanguageModel
    Solver --> Dictionary
    Solver --> DatamuseAPI
    Solver --> LearningStore
    API --> Database
```

### Stack Details

- Frontend: React 19, Vite, TailwindCSS, Three.js, Lucide Icons, Canvas Confetti.
- Backend: Node.js, Express, Socket.IO, Zod schema validation.
- AI Engine: Character-level N-Gram statistical language model (Order-2 -> Order-1 -> Positional -> Global backoff) with candidate entropy filtering.
- Persistence and Fallback: MongoDB Atlas (Mongoose) with automatic in-memory fallback for guest sessions.

---

## Game Modes

| Mode | Type | Description |
| :--- | :--- | :--- |
| Solo | Player vs AI | The AI chooses a word from curated difficulty buckets; the player investigates. |
| Reverse | AI vs Player | The player inputs any secret word (including slang/proper nouns); the AI attempts to deduce it within 6 strikes using candidate reasoning and live Datamuse queries. |
| Local Duel | 2 Players | Pass-and-play on a single device with secret word input and turn tracking. |
| Multiplayer | Real-Time Online | Live WebSocket rooms with matchmaking, shared game state, and role swaps. |

---

## AI Solver and Linguistic Engine

1. Character-Level N-Gram Context Model:
   Trained on a 370,000+ word corpus at server boot. Uses bi-gram and tri-gram character contexts to predict missing letters based on neighboring revealed letters (e.g. predicting U after Q, or identifying patterns like TH, ING, ED).

2. Positional Frequency Matrices:
   Instead of flat global letter frequency, the AI computes exact slot likelihoods per word length (analyzing letter frequency at position 1 vs position 5).

3. Blank-Slot Multi-Occurrence Weighting:
   Evaluates how many unresolved blank slots a letter fills across matching candidates, prioritizing high-information guesses that resolve multiple letters simultaneously.

4. Live Datamuse Parallel Fallback:
   In Reverse mode, when players enter modern slang or proper nouns (e.g., DIDDY), the engine concurrently queries the Datamuse Lexical API to expand candidate sets in real time.

5. Adaptive Learning Loop:
   When the AI loses a match, failed letters are recorded to `ai_learning.json`. Future games scale down failed letters by up to 95%, forcing the solver to pivot to alternative consonant/vowel clusters.

---

## AI Benchmark Performance

Evaluated across production word sets (SAMPLE_SIZE = 100 per tier):

| Difficulty | Word Length | Win Rate | Avg Turns | Avg Wrong Guesses | Latency |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Rookie (Easy) | 4 - 5 letters | 64.0% | 7.4 | 3.9 | < 2 ms |
| Detective (Medium) | 6 - 7 letters | 88.0% | 8.2 | 2.6 | < 15 ms |
| Chief (Hard) | 8 - 10 letters | 94.0% | 8.9 | 1.8 | < 30 ms |

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
Note: `MONGO_URI` is optional. The backend automatically uses an in-memory session engine if omitted.

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
# Run all backend regression tests (26 specs)
npm test

# Run frontend ESLint checks
npm run lint

# Build production bundle
npm run build
```

---

## Repository Structure

```text
hangman-ai/
├── backend/
│   ├── config/          # Database connection & non-fatal fallback
│   ├── controllers/     # REST game, auth, and explain handlers
│   ├── data/            # 370k word corpus, curated gameplay words, blocklists
│   ├── routes/          # Express API endpoints
│   ├── services/        # N-Gram language model & AI solving logic
│   ├── socket/          # Socket.IO multiplayer room engine
│   └── test/            # 26 automated regression tests
├── frontend/
│   ├── src/components/  # Detective UI, 3D Canvas, Modals, Explainer
│   ├── src/context/     # Auth and theme context providers
│   ├── src/hooks/       # Custom hooks for game state and WebSockets
│   └── src/pages/       # Route views (Home, Game, Multiplayer, Leaderboard)
└── scripts/             # Word curation and validation utilities
```

---

## License
This project is open source and available under the MIT License.
