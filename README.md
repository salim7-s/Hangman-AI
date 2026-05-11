# 🎮 AI Hangman

A full-stack MERN Hangman game with three play modes, a real-time multiplayer lobby, and a 3D animated character board.

| Feature | Stack |
|---------|-------|
| Frontend | React 19 + Vite + TailwindCSS v4 |
| 3D Scene | Three.js + React Three Fiber |
| Backend  | Node.js + Express + Socket.io |
| Database | MongoDB Atlas (free tier) |
| Deploy   | Vercel (frontend) + Railway (backend) |

---

## 🕹️ Game Modes

- **Guess Against AI** — AI picks a word; you solve it in 6 attempts
- **Watch AI Guess** — You set the word; AI tries to crack it using frequency analysis
- **Local Duel** — Pass-and-play on the same device
- **Multiplayer Lobby** — Real-time socket rooms with role-swapping rematch

---

## 🚀 Deployment Guide (Free Tier — No Credit Card)

### Step 1 — Get a Free MongoDB Atlas Database

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account → **Create a Free Cluster** (M0, any region)
3. In **Database Access** → Add a database user (username + password, save these)
4. In **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
5. In **Clusters** → click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with what you set in step 3
7. Add `/hangman` before the `?` to name your database:
   ```
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hangman?retryWrites=true&w=majority
   ```
   → This is your `MONGO_URI`

---

### Step 2 — Deploy the Backend to Railway (Free)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub (free)
2. **New Project** → **Deploy from GitHub repo** → select this repo
3. Set the **Root Directory** to `backend`
4. Railway auto-detects Node.js and runs `npm start`
5. Go to **Variables** and add:
   ```
   MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hangman?retryWrites=true&w=majority
   JWT_SECRET=any_long_random_string_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   CLIENT_URL=https://your-app.vercel.app   ← fill in after Step 3
   ```
6. Go to **Settings → Networking** → Generate a public domain
7. Copy your Railway URL (e.g., `https://hangman-ai-backend.up.railway.app`)

---

### Step 3 — Deploy the Frontend to Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free)
2. **Add New Project** → Import this repo
3. Set **Root Directory** to `frontend`
4. Vercel auto-detects Vite
5. Under **Environment Variables** add:
   ```
   VITE_API_URL=https://hangman-ai-backend.up.railway.app
   ```
   (replace with your actual Railway URL from Step 2)
6. Click **Deploy**
7. Copy your Vercel URL (e.g., `https://hangman-ai.vercel.app`)

---

### Step 4 — Connect Frontend → Backend

1. Go back to Railway → your backend service → **Variables**
2. Update `CLIENT_URL` to your Vercel URL:
   ```
   CLIENT_URL=https://hangman-ai.vercel.app
   ```
3. Railway will auto-redeploy

✅ Done — your full-stack app is live!

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
│   │   ├── services/    # axios API client, runtimeConfig
│   │   └── skins/       # 3D character skin definitions
│   ├── vercel.json    # SPA fallback rewrites
│   └── .env           # Local dev env (VITE_API_URL)
└── words_250000_train.txt  # AI dictionary (2.35MB)
```

---

## 🤖 AI Algorithm

The AI guesser (`backend/services/aiService.js`) implements a **frequency-analysis heuristic**:

1. **Filter** the 250k-word dictionary to match the current pattern (length, revealed positions, no wrong letters)
2. **Score** each unguessed letter:
   ```
   score = 0.5 × frequency + 0.3 × positionalProbability + 0.2 × eliminationPower
   ```
3. **Guess** the highest-scoring letter
4. Falls back to English letter frequency order (`E,T,A,O…`) when no candidates remain

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
| `VITE_API_URL` | Yes (prod) | Backend URL (e.g., Railway URL) |
