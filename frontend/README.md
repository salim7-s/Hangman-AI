# Frontend Documentation

This frontend is a React 19 + Vite application for the Hangman AI project.

## Responsibilities

The frontend handles:

- Mode selection and routing
- Game board rendering
- Keyboard input
- Multiplayer lobby interactions
- 3D character and scene rendering
- Auth state persistence in the client
- API and socket communication with the backend

## Main Folders

| Path | Purpose |
| --- | --- |
| `src/pages/` | Route-level screens such as `Home`, `Game`, and `MultiplayerLobby` |
| `src/components/` | Reusable UI and scene components |
| `src/hooks/` | Custom hooks for socket, sound, and streak logic |
| `src/context/` | Authentication state and provider logic |
| `src/services/` | API client and runtime configuration helpers |
| `public/` | Static assets such as SVG icons and favicon |

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

Default dev URL:

- `http://localhost:5173`

## Environment Variable

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

This value should point to the backend base URL.

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: create production build
- `npm run preview`: preview built output locally
- `npm run lint`: run ESLint

## Important Pages

### `src/pages/Home.jsx`

- Entry page for selecting game modes and app navigation

### `src/pages/Game.jsx`

- Main single-player and local-duel gameplay page
- Talks to REST endpoints in the backend

### `src/pages/MultiplayerLobby.jsx`

- Handles room creation, join flow, and real-time multiplayer state
- Uses Socket.io events instead of the REST game routes

## Related Backend Areas

When working on frontend gameplay, the backend files most likely involved are:

- `backend/routes/gameRoutes.js`
- `backend/controllers/gameController.js`
- `backend/socket/gameSocket.js`

## More Documentation

For broader project documentation, see:

- [`../docs/README.md`](../docs/README.md)
- [`../docs/local_development.md`](../docs/local_development.md)
- [`../docs/socket_multiplayer.md`](../docs/socket_multiplayer.md)
