# AI Algorithm Overview

The AI guesser for `player-vs-ai` mode lives in `backend/services/aiService.js`. It is a three-level letter selection engine built on top of one shared pipeline:

1. Load and normalize the raw dictionary.
2. Build a curated gameplay pool and index the active AI pool by word length.
3. Filter the relevant length bucket to words still compatible with the board state.
4. Score the next guess using the selected difficulty strategy.
5. Fall back to standard English letter frequency if no candidates remain.

## Where It Is Used

The backend calls the AI from `backend/controllers/gameController.js` during `player-vs-ai` games:

```javascript
const { letter: aiLetter, candidateCount } = aiGuess(
  game.maskedWord,
  game.wrongGuesses,
  game.guesses,
  game.difficulty
)
```

That means the AI is not choosing an entire word. It only chooses the next letter.

## High-Level Flow

The entry point is `aiGuess(pattern, wrongLetters, guessedLetters, difficulty)`.

```javascript
function aiGuess(pattern, wrongLetters, guessedLetters, difficulty = 'medium') {
  const fallbackLetters = ['E', 'T', 'A', 'O', 'I', 'N', 'S', 'R', 'H', 'L', 'D', 'C', 'U', 'P', 'F', 'M', 'W', 'Y', 'B', 'G', 'V', 'K', 'Q', 'J', 'X', 'Z']

  if (!Array.isArray(wrongLetters)) wrongLetters = wrongLetters ? [...wrongLetters] : []
  if (!Array.isArray(guessedLetters)) guessedLetters = guessedLetters ? [...guessedLetters] : []

  const patternChars = pattern.split(' ')
  const wordLen = patternChars.length
  const sourceWords = aiWordsByLength.get(wordLen) || []

  const candidates = sourceWords.filter((word) => {
    for (let index = 0; index < wordLen; index++) {
      if (patternChars[index] !== '_' && word[index] !== patternChars[index]) {
        return false
      }
    }

    for (const wrongLetter of wrongLetters) {
      if (word.includes(wrongLetter)) {
        return false
      }
    }

    return true
  })

  const guessedSet = new Set(guessedLetters.map((letter) => letter.toUpperCase()))
  // difficulty dispatch happens here
}
```

## Step 1: Dictionary Loading

At server startup, `loadDictionary()` reads:

- the raw corpus: `words_250000_train.txt`
- the curated gameplay list when available
- the optional blocklist

It builds:

```javascript
rawWords
gameplayWords
easyWords
mediumWords
hardWords
aiPoolWords
rawWordsByLength
gameplayWordsByLength
aiWordsByLength
```

Important distinctions:

- `getRandomWord(difficulty)` uses curated difficulty buckets: `easyWords`, `mediumWords`, `hardWords`
- `aiGuess(...)` uses the active AI pool selected by `AI_WORD_POOL`
- default behavior is `AI_WORD_POOL=game`, meaning the AI works from the curated gameplay dictionary
- if `AI_WORD_POOL=full`, the AI uses the full raw corpus instead

## Step 2: Candidate Filtering

Before scoring any letter, the AI reduces the active pool to candidates that are still possible.

Current filter rules:

1. the word length must match the board
2. every revealed letter must match exactly at that position
3. none of the known wrong letters may appear in the candidate

Actual filtering logic:

```javascript
const sourceWords = aiWordsByLength.get(wordLen) || []

const candidates = sourceWords.filter((word) => {
  for (let index = 0; index < wordLen; index++) {
    if (patternChars[index] !== '_' && word[index] !== patternChars[index]) {
      return false
    }
  }

  for (const wrongLetter of wrongLetters) {
    if (word.includes(wrongLetter)) {
      return false
    }
  }

  return true
})
```

One subtle but important behavior:

- the AI does not reject words just because a revealed letter might also appear in a blank position
- this is necessary for repeated-letter words such as `LEVEL`, `EERIE`, or `BALLOON`

## Step 3: Difficulty Strategy

Once `candidates` is built, the AI chooses the next letter with one of three strategies:

### Easy: frequency with jitter

- counts whether each unguessed letter appears in each candidate word
- uses a small random multiplier so the AI is not perfectly deterministic

### Medium: weighted heuristic

- scores letters using overall frequency, blank-slot position likelihood, and candidate coverage

### Hard: Shannon entropy

- simulates the feedback pattern for each candidate and picks the letter with maximum expected information gain

## Step 4: Fallback Behavior

If `candidateCount === 0`, all three difficulties fall back to this ordered list:

```javascript
['E', 'T', 'A', 'O', 'I', 'N', 'S', 'R', 'H', 'L', 'D', 'C', 'U', 'P', 'F', 'M', 'W', 'Y', 'B', 'G', 'V', 'K', 'Q', 'J', 'X', 'Z']
```

Why this exists:

- the user may enter a word that is not present in the selected AI pool
- the current pattern may become incompatible with the dictionary
- the AI still needs to return a legal guess instead of failing

This is why the UI can legitimately show `POSSIBILITIES: 0` while the AI still continues guessing.

## Strategy Comparison

| Difficulty | Function | Main idea | Cost | Behavior |
| --- | --- | --- | --- | --- |
| Easy | `aiGuessEasy` | Count common letters | Low | Human-like and imperfect |
| Medium | `aiGuessMedium` | Weighted heuristics | Medium | Strong practical balance |
| Hard | `aiGuessHard` | Information gain via entropy | Highest | Most systematic and ruthless |

## Notes on Accuracy

Three implementation details are easy to miss:

1. the AI is case-normalized to uppercase throughout, which keeps comparisons simple
2. `guessedLetters` and `wrongLetters` are defensively normalized so the function can survive malformed input without crashing
3. candidate filtering is indexed by word length first, which avoids scanning the entire pool on every guess

For the code-level explanation of each difficulty, read:

- `frequency_model.md`
- `heuristic_model.md`
- `shannon_entropy.md`
