Hangman AI — One‑Page Project Summary

Overview

Hangman AI is an interactive web application that combines a classic Hangman game with AI-driven guessing and multiplayer support. The project provides a browser-based frontend and a Node.js backend that together enable single-player games against AI, local play, and real-time multiplayer via websockets. The AI component evaluates candidate words using frequency and information-theoretic heuristics to make educated guesses and to benchmark model performance.

Architecture

- Backend: Node.js + Express serves REST APIs, user authentication, and game state persistence. Socket.io powers real-time multiplayer sessions and live gameplay updates.
- Frontend: A Vite-powered React app renders the game UI, keyboard input, and hangman visuals. Context and hooks manage authentication, socket connections, and game state.
- Data and models: Curated word lists and training files live in the repository under backend/data. The AI logic is implemented as services that can be evaluated with provided scripts in backend/scripts.

Key Components

- `backend/server.js`: app entrypoint, API and socket wiring.
- `backend/controllers/gameController.js`: game lifecycle and API handlers.
- `backend/services/aiService.js`: AI guess algorithms and evaluation helpers.
- `frontend/src/pages/Game.jsx`: main gameplay UI.
- `socket/gameSocket.js`: real-time event handlers for multiplayer.

Data and AI Approach

The project includes large wordlists (e.g., words_250000_train.txt) and a curated gameplay vocabulary used for both training and evaluation. The AI combines frequency-based scoring with Shannon-entropy-style heuristics to prioritize guesses that maximally reduce the candidate space. Evaluation scripts measure accuracy and average turns-to-solve across corpora, and results are recorded for benchmarking.

How to Run (dev)

1. Start the backend: run `npm install` then `npm run dev` in `backend/`.
2. Start the frontend: run `npm install` then `npm run dev` in `frontend/`.
3. Use the web UI to play single-player, test the AI, or create multiplayer rooms.

Future Work

- Improve AI by training neural ranking models on gameplay traces.
- Add richer analytics and player metrics dashboards.
- Expand multiplayer matchmaking and lobby features.

Contact

For questions or contributions, see the repository README and docs for API and architecture details.