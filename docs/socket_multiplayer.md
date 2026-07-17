# Socket Multiplayer Architecture

The multiplayer mode uses a room-based Socket.IO architecture with two runtime behaviors:

- MongoDB enabled: rooms can persist in the `MultiplayerRoom` model and survive reconnects
- MongoDB disabled: rooms live in memory only and are lost when the process restarts

The server is authoritative for room membership, the secret word, guesses, chat, and end-of-match stats.

## Room Storage Model

The backend uses a lightweight abstraction:

- `memRooms` for in-memory fallback
- `MultiplayerRoom` documents when MongoDB is connected

Each room contains:

```text
code
wordGiver { socketId, userId, nickname, connected, lastSeenAt }
guesser   { socketId, userId, nickname, connected, lastSeenAt }
word
maskedWord
guesses
wrongGuesses
maxAttempts
status
chatMessages
```

Statuses:

- `waiting`
- `word-entry`
- `ongoing`
- `won`
- `lost`
- `abandoned`

## Identity Model

Sockets may be authenticated or guest-based.

- The client passes the JWT in `socket.handshake.auth.token`
- the server resolves `socket.data.user` from that token when possible
- multiplayer stat updates prefer `userId`
- guest fallback uses `nickname` matching against `User.username`

This is why live multiplayer leaderboard updates are most reliable when the user is signed in.

## Event Lifecycle

### 1. Room Creation

`create-room`:

- validates nickname
- generates a unique 6-character room code
- creates the `wordGiver`
- stores `userId` if the socket is authenticated
- returns:
  - `code`
  - `role: "word-giver"`
  - `screen: "create"`
  - sanitized room state

### 2. Room Join

`join-room`:

- validates room code and nickname
- supports reconnect for a disconnected `word-giver` or `guesser`
- otherwise fills the empty `guesser` slot when the room is still waiting
- moves the room into `word-entry`
- emits:
  - `room-joined`
  - `guesser-joined`
  - or `game-state`, depending on room state

### 3. Word Entry

`submit-word`:

- only the current `word-giver` may submit the word
- word must be 2 to 20 letters
- initializes:
  - `word`
  - `maskedWord`
  - `status = "ongoing"`
- broadcasts:
  - `game-started`
  - `game-state`

### 4. Guess Loop

`guess-letter`:

- only the current `guesser` may guess
- rejects repeated or invalid guesses
- updates:
  - `guesses`
  - `wrongGuesses`
  - `maskedWord`
  - terminal room status when appropriate

When the match ends:

- `won` means the guesser solved the word
- `lost` means the guesser ran out of attempts
- multiplayer stats update in the `User` collection when MongoDB is available

### 5. Chat

`send-chat-message`:

- only room participants may send messages
- trims and normalizes whitespace
- caps messages at 240 characters
- stores the last 50 messages
- broadcasts `chat-message`

### 6. Rematch

`rematch`:

- swaps the roles of `wordGiver` and `guesser`
- resets word, guesses, and wrong guesses
- sets `status = "word-entry"`
- emits:
  - `rematch-started`
  - `role-updated`
  - `game-state`

### 7. Disconnect and Reconnect

On disconnect:

- the matching participant is marked offline
- `socketId` is cleared
- `lastSeenAt` is updated
- if both players are offline and the room never started, the room can become `abandoned`

Reconnect works by joining again with the same nickname. If the socket is authenticated, the room also keeps the stable `userId`.

## Sanitization and Secret Protection

The backend never sends the secret word during active play through `sanitize(room)`.

Sanitized room state includes:

- public role nicknames
- masked word
- guesses and wrong guesses
- attempts left
- connection flags
- chat messages

The true `word` is appended only after the room leaves `ongoing`, so the UI can reveal it on win/loss.

## Frontend Integration Notes

The frontend client:

- uses `useSocket()` to keep a shared singleton connection
- reconnects with the current JWT token when auth changes
- uses the same backend base URL as REST through `getApiBaseUrl()`

If multiplayer fails on production, check:

1. Vercel `VITE_API_URL`
2. Render `CLIENT_URL`
3. Render health and logs
4. whether both users are reaching the same backend instance
