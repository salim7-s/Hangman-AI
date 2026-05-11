const fs   = require('fs')
const path = require('path')

let easyWords   = []
let mediumWords = []
let hardWords   = []
let allWords    = []

async function loadDictionary() {
  const filePath = path.join(__dirname, '..', '..', 'words_250000_train.txt')
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8')
    const words = raw
      .split('\n')
      .map(w => w.trim().toUpperCase())
      .filter(w => /^[A-Z]+$/.test(w))

    easyWords   = words.filter(w => w.length >= 4 && w.length <= 5)
    mediumWords = words.filter(w => w.length >= 6 && w.length <= 8)
    hardWords   = words.filter(w => w.length >= 9)
    allWords    = words

    console.log(
      `📖 Dictionary loaded: ${easyWords.length} easy, ` +
      `${mediumWords.length} medium, ${hardWords.length} hard`
    )
  } catch (err) {
    console.error('⚠️  Could not load dictionary:', err.message)
    // Fallback wordlists so the game still works without the file
    easyWords   = ['PLAY', 'GAME', 'WORD', 'FIND', 'CLUE', 'HINT', 'HANG', 'OPEN']
    mediumWords = ['PUZZLE', 'LETTER', 'GENIUS', 'RIDDLE', 'SOLVER']
    hardWords   = ['UNBELIEVABLE', 'MYSTERIOUS', 'SPECTACULAR']
    allWords    = [...easyWords, ...mediumWords, ...hardWords]
  }
}

function getWordsByDifficulty(difficulty) {
  switch (difficulty) {
    case 'easy':   return easyWords
    case 'medium': return mediumWords
    case 'hard':   return hardWords
    default:       return mediumWords
  }
}

function getRandomWord(difficulty) {
  const pool = getWordsByDifficulty(difficulty)
  if (!pool.length) return 'HANGMAN'
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * AI heuristic guess — matches PPT Slide 6 workflow
 * @param {string}   pattern        - e.g. "A _ _ _ E"
 * @param {string[]} wrongLetters   - letters guessed wrong
 * @param {string[]} guessedLetters - all letters guessed so far
 * @returns {{ letter: string, candidateCount: number }}
 */
function aiGuess(pattern, wrongLetters, guessedLetters) {
  const FALLBACK = ['E','T','A','O','I','N','S','R','H','L','D','C','U','P','F','M','W','Y','B','G','V','K','Q','J','X','Z']

  // Step 1: Parse pattern into positional array — "A _ _ _ E" → ["A","_","_","_","E"]
  const patternChars = pattern.split(' ')
  const wordLen = patternChars.length

  // Collect letters that are already revealed in the pattern
  const revealedLetters = new Set(patternChars.filter(ch => ch !== '_'))

  // Step 2: Filter dictionary — same length, match revealed positions,
  //         no wrong letters, blank positions must not contain revealed letters
  const candidates = allWords.filter(word => {
    if (word.length !== wordLen) return false
    for (let i = 0; i < wordLen; i++) {
      if (patternChars[i] !== '_') {
        if (word[i] !== patternChars[i]) return false
      } else {
        if (revealedLetters.has(word[i])) return false
      }
    }
    for (const wrong of wrongLetters) {
      if (word.includes(wrong)) return false
    }
    return true
  })

  const candidateCount = candidates.length

  // Step 3: Build guessed set
  const guessedSet = new Set(guessedLetters.map(l => l.toUpperCase()))

  // No candidates — fallback to frequency order
  if (candidateCount === 0) {
    const letter = FALLBACK.find(l => !guessedSet.has(l)) || 'E'
    return { letter, candidateCount: 0 }
  }

  // Step 4: Count letter frequency across candidates
  const freq           = {}
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

  // Step 5: Score = 0.5 * frequency + 0.3 * positionalProbability + 0.2 * eliminationPower
  const totalCandidates = candidateCount
  let bestLetter = null
  let bestScore  = -1

  for (const [letter, f] of Object.entries(freq)) {
    if (guessedSet.has(letter)) continue

    const frequency = f / totalCandidates

    let positionalSum = 0
    let blankCount    = 0
    for (let i = 0; i < wordLen; i++) {
      if (patternChars[i] === '_') {
        positionalSum += (positionalFreq[i][letter] || 0) / totalCandidates
        blankCount++
      }
    }
    const positionalProbability = blankCount > 0 ? positionalSum / blankCount : 0

    const withoutLetter  = candidates.filter(w => !w.includes(letter)).length
    const eliminationPower = withoutLetter / totalCandidates

    const score = 0.5 * frequency + 0.3 * positionalProbability + 0.2 * eliminationPower

    if (score > bestScore) {
      bestScore  = score
      bestLetter = letter
    }
  }

  if (!bestLetter) {
    const letter = FALLBACK.find(l => !guessedSet.has(l)) || 'E'
    return { letter, candidateCount }
  }

  return { letter: bestLetter, candidateCount }
}

module.exports = { loadDictionary, getRandomWord, aiGuess }
