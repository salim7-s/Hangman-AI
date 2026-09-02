# Systems & Algorithmic Optimizations

This document highlights the core backend, frontend, database, and algorithmic optimizations implemented in Hangman AI to ensure low latency, high win rates, scalability, and robust performance under constraint-driven environments.

---

## 1. Algorithmic Optimizations

### Adaptive Candidate Frequency Solver
*   **The Problem:** Pure letter frequency over generalized English corpuses (like E-T-A-O-I-N) performs poorly because it doesn't adapt to the letters currently revealed. Entropy-based splits (Shannon Entropy) are mathematically elegant but waste critical guesses ("lives") on letters that split the remaining word set 50/50 but don't actually appear in the target word.
*   **The Optimization:** Upgraded the "Chief" (Hard) difficulty solver to utilize a **dynamic candidate-frequency algorithm**. For every turn:
    1.  The solver filters the dictionary to generate a subset of words matching the current pattern (e.g. `A _ _ A`) and containing no disqualified letters.
    2.  It counts the frequency of each remaining letter only within those active candidates.
    3.  It guesses the letter appearing in the highest number of candidate words, maximizing the probability of a correct guess (essential when incorrect guesses cost lives).

### Bucketing Dictionary Indices by Length
*   **The Problem:** Scanning a full vocabulary of 250,000+ words on every guess triggers a $O(N)$ linear search, introducing high processing latency on the Node.js event loop during gameplay checks.
*   **The Optimization:** Indexed the vocabulary into a `Map` bucketed by word length during server startup:
    ```javascript
    const rawWordsByLength = new Map(); // Key: Length, Value: Word Array
    ```
    This reduces the search space instantly. For a 4-letter word search, the search space drops from **250,000 words** to **~8,000 words** in $O(1)$ lookup time.

---

## 2. Machine Learning & Persistent Feedback

### Decay-Weighted Reinforcement Learning Loop
*   **The Problem:** AI solvers are typically deterministic. If a target word has an unusual pattern, the AI will make the exact same wrong guesses and lose the exact same way every single game.
*   **The Optimization:** Implemented a persistent feedback store (`ai_learning.json`) that learns from every game lost:
    1.  **Failure Capture:** On game over, the backend isolates the wrong letters guessed.
    2.  **Penalty Accrual:** It writes a penalty weight (`+1.0`) to those letters keyed by word length.
    3.  **Weighted Guesses:** In subsequent games, candidate letter scores are scaled down by their learning penalty:
        $$\text{Effective Score} = \left(\frac{\text{Word Hits}}{\text{Total Candidates}}\right) \times (1.0 - \text{Penalty})$$
    4.  **Temporal Decay:** Every game decays existing penalties by **5%** so the AI adapts without permanent negative bias.

---

## 3. Network & API Optimization

### Concurrent Local/Remote Blending
*   **The Problem:** If a user inputs slang, modern acronyms, or proper nouns (e.g., `DIDDY`), they aren't in the static dictionary. Querying APIs sequentially creates high latency (waterfall requests), while ignoring them causes the AI to fail silently.
*   **The Optimization:** Designed a parallel execution model using `Promise.all` combining local dictionary queries and Datamuse API wildcard matches:
    ```javascript
    const [localCandidates, externalCandidates] = await Promise.all([
      filterLocalDictionary(pattern),
      fetchDatamuseCandidates(pattern, wrongLetters)
    ]);
    ```
    Both sources resolve simultaneously, merging results into a unified candidate pool with a target response latency under **150ms**.

### TTL-Backed Memory Cache
*   **The Problem:** Repeated calls to the Datamuse API for the same game state waste API quota and slow down UI transitions.
*   **The Optimization:** Created an in-memory TTL (Time-To-Live) cache layer mapping search terms to candidate lists. Cached results automatically expire after **5 minutes**:
    ```javascript
    setTimeout(() => datamuse_cache.delete(cacheKey), 5 * 60 * 1000);
    ```

---

## 4. UI & Layout Responsiveness

### Zoom-Independent Layout System
*   **The Problem:** Using viewport-relative dimensions (`vh`, `vw`) or aggressive tailwind layout wrappers forced vertical scrolling on standard laptop displays (768px height) and stretched containers on widescreen monitors.
*   **The Optimization:**
    -   Restructured layout to place the landing page (vertically centered) and setup panel (top-aligned scrollable wrapper) in distinct flow containers.
    -   Reduced panel paddings from `sm:p-12` to `sm:p-8` and compact vertical spacing from `space-y-10` to `space-y-5`.
    -   Capped main cards using Tailwind CSS max-width boundaries (`w-[90%] max-w-[860px]`) to ensure the application fits standard screens in one viewport height without scrolling.

---

## 5. Security & Persistence

### Transparent Optional Database Fallback
*   **The Problem:** Forcing a hard dependency on MongoDB Atlas prevents simple standalone deployments, while using local-only arrays removes leaderboards.
*   **The Optimization:** Implemented a transparent check that hooks into MongoDB if `MONGO_URI` is present, but seamlessly switches user sessions, matches, and gameplay records to a cleanup-backed memory store if MongoDB is missing.
