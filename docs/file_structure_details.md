# Codebase File Structure Details

This document explains the purpose of every file and folder within the Hangman AI application.

## Root Directory
- `README.md`: The main entry point for the repository. Contains a high-level overview of the project, features, and quickstart instructions.
- `words_250000_train.txt`: The massive 250,000-word dataset used by the backend AI engine to filter candidates and perform frequency/entropy analysis.
- `backend/`: Contains the Express.js API and Socket.io server.
- `frontend/`: Contains the React 19 + Vite single-page application.
- `.gitignore`: Specifies which files and directories Git should ignore (e.g., `node_modules`, `.env`).

---

## 🖥️ Frontend (`/frontend`)
The user interface, 3D rendering, and client-side logic.

### `/src/components`
Reusable UI and 3D components.
- `CharacterModel.jsx`: The core 3D model. It uses hardcoded dimensions and `@react-three/drei`'s `<Edges>` component to render the geometries as a "Noir Pencil Sketch". It handles pop-in scaling, incorrect guess shaking, and the death animation.
- `HangmanScene.jsx`: Sets up the 3D `<Canvas>`, lighting, and shadow catchers. It acts as the parent wrapper for the `CharacterModel`.
- `Keyboard.jsx`: The virtual QWERTY keyboard. It dynamically styles buttons (correct, wrong, unguessed) to look like mechanical typewriter keys.
- `ResultModal.jsx`: The "Case Closed" popup that appears at the end of a game. It displays the final word, the user's win streak, and allows them to play again.

### `/src/pages`
The main views of the application, managed by React Router.
- `Home.jsx`: The landing page and game setup screen. Allows the user to select the game mode, difficulty (which directly impacts the AI's intelligence), and input a secret word for Reverse Mode.
- `Game.jsx`: The primary gameplay loop. It manages the state of the guesses, communicates with the backend REST API, renders the 3D scene, and automates the AI's guesses in Reverse Mode.
- `MultiplayerLobby.jsx`: The real-time room creation and joining interface. Styled as a secure ledger for operatives to connect via Socket.io.

### `/src/hooks`
Custom React hooks for abstracting logic.
- `useSocket.js`: Manages the persistent WebSocket connection to the backend, exposing `emit` and `on` functions for multiplayer state synchronization.
- `useSounds.js`: Loads and plays audio sound effects (correct guess, wrong guess, win, loss) using `Howler.js`.
- `useStreak.js`: Manages the user's local win streak using `localStorage`.

### `/src/context`
- `AuthContext.jsx` & `auth-context.js`: (Work in Progress / Optional) Infrastructure for managing user authentication state if the app scales to include persistent user accounts.

### `/src/services`
- `api.js`: Configures the global `axios` instance to point to the backend URL (`VITE_API_URL`) and automatically attach credentials (cookies) for authenticated requests.

### Root Frontend Files
- `index.css`: The global stylesheet. It defines the custom CSS variables, custom typography, mechanical button styles, and glassmorphism elements that make up the "Noir Detective" theme.
- `App.jsx`: The root React component that sets up the `BrowserRouter` and maps URL paths to the Page components.
- `main.jsx`: The React entry point that mounts the app to the DOM.
- `vercel.json`: Configuration file for Vercel deployment, ensuring that all client-side routes fallback to `index.html`.

---

## ⚙️ Backend (`/backend`)
The API, AI engine, and multiplayer socket server.

### `/services`
- `aiService.js`: The absolute core of the project. It loads the 250k-word dictionary into memory and contains the `aiGuess()` function. It implements a multi-tiered intelligence system:
  - `aiGuessEasy()`: Guesses based on raw letter frequency.
  - `aiGuessMedium()`: Guesses using a heuristic weighting of frequency, position, and elimination power.
  - `aiGuessHard()`: Guesses using mathematically optimal Shannon Entropy.

### `/controllers`
- `gameController.js`: The game state manager. It handles requests to `/api/game/start` and `/api/game/guess`. It validates letters, updates the masked word, determines if a game is won/lost, and triggers `aiService.js` during Reverse Mode.
- `authController.js`: Handles user registration and login logic for persistent accounts.

### `/socket`
- `gameSocket.js`: The Socket.io event handler. It allows players to create rooms, join via a 6-letter code, assign roles (Word Giver vs Guesser), and broadcast game actions (submitting words, guessing letters) in real-time.

### `/models`
- `Game.js` & `User.js`: Mongoose schemas defining how game sessions and user profiles are stored in MongoDB.

### `/routes`
- `gameRoutes.js` & `authRoutes.js`: Maps HTTP endpoints (e.g., `POST /api/game/guess`) to their respective controller functions.

### Root Backend Files
- `server.js`: The entry point. It configures Express, sets up CORS and Rate Limiting for security, mounts the routes, attaches Socket.io, and connects to MongoDB.
- `config/db.js`: Contains the logic to establish the connection to MongoDB Atlas using `mongoose.connect()`.
