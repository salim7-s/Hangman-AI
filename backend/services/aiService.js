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
 * Basic AI (Rookie) - Uses raw letter frequency only.
 */
function aiGuessEasy(candidates, guessedSet, FALLBACK) {
  if (candidates.length === 0) return FALLBACK.find(l => !guessedSet.has(l)) || 'E'

  const freq = {}
  for (const word of candidates) {
    const seen = new Set()
    for (const char of word) {
      if (!guessedSet.has(char) && !seen.has(char)) {
        freq[char] = (freq[char] || 0) + 1
        seen.add(char) // Count word presence, not raw count
      }
    }
  }

  let bestLetter = null
  let maxFreq = -1
  for (const [letter, count] of Object.entries(freq)) {
    // Add a tiny bit of randomness to make the rookie occasionally pick suboptimal
    const score = count * (0.8 + Math.random() * 0.4) 
    if (score > maxFreq) {
      maxFreq = score
      bestLetter = letter
    }
  }

  return bestLetter || FALLBACK.find(l => !guessedSet.has(l)) || 'E'
}

/**
 * Medium AI (Detective) - Uses the heuristic scoring formula.
 */
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

    const withoutLetter  = candidates.filter(w => !w.includes(letter)).length
    const eliminationPower = withoutLetter / candidateCount

    const score = 0.5 * frequency + 0.3 * positionalProbability + 0.2 * eliminationPower

    if (score > bestScore) {
      bestScore  = score
      bestLetter = letter
    }
  }

  return bestLetter || FALLBACK.find(l => !guessedSet.has(l)) || 'E'
}

/**
 * Hard AI (Chief) - Uses mathematically perfect Shannon Entropy.
 */
function aiGuessHard(candidates, wordLen, guessedSet, FALLBACK) {
  const candidateCount = candidates.length
  if (candidateCount === 0) return FALLBACK.find(l => !guessedSet.has(l)) || 'E'

  // If only one word left, just guess its missing letters
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
    
    // Partition the candidates into buckets based on exact position matches
    for (const word of candidates) {
      let patternMatch = ''
      for (let i = 0; i < wordLen; i++) {
        patternMatch += (word[i] === letter ? '1' : '0')
      }
      buckets[patternMatch] = (buckets[patternMatch] || 0) + 1
    }

    // Calculate Shannon Entropy: H = -sum(p * log2(p))
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

  return bestLetter
}

/**
 * AI guess entry point
 * @param {string}   pattern        - e.g. "A _ _ _ E"
 * @param {string[]} wrongLetters   - letters guessed wrong
 * @param {string[]} guessedLetters - all letters guessed so far
 * @param {string}   difficulty     - 'easy', 'medium', 'hard'
 * @returns {{ letter: string, candidateCount: number }}
 */
function aiGuess(pattern, wrongLetters, guessedLetters, difficulty = 'medium') {
  const FALLBACK = ['E','T','A','O','I','N','S','R','H','L','D','C','U','P','F','M','W','Y','B','G','V','K','Q','J','X','Z']

  const patternChars = pattern.split(' ')
  const wordLen = patternChars.length
  const revealedLetters = new Set(patternChars.filter(ch => ch !== '_'))

  // Step 1: Filter dictionary identically for all difficulties
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
  const guessedSet = new Set(guessedLetters.map(l => l.toUpperCase()))

  let letter = 'E'
  
  if (difficulty === 'easy') {
    letter = aiGuessEasy(candidates, guessedSet, FALLBACK)
  } else if (difficulty === 'hard') {
    letter = aiGuessHard(candidates, wordLen, guessedSet, FALLBACK)
  } else {
    letter = aiGuessMedium(candidates, patternChars, wordLen, guessedSet, FALLBACK)
  }

  return { letter, candidateCount }
}

module.exports = { loadDictionary, getRandomWord, aiGuess }
