# Hangman AI - Presentation Notes & Demo Script

These are concise talking points and demo steps for presenting the final project.

## 1. Project Overview

What to say:

- "Welcome to our AI Hangman project. The goal was to take a simple classic game and turn it into a full-stack AI and systems project."
- "We built it with React, Node.js, Express, MongoDB, Socket.io, and browser-side 3D rendering through React Three Fiber."

## 2. The Artificial Intelligence

What to say:

- "Instead of random guessing, we implemented a multi-tiered AI engine based on frequency analysis, heuristic search, and information theory."
- "The AI filters the remaining candidate words after every guess using the visible pattern and wrong letters."

Explain the three tiers:

- **Rookie (Easy):** "Uses letter frequency with a small amount of random jitter, so it feels more human and less deterministic."
- **Detective (Medium):** "Uses a weighted heuristic score: `0.5 x Frequency + 0.3 x Positional Probability + 0.2 x Elimination Power`."
- **Chief (Hard):** "Uses Shannon entropy to maximize expected information gain on the next guess. It chooses the letter that best splits the remaining candidate space."

## 3. Live Demo Steps

### Step 1: Show the Interface

- Open the app locally at `http://localhost:5173` or the deployed Vercel URL.
- Point out the noir-paper styling and the 3D rendered scene.

### Step 2: Reverse Mode

- Select **Reverse** mode.
- Enter a word such as `DETECTIVE` or `AILUROID`.
- Set difficulty to **Chief (Hard)**.
- Start the game.

What to highlight:

- the AI is guessing one letter per turn
- the candidate count drops as the AI learns more
- hard mode is slower but more systematic because it computes entropy

### Step 3: Solo Mode

- Select **Solo** mode.
- Set difficulty to **Detective**.
- Make several wrong guesses on purpose.

What to highlight:

- the 3D character reacts visually to mistakes
- the UI updates are tied directly to game state from the backend

### Step 4: Multiplayer + Leaderboard

- Open multiplayer in two tabs or on two devices.
- Create a room, join it, submit a word, and finish a round.

What to highlight:

- multiplayer uses Socket.io rather than REST polling
- reconnect-aware room state exists
- signed-in users can feed results into the leaderboard

## 4. Key Challenges Overcome

What to say:

- **Performance:** "We indexed the AI dictionary by word length so we do not scan the full corpus on every guess."
- **Repeated Letters:** "We had to preserve valid repeated-letter candidates instead of over-pruning the search space."
- **Deployment Reliability:** "We debugged production issues around Vercel API URLs, Render CORS configuration, auth setup, and Mongo-backed registration."
- **Multiplayer State:** "We evolved the socket flow from simple in-memory rooms into a model that can also persist rooms and user-linked stats when MongoDB is available."

## 5. Conclusion

What to say:

- "The project combines algorithms, full-stack engineering, real-time communication, and production troubleshooting in one system."
- "Thank you. Any questions?"
