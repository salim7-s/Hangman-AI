# 🎮 AI Hangman

A full-stack MERN Hangman game with three play modes, a real-time multiplayer lobby, and a 3D animated character board.

| Feature | Stack |
|---------|-------|
| Frontend | React 19 + Vite + TailwindCSS v4 |
| 3D Scene | Three.js + React Three Fiber |
| Backend  | Node.js + Express + Socket.io |
| Database | MongoDB Atlas (free tier) |
| Deploy   | Vercel (frontend) + Render (backend) |

---

## 🕹️ Game Modes

- **Guess Against AI** — AI picks a word; you solve it in 6 attempts
- **Watch AI Guess** — You set the word; AI tries to crack it using frequency analysis
- **Local Duel** — Pass-and-play on the same device
- **Multiplayer Lobby** — Real-time socket rooms with role-swapping rematch

---

## 🚀 Deployment

The full deployment instructions for MongoDB, Render (Backend), and Vercel (Frontend) are located in the [docs/deployment_guide.md](docs/deployment_guide.md) file. This guide provides a step-by-step, free-tier deployment strategy.

---

## 💻 Local Development

### Prerequisites
- Node.js ≥ 18
- (Optional) MongoDB URI — works without it in-memory mode

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env — add MONGO_URI if you want persistence
npm install
npm run dev
# → http://localhost:5000
```

### Frontend
```bash
cd frontend
# .env already has VITE_API_URL=http://localhost:5000 for local dev
npm install
npm run dev
# → http://localhost:5173
```

---

## 📁 Project Structure

```
hangman-ai/
├── backend/
│   ├── config/        # MongoDB connection
│   ├── controllers/   # gameController, authController
│   ├── middleware/    # JWT auth middleware
│   ├── models/        # Mongoose User & Game models
│   ├── routes/        # /api/game, /api/auth
│   ├── services/      # AI frequency-analysis engine
│   ├── socket/        # Socket.io multiplayer rooms
│   ├── server.js      # Entry point
│   └── .env.example   # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── components/  # HangmanScene, Keyboard, ResultModal
│   │   ├── hooks/       # useStreak, useSounds, useSocket
│   │   ├── pages/       # Home, Game, MultiplayerLobby
│   │   └── services/    # axios API client, runtimeConfig
│   ├── vercel.json    # SPA fallback rewrites
│   └── .env           # Local dev env (VITE_API_URL)
└── words_250000_train.txt  # AI dictionary (2.35MB)
```

---

## 🤖 AI Algorithm

The AI guesser (`backend/services/aiService.js`) implements a **Multi-Tiered Intelligence Engine**:

1. **Rookie (Easy):** Uses raw letter frequency to guess like a human beginner.
2. **Detective (Medium):** Uses a heuristic balancing frequency, positional probability, and elimination power.
3. **Chief (Hard):** Uses a mathematically perfect **Shannon Entropy** algorithm. It calculates the exact expected information gain (in bits) for every available letter, guaranteeing the absolute fastest path to isolating the target word within the 250,000-word dictionary.

All brains gracefully fall back to standard English letter frequency order (`E,T,A,O…`) when no dictionary candidates remain.

---

## 🔐 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | No* | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes (auth) | Random secret for JWT signing |
| `JWT_EXPIRES_IN` | No | Token lifespan (default: 7d) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `NODE_ENV` | No | `development` or `production` |

*Without `MONGO_URI`, the app runs in-memory (stats don't persist)

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Backend URL (e.g., Render URL) |
