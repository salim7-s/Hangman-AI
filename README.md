# Hangman AI

Hangman AI is a full-stack word game built with React, Node.js, Express, Socket.IO, and optional MongoDB persistence. The project includes solo play, local pass-and-play, real-time multiplayer rooms, and an AI guesser with easy, medium, and entropy-driven hard modes.

Modern full-stack Hangman with real-time multiplayer, a three-difficulty AI solver, and a React + Node.js deployment path that is easy to demo on GitHub.

## Quick Links

- [Project documentation](./docs/README.md)
- [Local development guide](./docs/local_development.md)
- [Deployment guide](./docs/deployment_guide.md)
- [AI benchmark details](./docs/ai_benchmark.md)

## Stack

- Frontend: React 19, Vite, Tailwind CSS, Three.js, React Three Fiber
- Backend: Node.js, Express, Socket.IO
- Persistence: MongoDB Atlas when `MONGO_URI` is configured, in-memory fallback otherwise
- Deployment targets: Vercel for frontend, Render for backend

## Core Features

- AI-vs-player mode where the system selects a word for the player
- Player-vs-AI mode where the AI solves a hidden word using heuristic and entropy strategies
- Web-Assisted Fallback (via Datamuse API) to allow the AI to guess proper nouns, slang, or out-of-dictionary words rather than failing silently
- Interactive AI Reasoning Explainer UI that displays live entropy calculations and possibilities
- Local two-player mode on one device
- Real-time multiplayer rooms with role swapping on rematch
- JWT-based auth and leaderboard support when MongoDB is available
- 3D hangman scene rendered in the browser

## Engineering Upgrades

The repo now includes quality and evaluation infrastructure that makes the project easier to defend in interviews:

- robust backend validation using Zod schemas on core Express routes
- backend regression tests expanded to 25 specs covering difficulties, positions, mock auth, and explain endpoint logic
- a reproducible AI benchmark script using the production dictionary (includes async loop support)
- dictionary indexing by word length to avoid full-corpus scans on every guess
- a separate curated gameplay dictionary so players do not see raw corpus junk
- GitHub Actions CI for backend tests plus frontend lint and build checks

## AI Benchmark Snapshot

Latest local run on 2026-07-17 using `SAMPLE_SIZE=25`:

| Difficulty | Games | Win Rate | Avg Turns | Avg Wrong Guesses | Avg Latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| Easy | 25 | 60.0% | 7.44 | 4.04 | 6.90 ms |
| Medium | 25 | 88.0% | 8.88 | 2.96 | 45.81 ms |
| Hard | 25 | 100.0% | 9.28 | 1.76 | 206.54 ms |

Full methodology and results live in [docs/ai_benchmark.md](./docs/ai_benchmark.md).

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Environment variables:

- `PORT` optional, defaults to `5000`
- `CLIENT_URL` required for cross-origin frontend access in production
- `MONGO_URI` optional, enables persistence and auth-backed stats
- `JWT_SECRET` required if auth endpoints are used
- `JWT_EXPIRES_IN` optional, defaults to `7d`
- `DATAMUSE_API_KEY` optional, API key for the Datamuse fallback (only required after Jan 1, 2027)

### Testing Web Fallback & AI Explainer

1. Start both the frontend and backend servers locally.
2. Navigate to reverse mode ("AI interrogates you").
3. Set a slang word or proper noun (e.g. `DIDDY`).
4. You will see a warning banner: `Word not in AI dictionary — operating on frequency fallback`.
5. The AI will pull wildcard match candidates from the Datamuse API, and a green `🌐 Web-Assisted` badge will appear.
6. Click the collapsible **AI Reasoning Explainer** dashboard below to view real-time calculations, strategy details, and letter scores.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Use `VITE_API_URL=http://localhost:5000` for local backend integration.

## Quality Commands

Backend:

```bash
cd backend
npm test
npm run benchmark:ai
npm run words:build
```

`npm run words:build` regenerates `backend/data/words_game_curated.txt` from the raw corpus using the current gameplay filters and blocklist.

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Project Structure

```text
backend/
  config/        Database connection
  controllers/   REST game and auth handlers
  data/          Curated gameplay dictionary and word blocklist
  middleware/    JWT auth middleware
  models/        Mongoose models
  routes/        API routes
  scripts/       Benchmark and evaluation scripts
  services/      AI word-selection and guessing logic
  socket/        Real-time multiplayer room logic
  test/          Backend regression tests
frontend/
  src/components/  UI and 3D scene components
  src/hooks/       Reusable game and socket hooks
  src/pages/       Route-level screens
docs/             Architecture, deployment, API, and benchmark docs
```

## Documentation

- [docs/README.md](./docs/README.md)
- [docs/architecture_overview.md](./docs/architecture_overview.md)
- [docs/api_reference.md](./docs/api_reference.md)
- [docs/socket_multiplayer.md](./docs/socket_multiplayer.md)
- [docs/ai_benchmark.md](./docs/ai_benchmark.md)
