# The Chief: Shannon Entropy Engine (Hard Mode)

Hard mode is implemented by `aiGuessHard(candidates, wordLen, guessedSet, FALLBACK)`. This is the most algorithmic of the three strategies because it scores a letter by how well that guess partitions the remaining search space.

In the current codebase, `candidates` has already been filtered from the active AI pool and narrowed by word length before entropy search begins.

## Full Function

```javascript
function aiGuessHard(candidates, wordLen, guessedSet, FALLBACK) {
  const candidateCount = candidates.length
  if (candidateCount === 0) return FALLBACK.find(l => !guessedSet.has(l)) || 'E'

  if (candidateCount === 1) {
    for (const char of candidates[0]) {
      if (!guessedSet.has(char)) return char
    }
  }

  const possibleLetters = new Set()
  for (const word of candidates) {
    for (const char of word) {
      if (!guessedSet.has(char)) possibleLetters.add(char)
    }
  }

  if (possibleLetters.size === 0) return FALLBACK.find(l => !guessedSet.has(l)) || 'E'

  let bestLetter = null
  let maxEntropy = -1

  for (const letter of possibleLetters) {
    const buckets = {}

    for (const word of candidates) {
      let patternMatch = ''
      for (let i = 0; i < wordLen; i++) {
        patternMatch += (word[i] === letter ? '1' : '0')
      }
      buckets[patternMatch] = (buckets[patternMatch] || 0) + 1
    }

    let entropy = 0
    for (const count of Object.values(buckets)) {
      const p = count / candidateCount
      entropy -= p * Math.log2(p)
    }

    if (entropy > maxEntropy) {
      maxEntropy = entropy
      bestLetter = letter
    }
  }

  return bestLetter || FALLBACK.find(l => !guessedSet.has(l)) || 'E'
}
```

## Core Idea

Hard mode does not ask:

- Which letter is most common?

It asks:

- Which letter gives the most information about which candidate is the real word?

That is a different objective.

## Bucket Partitioning

For each candidate letter, the AI simulates what the board feedback would look like if that letter were guessed against every possible remaining word.

Example candidates:

```text
APPLE
AMPLE
ANGLE
```

Test letter: `P`

Generated pattern signatures:

- `APPLE` -> `01100`
- `AMPLE` -> `00100`
- `ANGLE` -> `00000`

Those signatures become buckets:

```javascript
const buckets = {
  "01100": 1,
  "00100": 1,
  "00000": 1
}
```

If a letter produces many small buckets, it is good because the next board state will reveal a lot.

## Why the Signature Works

The signature is built here:

```javascript
let patternMatch = ''
for (let i = 0; i < wordLen; i++) {
  patternMatch += (word[i] === letter ? '1' : '0')
}
```

Interpretation:

- `1` means the guessed letter appears at that position
- `0` means it does not

This captures more information than a simple yes/no contains check. It preserves repeated-letter structure and exact positions.

## Entropy Calculation

Once buckets are built for a letter, entropy is computed:

```javascript
let entropy = 0
for (const count of Object.values(buckets)) {
  const p = count / candidateCount
  entropy -= p * Math.log2(p)
}
```

Formula:

```text
H = -sum(p * log2(p))
```

Meaning:

- High entropy means outcomes are spread across many reasonably balanced possibilities.
- Low entropy means most candidates collapse into one dominant outcome, so the guess reveals less.

## Worked Example

Suppose four candidates remain:

```text
STONE
STORE
SHORE
SCORE
```

Test letter: `T`

Buckets:

- `01000`: `STONE`, `STORE`
- `00000`: `SHORE`, `SCORE`

Distribution:

- `2 / 4`
- `2 / 4`

Entropy:

```text
H = -(0.5 * log2 0.5 + 0.5 * log2 0.5) = 1.0
```

Test letter: `C`

Buckets:

- `00000`: `STONE`, `STORE`, `SHORE`
- `01000`: `SCORE`

Distribution:

- `3 / 4`
- `1 / 4`

Entropy is lower than the `T` split, so `T` is the better information-gain guess.

## Special Cases in the Implementation

### Case 1: no candidates left

```javascript
if (candidateCount === 0) return FALLBACK.find(l => !guessedSet.has(l)) || 'E'
```

The AI uses the fallback frequency order.

### Case 2: exactly one candidate left

```javascript
if (candidateCount === 1) {
  for (const char of candidates[0]) {
    if (!guessedSet.has(char)) return char
  }
}
```

Once only one candidate remains, entropy search is unnecessary. The AI simply returns the next unguessed character from that word.

### Case 3: no possible letters remain

```javascript
if (possibleLetters.size === 0) return FALLBACK.find(l => !guessedSet.has(l)) || 'E'
```

This is a safety guard for degenerate states.

## Why Hard Mode Is Strong

Hard mode is strong because it optimizes for separation, not just popularity.

A common letter can still be a poor guess if it causes nearly all remaining words to produce the same feedback pattern. Entropy avoids that trap by rewarding letters that create informative splits.

## Practical Limitation

This implementation is strong, but the phrase "mathematically perfect" should be interpreted carefully.

What it is perfect at:

- Maximizing expected information gain for the next single letter guess under this bucket model

What it does not prove:

- Absolute global optimality over every future turn sequence
- Optimality against words outside the dictionary
- Optimality under alternative cost functions such as minimizing worst-case misses

That distinction matters if you are presenting the algorithm academically.
