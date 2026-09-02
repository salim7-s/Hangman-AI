// ── Trained character-level n-gram context model ────────────────────────────
// This is a real statistical language model, learned from your word corpus at
// load time — NOT a hand-set weight table. For every letter in every training
// word, we record what appeared immediately to its left/right (context window
// of size 1 and 2), using '#' as a start/end-of-word boundary marker.
//
// At inference, for each blank position we look up "given these known
// neighbors, what letter usually goes here?" — backing off from a 2-char
// window to 1-char to no-context (pure positional frequency) to global
// frequency, depending on how much context is actually known/available.
//
// This captures real English structure a flat frequency table can't:
// e.g. "Q" is predicted near-certainly when the left context is empty and
// right context starts with a vowel gap, "TH" / "ING" / "ED" clusters get
// learned automatically because they're just common substrings in the data.

function buildContextModel(words) {
  const model = { 2: new Map(), 1: new Map() }

  for (const word of words) {
    const len = word.length
    for (let i = 0; i < len; i++) {
      const letter = word[i]

      for (const order of [2, 1]) {
        let left = ''
        for (let k = order; k >= 1; k--) {
          const idx = i - k
          left += idx < 0 ? '#' : word[idx]
        }
        let right = ''
        for (let k = 1; k <= order; k++) {
          const idx = i + k
          right += idx >= len ? '#' : word[idx]
        }
        const key = `${left}|${right}`
        const bucket = model[order]
        if (!bucket.has(key)) bucket.set(key, new Map())
        const letterMap = bucket.get(key)
        letterMap.set(letter, (letterMap.get(letter) || 0) + 1)
      }
    }
  }

  return model
}

// Returns the left/right context strings of a given order around position i,
// using only ALREADY-REVEALED letters. Returns null if any needed neighbor
// is still a blank ('_') — in that case we can't trust this context window
// and the caller should back off to a smaller order.
function getContext(patternChars, i, order) {
  let left = ''
  for (let k = order; k >= 1; k--) {
    const idx = i - k
    if (idx < 0) { left += '#'; continue }
    if (patternChars[idx] === '_') return null
    left += patternChars[idx]
  }
  let right = ''
  for (let k = 1; k <= order; k++) {
    const idx = i + k
    if (idx >= patternChars.length) { right += '#'; continue }
    if (patternChars[idx] === '_') return null
    right += patternChars[idx]
  }
  return `${left}|${right}`
}

// Scores every unguessed letter for how likely it fills the *blank* positions
// of the current pattern, using the trained context model with backoff:
//   order-2 context -> order-1 context -> positional (order-0) -> global
function scoreNgram(contextModel, patternChars, guessedSet, positionalFallback, globalFallback) {
  const wordLen = patternChars.length
  const scores = {}
  let anyContextUsed = false

  for (let i = 0; i < wordLen; i++) {
    if (patternChars[i] !== '_') continue

    let letterCounts = null
    for (const order of [2, 1]) {
      const key = getContext(patternChars, i, order)
      if (key === null) continue
      const bucket = contextModel[order]?.get(key)
      if (bucket && bucket.size > 0) {
        letterCounts = bucket
        break
      }
    }

    if (!letterCounts) continue
    anyContextUsed = true

    const total = [...letterCounts.values()].reduce((a, b) => a + b, 0) || 1
    for (const [letter, count] of letterCounts.entries()) {
      if (guessedSet.has(letter)) continue
      scores[letter] = (scores[letter] || 0) + count / total
    }
  }

  if (!anyContextUsed || Object.keys(scores).length === 0) {
    const positional = positionalFallback(patternChars, guessedSet, wordLen)
    if (positional && Object.keys(positional).length > 0) return positional
    return globalFallback(guessedSet)
  }

  return scores
}

module.exports = { buildContextModel, scoreNgram, getContext }
