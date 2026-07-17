# The Rookie: Frequency Engine (Easy Mode)

Easy mode is implemented by `aiGuessEasy(candidates, guessedSet, FALLBACK)`. It is intentionally simple and slightly noisy so it behaves more like a beginner than an optimizer.

In the current codebase, `candidates` has already been filtered from the active AI pool and narrowed by word length before easy mode begins scoring.

## Full Function

```javascript
function aiGuessEasy(candidates, guessedSet, FALLBACK) {
  if (candidates.length === 0) return FALLBACK.find(l => !guessedSet.has(l)) || 'E'

  const freq = {}
  for (const word of candidates) {
    const seen = new Set()
    for (const char of word) {
      if (!guessedSet.has(char) && !seen.has(char)) {
        freq[char] = (freq[char] || 0) + 1
        seen.add(char)
      }
    }
  }

  let bestLetter = null
  let maxFreq = -1
  for (const [letter, count] of Object.entries(freq)) {
    const score = count * (0.9 + Math.random() * 0.2)
    if (score > maxFreq) {
      maxFreq = score
      bestLetter = letter
    }
  }

  return bestLetter || FALLBACK.find(l => !guessedSet.has(l)) || 'E'
}
```

## What the Function Is Actually Measuring

This model does not count raw letter frequency inside words. It counts word presence.

Example candidate set:

```text
APPLE
ANGLE
AMBER
```

For the letter `A`:

- `APPLE` contributes `1`
- `ANGLE` contributes `1`
- `AMBER` contributes `1`

Total score base: `3`

For the letter `P`:

- `APPLE` contributes `1`, not `2`
- `ANGLE` contributes `0`
- `AMBER` contributes `0`

Total score base: `1`

That behavior comes from `seen`:

```javascript
const seen = new Set()
for (const char of word) {
  if (!guessedSet.has(char) && !seen.has(char)) {
    freq[char] = (freq[char] || 0) + 1
    seen.add(char)
  }
}
```

This is a deliberate design choice because repeated letters in a single word should not dominate the score.

## Why `guessedSet` Matters

The AI must never guess a letter twice. That is enforced here:

```javascript
if (!guessedSet.has(char) && !seen.has(char)) {
```

Effects:

- Already-guessed letters are ignored completely.
- Repeated letters within the same candidate are also ignored after the first occurrence.

## Why the Random Multiplier Exists

Without randomness, easy mode would always produce the same guess sequence for the same board state. That would make it predictable and too machine-like.

The score is:

```javascript
const score = count * (0.9 + Math.random() * 0.2)
```

Range:

- Minimum multiplier: `0.9`
- Maximum multiplier: `1.1`

This means:

- Strong letters still usually win
- Close competitors can occasionally overtake each other
- The AI feels weaker without becoming nonsensical

## Worked Example

Assume these candidates remain:

```text
STONE
STORE
STORM
```

Unguessed letter presence counts:

- `S`: 3
- `T`: 3
- `O`: 3
- `R`: 2
- `N`: 1
- `E`: 2
- `M`: 1

If the random multiplier is applied:

- `S` might score `3.18`
- `T` might score `2.88`
- `O` might score `3.05`

The model would pick `S` in that run, but another run might choose `O`.

## Strengths

- Very cheap to compute
- Naturally finds common letters early
- Easy to understand and debug
- Feels less robotic because of the jitter

## Weaknesses

- Does not model exact information gain
- Does not explicitly reason about letter positions
- Can waste turns on common letters that do not narrow the search space much

## When It Fails

Easy mode struggles when:

- Many candidates share the same common letters
- Rare but highly discriminative letters would be the better guess
- The remaining set contains unusual words not well separated by simple frequency counts
