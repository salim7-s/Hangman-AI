# Frontend Documentation

This frontend is a React 19 + Vite application for the Noir Detective Hangman AI project.

## Responsibilities

The frontend handles:
- Mode selection and routing (Solo, Reverse AI, Local Duel, Multiplayer, Inspector Roster)
- Interactive typewriter keyboard input with Spider-Sense letter purges
- 4-Tier character companion selection, progression locks, and live special abilities
- Real-time multiplayer lobby interactions and chat synchronization
- Interactive 3D Three.js canvas for progressive gallows suspect sketches
- Live AI Reasoning Explainer drawer with candidate counts and entropy scores
- Client-side auth, streak persistence, and sound effects

## Main Folders

| Path | Purpose |
| --- | --- |
| `src/pages/` | Route-level screens: `Home.jsx`, `Game.jsx`, `InspectorModels.jsx`, `MultiplayerLobby.jsx` |
| `src/components/` | Reusable UI: `InspectorGuide.jsx`, `NoirCartoonAvatar.jsx`, `HangmanScene.jsx`, `Keyboard.jsx`, `ResultModal.jsx`, `AuthModal.jsx` |
| `src/hooks/` | Custom hooks: `useStreak.js`, `useSounds.js`, `useSocket.js` |
| `src/context/` | Authentication state and theme provider logic |
| `src/services/` | Axios API client and runtime configuration helpers |
| `src/utils/` | Character tiers, unlock milestones, and Minionese dialogues (`characters.js`) |
| `public/` | Static assets, inspector transparent sprites, and favicon |

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Environment Variables

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: create production build
- `npm run preview`: preview built output locally
- `npm run lint`: run ESLint checks

## Important Pages & Components

### `src/pages/InspectorModels.jsx`
- 4-tier companion selection catalog with career win milestones and active power previews.

### `src/components/InspectorGuide.jsx`
- Floating companion mascot with reactive speech bubble, Minionese language, and in-game ability activation.

### `src/pages/Game.jsx`
- Main gameplay page integrating 3D Gallows (`HangmanScene`), Typewriter Keyboard, AI Explainer drawer, and Companion powers.

### `src/pages/MultiplayerLobby.jsx`
- Real-time 1v1 WebSocket match lobby with shared chat, live reconnection, and classic deduction rules.

## More Documentation

For broader project documentation, see:
- [`../README.md`](../README.md)
- [`../docs/README.md`](../docs/README.md)
- [`../docs/game_modes.md`](../docs/game_modes.md)
- [`../docs/local_development.md`](../docs/local_development.md)
