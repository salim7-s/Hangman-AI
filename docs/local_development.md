# Local Development Guide

This guide covers the fastest way to run the project locally and explains the common environment options.

## Prerequisites

- Node.js 18 or later
- npm
- Optional MongoDB Atlas connection string if you want persistence and auth

## Repository Layout

- `backend/`: Express API, auth, AI logic, Socket.io server
- `frontend/`: React client built with Vite
- `docs/`: project documentation
- `words_250000_train.txt`: dictionary used by the AI

## Quick Start

From the project root:

```bash
npm install
npm run dev
```

This starts both apps together:

- backend: `http://localhost:5000`
- frontend: `http://localhost:5173`

## Backend Setup

Create `backend/.env` with values like:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
MONGO_URI=
NODE_ENV=development
```

Notes:

- Leave `MONGO_URI` empty to run in-memory mode.
- In-memory mode disables persistent auth and leaderboard data.

Run only the backend:

```bash
cd backend
npm run dev
```

Expected local URL:

- `http://localhost:5000`

## Frontend Setup

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:5000
```

Run only the frontend:

```bash
cd frontend
npm run dev
```

Expected local URL:

- `http://localhost:5173`

## Available Scripts

### Backend

- `npm start`: start the server with Node
- `npm run dev`: start the server with Nodemon

### Frontend

- `npm run dev`: start the Vite dev server
- `npm run build`: create a production build
- `npm run preview`: preview the production build locally
- `npm run lint`: run ESLint

## Local Run Sequence

Use this order for predictable startup:

1. Start the backend first so the API and socket server are available.
2. Start the frontend.
3. Open the frontend in the browser.
4. Test one REST mode and one multiplayer flow.

## Feature Matrix by Environment

| Feature | Works without MongoDB | Works with MongoDB |
| --- | --- | --- |
| AI vs player | Yes | Yes |
| Player vs AI | Yes | Yes |
| Local duel | Yes | Yes |
| Multiplayer sockets | Yes | Yes |
| Register/login | No | Yes |
| Leaderboard | No | Yes |
| Persistent game data | No | Yes |

## Troubleshooting

### Frontend cannot reach backend

Check:

- Backend is running on port `5000`
- `frontend/.env` points to the correct backend URL
- `backend/.env` has `CLIENT_URL=http://localhost:5173`
- On the live site, DevTools should never show requests to `http://localhost:5000`

### Auth returns `503`

Cause:

- MongoDB is not connected

Fix:

- Add a valid `MONGO_URI` to `backend/.env`
- Restart the backend

### Registration returns `500`

Check:

- `JWT_SECRET` is set and is not a placeholder value
- MongoDB is writable
- backend logs do not show `next is not a function`

Note:

- the password hash middleware is promise-based now; if production still shows this error, the backend has not redeployed the latest code

### Multiplayer room events are failing

Check:

- Frontend and backend are on matching URLs
- The backend process is not blocked by CORS
- Both players are connecting to the same backend instance

### AI falls back to simple guesses

Cause:

- The dictionary file may be missing or unreadable

Fix:

- Make sure `words_250000_train.txt` exists in the repository root

## Recommended Developer Reading

After setup, read:

1. [README.md](../README.md)
2. [architecture_overview.md](./architecture_overview.md)
3. [api_reference.md](./api_reference.md)
4. [socket_multiplayer.md](./socket_multiplayer.md)
