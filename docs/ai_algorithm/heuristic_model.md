# The Detective: Heuristic Engine (Medium Mode)

Medium mode is implemented by `aiGuessMedium(candidates, patternChars, wordLen, guessedSet, FALLBACK)`. It is a hand-built scoring model that sits between the simplicity of easy mode and the exhaustive information theory of hard mode.

In the current codebase, `candidates` has already been filtered from the active AI pool and narrowed by word length before medium mode applies its scoring formula.

## Full Function

```javascript
function aiGuessMedium(candidates, patternChars, wordLen, guessedSet, FALLBACK) {
  const candidateCount = candidates.length
  if (candidateCount === 0) return FALLBACK.find(l => !guessedSet.has(l)) || 'E'

  const freq = {}
  const positionalFreq = Array.from({ length: wordLen }, () => ({}))

  for (const word of candidates) {
    const seen = new Set()
    for (let i = 0; i < word.length; i++) {
      const ch = word[i]
      if (guessedSet.has(ch)) continue
      if (!seen.has(ch)) {
        freq[ch] = (freq[ch] || 0) + 1
        seen.add(ch)
      }
      if (patternChars[i] === '_') {
        positionalFreq[i][ch] = (positionalFreq[i][ch] || 0) + 1
      }
    }
  }

  let bestLetter = null
  let bestScore  = -1

  for (const [letter, f] of Object.entries(freq)) {
    if (guessedSet.has(letter)) continue

    const frequency = f / candidateCount

    let positionalSum = 0
    let blankCount    = 0
    for (let i = 0; i < wordLen; i++) {
      if (patternChars[i] === '_') {
        positionalSum += (positionalFreq[i][letter] || 0) / candidateCount
        blankCount++
      }
    }
    const positionalProbability = blankCount > 0 ? positionalSum / blankCount : 0

    const withLetter       = candidates.filter(w => w.includes(letter)).length
    const eliminationPower = withLetter / candidateCount

    const score = 0.5 * frequency + 0.3 * positionalProbability + 0.2 * eliminationPower

    if (score > bestScore) {
      bestScore  = score
      bestLetter = letter
    }
  }

  return bestLetter || FALLBACK.find(l => !guessedSet.has(l)) || 'E'
}
```

## What It Tracks

Medium mode builds two kinds of statistics:

1. `freq`
2. `positionalFreq`

### `freq`

`freq[letter]` counts in how many candidate words a letter appears.

Like easy mode, it uses `seen` so a word only contributes once per letter:

```javascript
if (!seen.has(ch)) {
  freq[ch] = (freq[ch] || 0) + 1
  seen.add(ch)
}
```

### `positionalFreq`

`positionalFreq[i][letter]` counts how often a letter appears at position `i`, but only for unrevealed slots:

```javascript
if (patternChars[i] === '_') {
  positionalFreq[i][ch] = (positionalFreq[i][ch] || 0) + 1
}
```

This lets the AI prefer letters that are not only common overall, but especially common in the still-hidden positions.

## The Three Score Components

### 1. Frequency

```javascript
const frequency = f / candidateCount
```

Interpretation:

- If `frequency = 0.80`, the letter appears in 80% of remaining candidates.

This is the same broad idea as easy mode, but now it becomes only one part of the final decision.

### 2. Positional Probability

```javascript
let positionalSum = 0
let blankCount = 0

for (let i = 0; i < wordLen; i++) {
  if (patternChars[i] === '_') {
    positionalSum += (positionalFreq[i][letter] || 0) / candidateCount
    blankCount++
  }
}

const positionalProbability = blankCount > 0 ? positionalSum / blankCount : 0
```

Interpretation:

- Check only blank positions.
- Ask how often this letter appears in those positions across the candidate set.
- Average that across all blank slots.

This rewards letters that are likely to reveal something immediately on the visible board.

### 3. Elimination Power

```javascript
const withLetter = candidates.filter(w => w.includes(letter)).length
const eliminationPower = withLetter / candidateCount
```

In this implementation, `eliminationPower` is actually the fraction of candidates that contain the letter.

Practical effect:

- High value means the guess is likely to hit something.
- It does not model worst-case pruning directly.
- It behaves more like candidate coverage than a true elimination metric.

That naming mismatch is important if you plan to tune or extend the algorithm.

## Final Score

```javascript
const score =
  0.5 * frequency +
  0.3 * positionalProbability +
  0.2 * eliminationPower
```

Weight summary:

- `0.5`: broad usefulness
- `0.3`: board-position usefulness
- `0.2`: coverage across candidates

The letter with the largest score is returned.

## Worked Example

Suppose the current visible pattern is:

```text
_ A _ _ E
```

And the filtered candidates are:

```text
CABLE
TABLE
MAPLE
EAGLE
```

For the letter `L`:

- Frequency is high because `L` appears in all four candidates.
- Positional probability is also high because `L` repeatedly appears in still-hidden positions.
- Coverage is high because all candidates contain `L`.

For the letter `T`:

- Frequency is low because only `TABLE` contains it.
- Position usefulness is narrow.
- Coverage is low.

The heuristic will strongly prefer `L`.

## Why Medium Often Feels Strong

This model is good in practice because it combines:

- Candidate-wide popularity
- Positional relevance
- Immediate chance of getting a hit

That makes it much better than a naive frequency picker while remaining cheaper than entropy search.

## Limitations

- It is still heuristic, not globally optimal.
- `candidates.filter(w => w.includes(letter))` is recomputed for every letter, which is simple but not the most efficient implementation.
- The score weights are hand-tuned constants, not learned values.
- The current `eliminationPower` name can be misleading because the value measures inclusion, not exclusion.
