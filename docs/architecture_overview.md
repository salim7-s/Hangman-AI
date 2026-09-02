# Hangman AI: Technical Architecture

This application is a full-stack web application built with React, Vite, Express, Socket.IO, optional MongoDB persistence, and browser-side 3D rendering.

## 1. Frontend Architecture

The frontend is a single-page application built with **React 19** and bundled using **Vite**.

### Key Technologies

- **React Router:** client-side routing for `/`, `/game`, and `/multiplayer`
- **Tailwind CSS v4 + custom CSS:** utility styling plus a custom noir-paper visual system in `index.css`
- **React Three Fiber / Drei / Three.js:** renders the hangman character and scene
- **Socket.IO client:** keeps a shared real-time connection for multiplayer
- **Axios:** handles REST requests and injects the stored bearer token

### Frontend State Model

- `AuthContext` manages current user and JWT token
- `Game.jsx` owns single-player and local duel game state
- `MultiplayerLobby.jsx` owns room UI state and subscribes to socket events
- `useSocket()` maintains a singleton socket and reconnects with the latest auth token

### Frontend Routes

- `/`: landing page, auth modal, single-player setup
- `/game`: solo, reverse, and local duel gameplay
- `/multiplayer`: room creation, join flow, chat, leaderboard access, and active multiplayer session

## 2. Backend Architecture

The backend is both a REST API and a Socket.IO server built with **Node.js** and **Express**.

### Key Technologies

- **Express:** HTTP routes for auth, game lifecycle, health, and leaderboard
- **Socket.IO:** room-based real-time multiplayer transport
- **Mongoose / MongoDB:** persistence for users, games, leaderboard stats, and multiplayer rooms when configured
- **Helmet / CORS / express-rate-limit:** basic hardening for public deployment

### Runtime Modes

The backend supports two operating modes:

- **MongoDB enabled:** auth, leaderboard, persistent user stats, and persistent multiplayer room records
- **MongoDB disabled:** single-player games and multiplayer rooms fall back to in-memory storage

That split is deliberate:

- gameplay still works without MongoDB
- auth and leaderboard do not

## 3. Backend Modules

### `controllers/gameController.js`

Owns the REST-driven game state machine for:

- `ai-vs-player`
- `player-vs-ai`
- `player-vs-player`

Responsibilities:

- validate start/guess requests
- create and mutate game state
- trigger the AI in reverse mode
- update persistent user stats for linked single-player/local games
- serve leaderboard data

### `controllers/authController.js`

Handles:

- registration
- login
- JWT creation
- duplicate username/email checks
- degraded behavior when MongoDB or JWT config is invalid

### `services/aiService.js`

The AI engine:

- loads the word corpus and curated gameplay dictionary
- selects random words for difficulty buckets
- computes the next guess using easy, medium, or hard strategy

The AI path is used only in `player-vs-ai` mode.

### `socket/gameSocket.js`

Handles the multiplayer room lifecycle:

- create room
- join room
- submit word
- guess letter
- send chat message
- rematch
- disconnect and reconnect recovery

It also updates multiplayer user stats when MongoDB is enabled.

## 4. Multiplayer Architecture

Multiplayer is socket-driven and server-authoritative.

### Storage

- in-memory fallback: `memRooms`
- Mongo-backed persistence: `MultiplayerRoom`

### Identity

- sockets can be guests or authenticated users
- the frontend passes the JWT in `socket.handshake.auth.token`
- the backend resolves `socket.data.user`
- stats prefer `userId` and fall back to nickname matching only for guests or older rooms

### State Safety

The backend sanitizes room state before broadcasting it:

- active room broadcasts never include the secret word
- the true word is appended only after a match is won or lost

## 5. Auth and Leaderboard Flow

### Solo / Local

1. User signs in through the frontend auth modal.
2. JWT is stored in `localStorage`.
3. `api.js` attaches `Authorization: Bearer <token>` to requests.
4. `optionalAuth` links new REST games to `req.user`.
5. When a linked game ends, user stats are incremented.

### Multiplayer

1. Frontend socket connects with the JWT in the handshake.
2. Room participants store `userId` when available.
3. At match end, the socket server increments `gamesPlayed`, `wins`, and `losses`.
4. `GET /api/game/leaderboard` reads from the `User` collection.

## 6. Production Integration Points

For the deployed app to work correctly:

- Vercel must build the frontend with `VITE_API_URL` set to the Render backend URL
- Render must set `CLIENT_URL` to the Vercel frontend URL
- MongoDB must be reachable from Render for auth and leaderboard
- `JWT_SECRET` must be valid in production

If a live frontend calls `http://localhost:5000`, the Vercel build was created without the correct `VITE_API_URL`.

## 7. Example Data Flow: Reverse Mode

1. User selects **Reverse** mode and enters a secret word.
2. Frontend sends `POST /api/game/start`.
3. Backend creates a game record or in-memory game state.
4. Frontend repeatedly advances the AI via `POST /api/game/guess`.
5. Backend calls `aiGuess()` with:
   - current masked pattern
   - wrong guesses
   - guessed letters
   - difficulty
6. Backend updates the game, checks win/loss, and returns the new state.
7. Frontend updates the board, logs, and 3D scene.
