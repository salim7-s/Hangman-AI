# AI Algorithm Overview

The AI engine driving the "Reverse Mode" (Player vs AI) in Hangman AI is not a single algorithm, but rather a **Multi-Tiered Intelligence System**. 

Located in `backend/services/aiService.js`, the AI engine dynamically scales its mathematical complexity and decision-making logic based on the user's selected difficulty.

## The Core Concept
Regardless of the difficulty level, the AI always begins its turn by performing a **State Reduction**. 
It takes the 250,000-word master dictionary and filters it down into a subset of "valid candidates" based on the absolute facts of the current game board:
1. **Length:** The candidate must match the length of the secret word.
2. **Revealed Letters:** The candidate must have the exact same letters in the exact same positions as the revealed pattern (e.g., `_ X _ M O R O N`).
3. **Excluded Letters:** The candidate must *not* contain any letters that the AI has previously guessed incorrectly.
4. **Blank Constraints:** The blank spaces (`_`) in the candidate must *not* contain any letters that are already revealed elsewhere in the word.

Once the dictionary is filtered down to this pool of valid candidates, the AI must choose which letter to guess next. How it makes this choice is determined by the three "Brains".

## The Three Brains

1. **Rookie (Easy):** The *Frequency* Model. It guesses based purely on how common a letter is across the remaining candidates, with a slight degree of randomness. (See `frequency_model.md`)
2. **Detective (Medium):** The *Heuristic* Model. It calculates a weighted score for each letter based on frequency, positional probability, and its power to eliminate wrong answers. (See `heuristic_model.md`)
3. **Chief (Hard):** The *Shannon Entropy* Model. It calculates the mathematically exact Information Gain of every possible letter, guaranteeing the absolute fastest path to solving the word. (See `shannon_entropy.md`)

## Fallback Mechanism
If the human player provides a word that does NOT exist in the AI's 250,000-word dictionary, the `candidateCount` will drop to `0`. 

When this happens, the AI prevents a crash by gracefully falling back to a hardcoded array of English letters sorted by standard frequency (`E, T, A, O, I, N, S, R, H...`). It will sequentially iterate through this list until the game concludes.
