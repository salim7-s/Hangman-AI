# Hangman AI: Technical Architecture

This application is a full-stack web application built using the MERN stack (MongoDB, Express, React, Node.js), augmented with real-time WebSockets and 3D rendering capabilities.

## 1. Frontend Architecture
The frontend is a single-page application (SPA) built with **React 19** and bundled using **Vite**.

### Key Technologies:
- **React Router:** Handles client-side routing (`/`, `/game`, `/multiplayer`).
- **Tailwind CSS v4:** Provides utility-first styling. The application utilizes a highly customized "Noir Detective" theme, heavily leveraging custom CSS variables (`index.css`) to create an aged paper aesthetic with mechanical typewriter elements.
- **React Three Fiber (R3F):** A React wrapper for Three.js used to render the 3D Hangman character.
- **Socket.io-client:** Establishes a persistent, bi-directional WebSocket connection to the backend for real-time multiplayer functionality.

### Core Components:
- `Game.jsx`: The primary game board layout, structured like a split-column case file dossier.
- `HangmanScene.jsx` & `CharacterModel.jsx`: Renders the 3D character. The 3D model uses `<Edges>` from `@react-three/drei` applied to standard geometries (boxes, spheres, cylinders) to simulate a 2D wireframe pencil sketch.
- `Keyboard.jsx`: A responsive, typewriter-styled virtual keyboard.
- `MultiplayerLobby.jsx`: A real-time room creation and matching interface.

## 2. Backend Architecture
The backend is a RESTful API and WebSocket server built with **Node.js** and **Express**.

### Key Technologies:
- **Express.js:** Handles standard HTTP requests (starting games, submitting guesses).
- **Socket.io:** Manages real-time rooms and events for the `player-vs-player` multiplayer mode.
- **MongoDB (Mongoose):** Provides persistent storage for game states and user statistics. If MongoDB is not connected, the server gracefully degrades to use an in-memory data store.

### Core Modules:
- `gameController.js`: Contains the core game state machine. It validates guesses, updates the masked word, determines win/loss conditions, and automatically triggers the AI in Reverse Mode.
- `aiService.js`: The "brain" of the application. It loads a 250,000-word training dataset into memory on server startup and exposes functions to pick random words or calculate optimal guesses based on the selected difficulty.
- `gameSocket.js`: Manages WebSocket connections, room creation, role assignment (Informant vs Extractor), and broadcasting game state updates to connected clients.

## 3. Data Flow (Reverse Mode Example)
1. **Init:** The user selects "Reverse Mode", enters a secret word, and selects a difficulty level (e.g., Hard).
2. **Start:** The frontend sends a `POST /api/game/start` request. The backend creates a new game session in MongoDB and returns the `gameId`.
3. **Execution:** The frontend automatically hits `POST /api/game/guess` every 1.5 seconds.
4. **AI Processing:** The backend routes the request to `aiService.js`, passing the current masked pattern, the wrong guesses, and the difficulty level. The AI engine processes the dictionary and returns the optimal letter.
5. **Update:** The backend updates the game state, evaluates win/loss, and responds to the frontend. The frontend visually updates the typewriter and 3D sketch.
