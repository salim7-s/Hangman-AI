# The Detective: Heuristic Engine (Medium Mode)

The "Detective" difficulty uses a highly tuned **Heuristic Scoring Model**. While not as mathematically perfect as Shannon Entropy, it is incredibly fast and simulates the logic of a highly skilled human player.

## How It Works

After filtering the dictionary to the remaining valid candidates, the engine evaluates every unguessed letter by calculating three distinct metrics. It then combines these metrics using a weighted formula.

### 1. Overall Frequency (Weight: 50%)
The algorithm counts how many times a letter appears across all remaining candidate words. The higher the frequency, the safer the guess.
`frequency = letterCount / totalCandidates`

### 2. Positional Probability (Weight: 30%)
In Hangman, you aren't just guessing letters; you are guessing them into specific blank slots. The algorithm checks how often a letter appears *specifically within the blank spaces* of the remaining words.
`positionalProbability = sum(positionalFreqs) / numberOfBlanks`

### 3. Elimination Power (Weight: 20%)
A good guess should narrow down the field. The algorithm checks how many words would be immediately eliminated if the letter turns out to be a wrong guess. 
`eliminationPower = wordsWithoutLetter / totalCandidates`

## The Formula
For every available letter, the AI calculates a final score:
```
Score = (0.5 * frequency) + (0.3 * positionalProbability) + (0.2 * eliminationPower)
```
The letter with the highest score is submitted as the guess. This results in a very aggressive AI that rapidly zeroes in on the correct word, but can occasionally be tricked by statistically anomalous words.
