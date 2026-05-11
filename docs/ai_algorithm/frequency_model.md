# The Rookie: Frequency Engine (Easy Mode)

The "Rookie" difficulty utilizes a naive **Raw Frequency Model**. It is designed to emulate how a beginner human plays Hangman.

## How It Works

1. **Count Occurrences:** After filtering the dictionary down to the remaining valid candidates, the AI iterates over them and counts the presence of each unguessed letter.
2. **Binary Presence:** Unlike the Medium AI (which counts how many times a letter appears in total), the Rookie AI only registers a binary `1` or `0` for whether the letter exists anywhere inside a given candidate word. This prevents the algorithm from being skewed by words with double or triple letters (e.g., "MISSISSIPPI").
3. **Randomization Factor:** To make the Rookie feel human and fallible, a small degree of randomness is injected into the final score:
   `score = count * (0.8 + Math.random() * 0.4)`
4. **Execution:** The letter with the highest score is guessed.

## Strengths and Weaknesses
This model will naturally gravitate toward vowels and standard consonants (`E`, `A`, `R`, `T`), which makes it relatively effective in the early game. However, because it ignores positional constraints and elimination power, it will often waste guesses on letters that provide very little actual information, allowing the human player to easily survive the interrogation.
