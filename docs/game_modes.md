# Game Modes

This document explains how each play mode works from both the player perspective and the backend logic perspective.

## 1. AI vs Player

Intent:

- The backend chooses the secret word.
- The player guesses letters until they solve the word or run out of attempts.

Backend behavior:

- `POST /api/game/start` is called with `mode: "ai-vs-player"`.
- The backend selects a word from the curated dictionary based on difficulty.
- `POST /api/game/guess` accepts human letter guesses.

Win condition:

- the masked word has no underscores left

Loss condition:

- wrong guesses reach 6

## 2. Player vs AI

Intent:

- The player provides the secret word.
- The AI becomes the guesser and makes one calculated guess per request cycle.

Backend behavior:

- `POST /api/game/start` is called with `mode: "player-vs-ai"` and a `word`.
- Every `POST /api/game/guess` advances the AI by one guess.
- The AI strategy depends on the selected difficulty.

Difficulty mapping:

- `easy`: frequency-based guesses with a small random factor
- `medium`: heuristic score using frequency, position, and candidate coverage
- `hard`: Shannon entropy maximization

Why this mode is useful:

- it demonstrates the AI engine directly
- it makes the difficulty differences visible

## 3. Player vs Player

Intent:

- Two local users share one device.
- One player enters the word and the other guesses it.

Backend behavior:

- `POST /api/game/start` is called with `mode: "player-vs-player"` and a `word`.
- `POST /api/game/guess` handles the guesser’s turns exactly like a normal Hangman round.

Use case:

- simple local multiplayer without sockets or accounts

## 4. Multiplayer Lobby

Intent:

- Two remote players connect to the same room in real time.
- One becomes the word giver and the other becomes the guesser.
- Signed-in users can have their multiplayer results reflected on the leaderboard.

Transport:

- Socket.io, not REST

Lifecycle:

1. Host creates a room.
2. Second player joins using the room code.
3. Word giver submits the secret word.
4. Guesser sends letter guesses.
5. Both clients receive synchronized room state updates.
6. A rematch swaps roles.

Important differences from local duel:

- state lives in the socket room object instead of the REST game store
- no account is required, but signed-in users get better leaderboard tracking
- rooms can be restored on reconnect when the same nickname rejoins
- MongoDB-backed rooms can persist beyond a single in-memory session

Multiplayer result tracking:

- if MongoDB is enabled, multiplayer wins and losses are written to the `User` model
- the backend prefers stable `userId` from the socket auth token
- guest fallback uses nickname matching against `User.username`, which is less reliable than signed-in play

For event-level details, read [socket_multiplayer.md](./socket_multiplayer.md).
