# Codebase File Structure Details

This document explains the purpose of the major files and folders within Hangman AI.

## Root Directory

- `README.md`: high-level overview, quickstart, and production notes
- `package.json`: root scripts for running backend and frontend together
- `words_250000_train.txt`: large raw dictionary used by the AI tooling
- `backend/`: Express API, auth, AI logic, Socket.IO server, and tests
- `frontend/`: React 19 + Vite single-page application
- `docs/`: architecture, API, deployment, and gameplay documentation
- `.gitignore`: Git ignore rules, including local env files and build output

## Frontend (`/frontend`)

The user interface, 3D rendering, REST calls, and multiplayer socket client.

### `/src/components`

Reusable UI and 3D components.

- `AuthModal.jsx`: login/register modal tied to `AuthContext`; surfaces backend and network auth errors
- `CharacterModel.jsx`: the 3D character model rendered with React Three Fiber and Drei
- `HangmanScene.jsx`: sets up the `<Canvas>`, lights, shadows, and camera around the character
- `Keyboard.jsx`: reusable on-screen keyboard used in gameplay
- `ResultModal.jsx`: end-of-game modal for solo/local play

### `/src/pages`

Route-level screens.

- `Home.jsx`: landing page, auth entry, and single-player setup
- `Game.jsx`: solo, reverse, and local duel gameplay loop
- `MultiplayerLobby.jsx`: room creation, joining, chat, 3D active-match layout, and leaderboard access

### `/src/hooks`

Custom React hooks.

- `useSocket.js`: manages the shared Socket.IO client and passes the JWT in the socket handshake
- `useSounds.js`: audio helper for gameplay sound effects
- `useStreak.js`: local win streak helper using `localStorage`

### `/src/context`

- `AuthContext.jsx`: stores current user and token, and exposes `login`, `register`, and `logout`
- `auth-context.js`: raw React context and `useAuth()` hook

### `/src/services`

- `api.js`: shared `axios` instance with bearer token injection
- `runtimeConfig.js`: resolves the backend base URL from `VITE_API_URL` or local defaults

### Root Frontend Files

- `index.css`: global styles, typography, button treatments, and page layout utilities
- `App.jsx`: route map for `/`, `/game`, and `/multiplayer`
- `main.jsx`: React entry point; mounts `AuthProvider` around the app
- `vercel.json`: SPA rewrite configuration for Vercel
- `.env.production`: documentation placeholder only; real production values belong in Vercel environment variables

## Backend (`/backend`)

The REST API, AI engine, auth system, leaderboard persistence, and multiplayer socket server.

### `/config`

- `db.js`: MongoDB connection setup via `mongoose.connect()`

### `/controllers`

- `authController.js`: register/login flow, JWT creation, duplicate user checks, and auth config safeguards
- `gameController.js`: single-player/local game lifecycle and leaderboard HTTP endpoint

### `/data`

- `words_game_curated.txt`: curated gameplay dictionary
- `word_blocklist.txt`: excluded words for gameplay dictionary generation

### `/middleware`

- `authMiddleware.js`: strict and optional JWT auth for HTTP routes

### `/models`

- `Game.js`: Mongoose model for single-player/local game persistence
- `MultiplayerRoom.js`: Mongoose model for multiplayer rooms when MongoDB is enabled
- `User.js`: Mongoose model for users, stats, and password hashing

### `/routes`

- `authRoutes.js`: `/api/auth/register` and `/api/auth/login`
- `gameRoutes.js`: game start, guess, fetch, and leaderboard endpoints

### `/scripts`

- `buildCuratedWords.js`: regenerates the gameplay word list
- `evaluateAi.js`: benchmark harness for AI performance

### `/services`

- `aiService.js`: dictionary loading and easy/medium/hard AI guessing strategies

### `/socket`

- `gameSocket.js`: Socket.IO room lifecycle, reconnect flow, multiplayer stat updates, and room sanitization

### `/test`

- `aiService.test.js`: AI behavior and dictionary indexing tests
- `gameController.test.js`: core game controller regression tests
- `runTests.js`: custom test runner

### Root Backend Files

- `server.js`: Express bootstrap, CORS, Helmet, rate limiter, routes, Socket.IO, and DB startup
- `package.json`: backend scripts and dependencies
- `.env` / `.env.production`: local reference files; production values should be stored in Render

## Current Operational Notes

- multiplayer can run entirely in memory, but persists to MongoDB when available
- auth requires both MongoDB and a valid `JWT_SECRET`
- live frontend builds must use `VITE_API_URL`; otherwise the browser can fall back to `localhost:5000`
