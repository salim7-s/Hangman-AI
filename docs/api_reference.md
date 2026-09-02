# API Reference

This document describes the backend HTTP API exposed by the Express server.

Base URL examples:

- Local backend: `http://localhost:5000`
- Production backend: your Render URL, for example `https://hangman-ai-backend.onrender.com`

## Health Endpoints

### `GET /`

Returns basic service information.

Example response:

```json
{
  "status": "ok",
  "game": "Hangman AI",
  "version": "1.0.0"
}
```

### `GET /api/health`

Returns a minimal health check.

Example response:

```json
{
  "status": "ok"
}
```

## Auth Endpoints

Authentication requires MongoDB. If `MONGO_URI` is not configured or MongoDB is unavailable, auth endpoints return `503`.

### `POST /api/auth/register`

Creates a user account.

Request body:

```json
{
  "username": "salim",
  "email": "salim@example.com",
  "password": "secret123"
}
```

Success response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "salim"
  }
}
```

Known error responses:

- `400`: `All fields are required`
- `400`: `Email already exists`
- `400`: `Username already exists`
- `503`: `Database not available - auth requires MongoDB`
- `503`: `Authentication is temporarily unavailable`
- `500`: `Registration failed`

Implementation notes:

- email is normalized to lowercase
- registration checks both username and email before creating the user
- if user creation succeeds but JWT signing fails, the backend deletes that new user and returns `503`

### `POST /api/auth/login`

Logs an existing user in.

Request body:

```json
{
  "email": "salim@example.com",
  "password": "secret123"
}
```

Success response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "salim"
  }
}
```

Known error responses:

- `400`: `Email and password are required`
- `401`: `Invalid credentials`
- `503`: `Database not available - auth requires MongoDB`
- `503`: `Authentication is temporarily unavailable`
- `500`: `Login failed`

## Game Endpoints

### `POST /api/game/start`

Creates a new game.

Optional auth:

- If a valid bearer token is supplied and MongoDB is enabled, the game is linked to the user.
- If auth is missing, gameplay still works.

Request body:

```json
{
  "mode": "ai-vs-player",
  "difficulty": "medium"
}
```

Supported modes:

- `ai-vs-player`: backend chooses the secret word
- `player-vs-ai`: player submits the word and the AI guesses
- `player-vs-player`: local pass-and-play word entry

Request body when the player must provide the word:

```json
{
  "mode": "player-vs-ai",
  "difficulty": "hard",
  "word": "hangman"
}
```

Success response:

```json
{
  "gameId": "game-or-db-id",
  "maskedWord": "_ _ _ _ _ _ _",
  "attemptsLeft": 6,
  "mode": "player-vs-ai",
  "difficulty": "hard"
}
```

Rules:

- `mode` is required.
- `word` is required for `player-vs-ai` and `player-vs-player`.
- provided words must contain letters only.

### `POST /api/game/guess`

Processes a guess or advances the AI turn, depending on mode.

Request body for player guessing modes:

```json
{
  "gameId": "game-or-db-id",
  "letter": "A"
}
```

Response shape:

```json
{
  "maskedWord": "A _ _ _ _ A _",
  "wrongGuesses": ["E", "I"],
  "guesses": ["A", "E", "I"],
  "attemptsLeft": 4,
  "status": "ongoing",
  "winner": null
}
```

Extra fields on completed games:

- `word`: revealed once the game ends

Extra fields for `player-vs-ai`:

- `aiGuess`: the AI letter guessed this turn
- `candidateCount`: how many dictionary candidates remained before the AI selected that guess

Validation notes:

- `gameId` is required.
- `letter` is required for human guessing modes.
- repeated guesses are rejected.
- finished games cannot be guessed again.

### `GET /api/game/:id`

Fetches the full game state.

Behavior:

- while a game is ongoing, the secret word is hidden
- once the game is over, the response includes `word`

### `GET /api/game/leaderboard`

Returns the top 10 players by wins.

Example response:

```json
[
  {
    "rank": 1,
    "username": "salim",
    "wins": 12,
    "gamesPlayed": 15,
    "winPercent": "80.0"
  }
]
```

Notes:

- if MongoDB is not enabled, this endpoint returns an empty array
- solo and local games update stats through the `Game` model when a linked user finishes a match
- multiplayer stats are updated from socket events and prefer `userId`; guest fallback uses nickname matching

## Persistence Behavior

The backend supports two runtime modes:

- MongoDB enabled: users, games, leaderboard, and multiplayer rooms can persist
- MongoDB disabled: games and rooms are stored in memory and disappear when the process restarts

This affects:

- auth availability
- leaderboard availability
- persistence of match history and user stats
- multiplayer room recovery after reconnect

## Security and Runtime Notes

- CORS only allows the configured `CLIENT_URL`
- `helmet` is enabled
- `/api/*` routes are protected by a rate limiter of 300 requests per 15 minutes
- errors are returned as JSON
