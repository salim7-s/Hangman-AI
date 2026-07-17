Hangman AI — One‑Page Summary

What it is

Hangman AI is a playable full-stack web app that supports single-player games against an AI and private multiplayer matches between two users. It combines a React-based browser interface, a Node.js backend, and websocket-powered live gameplay.

Objective

The project shows how a compact AI-powered game can be built end-to-end with real-time interaction, server-managed game state, and a practical algorithmic opponent. It is meant to be both a demo of AI strategy and a usable multiplayer experience.

What works

- Single-player mode: the AI plays as the guesser, solving Hangman puzzles with heuristic word selection.
- Multiplayer mode: two users can create or join rooms and play live with synchronized state via Socket.io.
- User experience: the UI supports keyboard input, visual hangman feedback, and responsive game updates.
- Data and testing: the repo includes curated word lists, evaluation scripts, and backend tests for core logic.

Technical architecture

- Frontend: built with Vite and React. The app renders the game board, virtual keyboard, and status modals while managing auth and socket connections through custom hooks.
- Backend: Node.js/Express serves game APIs, authentication flows, and state persistence. Controllers handle game lifecycle operations and game state updates.
- Real-time: Socket.io powers the multiplayer flow. Events broadcast guesses, room joins, and game over states so both clients stay in sync.

AI algorithm (detailed)

- Candidate filtering: start from a curated vocabulary and prune words that do not match the current letter pattern or contain excluded letters.
- Scoring: each candidate letter is scored by how often it appears in the remaining words, then adjusted by how much each guess would reduce ambiguity.
- Selection: the AI chooses the letter with the highest combined score, preferring letters that maximize information gain and reduce the candidate set fastest.
- Iteration: after each guess, the word list is updated and the process repeats until the word is solved or the guess limit is reached.

Data and evaluation

- The repository includes large wordlists and curated game words used to benchmark the AI.
- Evaluation scripts measure success rate, average turns to solve, and incorrect guesses over different corpora.
- Unit tests exist for AI scoring and game logic to ensure the solver behaves as expected.

What could improve

- The AI does not use machine learning; it is purely heuristic and may still struggle on harder puzzles.
- Player analytics, session history, and leaderboards are not implemented.
- The multiplayer lobby is functional but could be improved with better matchmaking and room discovery.

Why it matters

This project is a compact example of an interactive AI product that brings together UX, backend architecture, and algorithmic decision making. It demonstrates how gameplay, data, and real-time networking can be integrated in a small but complete application.
