# Final Changes Roadmap

This file lists the highest-value remaining changes for Hangman AI, ordered by impact on product quality and resume strength.

## 1. Tighten The Gameplay Dictionary

Current state:

- The app now separates the raw 250k corpus from the curated gameplay dictionary.
- Gameplay words are generated into `backend/data/words_game_curated.txt`.
- You can manually exclude bad words with `backend/data/word_blocklist.txt`.

What to do next:

- Review the curated gameplay list and remove obscure, offensive, or low-quality words.
- Reduce the list further to common English words if the game should feel more polished.
- Consider maintaining a manually approved top-tier game list for production.

Why it matters:

- This directly improves player experience.
- It prevents the AI from choosing or guessing words that make the project look weak in demos.

## 2. Decide Whether To Use An External API

Recommendation:

- Do not use an API just to select gameplay words.
- Use an API only if you want extra metadata, not core word selection.

Good use cases for an API:

- checking word frequency or commonness
- retrieving dictionary definitions
- profanity filtering
- validating whether a word is standard English

Best architecture if you use one:

- run a one-time offline enrichment script
- save the cleaned results locally
- keep gameplay independent of runtime API calls

Avoid:

- calling a third-party API on every game start
- making AI guesses depend on a live external service

Why:

- runtime APIs add latency, cost, rate limits, and reliability risk
- a local curated list is better for a game like this

Suggested approach:

1. Keep the current local gameplay dictionary.
2. If needed, enrich it once using an external API or dataset.
3. Store the approved output in the repo or deployment storage.

## 3. Strengthen Multiplayer Persistence

Current state:

- multiplayer rooms now persist to MongoDB when available
- an in-memory fallback still exists when MongoDB is absent

What to do:

- move room state to Redis or MongoDB
- store room code, players, role, guesses, wrong guesses, status, and timestamps
- add room expiration/cleanup

Why it still matters:

- the in-memory fallback still loses rooms on restart
- multi-instance coordination is still not solved for a scaled deployment
- there is still no dedicated expiry, cleanup, or cross-instance cache layer

Resume value:

- shows you understand state management beyond a demo-only socket implementation

## 4. Improve Multiplayer Reconnect And Recovery

Current state:

- reconnect by nickname already works
- Mongo-backed rooms can restore state after disconnect

What to do next:

- strengthen reconnect identity beyond nickname matching alone
- consider short-lived reconnect/session tokens
- explicitly expire abandoned rooms and stale reconnect windows

Why it matters:

- real users disconnect and refresh
- reconnect support makes the multiplayer mode feel complete

## 5. Add Multiplayer Abuse And Validation Controls

What to do:

- validate nickname length and allowed characters more centrally
- rate-limit room creation and socket spam
- restrict duplicate guesses more defensively
- log suspicious socket event patterns

Why it matters:

- strengthens reliability and security
- gives you a better engineering story in interviews

## 6. Add Socket Tests

Current state:

- backend controller and AI tests exist
- socket flow tests do not yet exist

What to do:

- test create room
- test join room
- test submit word
- test guess progression
- test rematch role swap
- test disconnect behavior

Why it matters:

- multiplayer is one of the most important features in the project
- without tests, regressions are easy

## 7. Improve AI Evaluation Quality

Current state:

- benchmark script exists and reports win rate, turns, wrong guesses, and latency

What to do:

- increase sample sizes
- compare `AI_WORD_POOL=game` vs `AI_WORD_POOL=full`
- save benchmark outputs into versioned result files
- chart accuracy and latency by difficulty

Why it matters:

- turns the AI from a claim into measurable engineering work

## 8. Add Observability

What to do:

- structured backend logs
- request IDs
- socket event logging
- counters for games started, games completed, AI wins, player wins, reconnects, and room abandonment

Why it matters:

- production systems need visibility
- helps you explain how you would operate the app, not just build it

## 9. Clean Deployment Story

What to do:

- verify frontend production build outside the restricted sandbox
- document environment variables clearly
- confirm CORS and Socket.IO settings for deployed URLs
- document the Redis/Mongo choice if multiplayer persistence is added
- document Vercel `VITE_API_URL` and Render `CLIENT_URL` as mandatory production values

Why it matters:

- makes the project easier to demo and easier for recruiters to trust

## 10. Add A Strong Final Resume Feature

Choose one:

- ranked matchmaking or ELO leaderboard
- spectator mode for multiplayer rooms
- replay/history of completed games
- AI hint system for players
- adaptive AI difficulty based on player performance

Why it matters:

- one polished advanced feature is better than many half-finished ones

## Recommended Order

If the goal is resume impact with limited time, do the remaining work in this order:

1. tighten the curated gameplay dictionary
2. strengthen multiplayer persistence
3. improve reconnect support
4. add socket tests
5. improve AI evaluation and save benchmark results
6. add one standout feature such as ranked play or spectator mode

## Short Answer On API Usage

If you still want to use an API:

- use it offline to enrich or validate your word list
- do not make gameplay depend on it live

That gives you the benefit of better word quality without hurting performance or reliability.
