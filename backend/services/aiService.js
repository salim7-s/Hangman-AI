const fs = require('fs')
const path = require('path')

const RAW_WORDS_PATH = path.join(__dirname, '..', '..', 'words_250000_train.txt')
const DEFAULT_GAME_WORDS_PATH = path.join(__dirname, '..', 'data', 'words_game_curated.txt')
const DEFAULT_BLOCKLIST_PATH = path.join(__dirname, '..', 'data', 'word_blocklist.txt')
const AI_POOL_MODE = (process.env.AI_WORD_POOL || 'game').toLowerCase()
const MIN_GAME_WORD_LENGTH = 4
const MAX_GAME_WORD_LENGTH = 10
const GAME_DIFFICULTY_RANGES = {
  easy: [4, 5],
  medium: [6, 8],
  hard: [9, 10],
}

let rawWords = []
let gameplayWords = []
let easyWords = []
let mediumWords = []
let hardWords = []
let aiPoolWords = []
let rawWordsByLength = new Map()
let gameplayWordsByLength = new Map()
let aiWordsByLength = new Map()
let dictionaryMeta = {
  aiPoolMode: AI_POOL_MODE,
  blocklistSize: 0,
  gameplaySource: 'generated',
}

function normalizeWords(words) {
  return words
    .map((word) => word.trim().toUpperCase())
    .filter((word) => /^[A-Z]+$/.test(word))
}

function indexWordsByLength(words) {
  const index = new Map()

  for (const word of words) {
    const bucket = index.get(word.length) || []
    bucket.push(word)
    index.set(word.length, bucket)
  }

  return index
}

async function readWordList(filePath) {
  const raw = await fs.promises.readFile(filePath, 'utf-8')
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  return normalizeWords(lines)
}

async function readOptionalWordList(filePath) {
  try {
    return await readWordList(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function countDistinctLetters(word) {
  return new Set(word).size
}

function hasPlayableShape(word) {
  return (
    word.length >= MIN_GAME_WORD_LENGTH &&
    word.length <= MAX_GAME_WORD_LENGTH &&
    /[AEIOUY]/.test(word) &&
    countDistinctLetters(word) >= 3 &&
    !/(.)\1\1/.test(word)
  )
}

function buildGameplayWordList(sourceWords, blockedWords = new Set()) {
  return sourceWords.filter((word) => hasPlayableShape(word) && !blockedWords.has(word))
}

function setRawWords(words) {
  rawWords = words
  rawWordsByLength = indexWordsByLength(words)
}

function setGameplayWords(words, source) {
  gameplayWords = words
  gameplayWordsByLength = indexWordsByLength(words)
  easyWords = gameplayWords.filter((word) => {
    const [min, max] = GAME_DIFFICULTY_RANGES.easy
    return word.length >= min && word.length <= max
  })
  mediumWords = gameplayWords.filter((word) => {
    const [min, max] = GAME_DIFFICULTY_RANGES.medium
    return word.length >= min && word.length <= max
  })
  hardWords = gameplayWords.filter((word) => {
    const [min, max] = GAME_DIFFICULTY_RANGES.hard
    return word.length >= min && word.length <= max
  })
  dictionaryMeta.gameplaySource = source
}

function setAiPool(mode) {
  if (mode === 'full') {
    aiPoolWords = rawWords
    aiWordsByLength = rawWordsByLength
  } else {
    aiPoolWords = gameplayWords
    aiWordsByLength = gameplayWordsByLength
  }
  dictionaryMeta.aiPoolMode = mode
}

function applyDictionaryState({
  raw,
  gameplay,
  gameplaySource,
  blocklistSize = 0,
  aiPoolMode = AI_POOL_MODE,
}) {
  setRawWords(raw)
  setGameplayWords(gameplay, gameplaySource)
  dictionaryMeta.blocklistSize = blocklistSize
  setAiPool(aiPoolMode)
}

async function loadDictionary() {
  try {
    const configuredGameplayPath = process.env.GAME_WORDS_PATH
      ? path.resolve(process.cwd(), process.env.GAME_WORDS_PATH)
      : DEFAULT_GAME_WORDS_PATH
    const configuredBlocklistPath = process.env.GAME_WORD_BLOCKLIST_PATH
      ? path.resolve(process.cwd(), process.env.GAME_WORD_BLOCKLIST_PATH)
      : DEFAULT_BLOCKLIST_PATH

    const loadedRawWords = await readWordList(RAW_WORDS_PATH)
    const blockedWords = new Set(await readOptionalWordList(configuredBlocklistPath) || [])
    const curatedWords = await readOptionalWordList(configuredGameplayPath)
    const generatedGameplayWords = buildGameplayWordList(loadedRawWords, blockedWords)
    const selectedGameplayWords = curatedWords
      ? buildGameplayWordList(curatedWords, blockedWords)
      : generatedGameplayWords

    applyDictionaryState({
      raw: loadedRawWords,
      gameplay: selectedGameplayWords,
      gameplaySource: curatedWords ? 'curated-file' : 'generated-from-raw',
      blocklistSize: blockedWords.size,
    })

    console.log(
      `Dictionary loaded: raw=${rawWords.length}, gameplay=${gameplayWords.length}, ` +
      `easy=${easyWords.length}, medium=${mediumWords.length}, hard=${hardWords.length}, ` +
      `aiPool=${dictionaryMeta.aiPoolMode}`
    )
  } catch (err) {
    console.error('Could not load dictionary:', err.message)

    const fallbackRawWords = [
      'PLAY',
      'GAME',
      'WORD',
      'FIND',
      'CLUE',
      'HINT',
      'HANG',
      'OPEN',
      'PUZZLE',
      'LETTER',
      'GENIUS',
      'RIDDLE',
      'SOLVER',
      'MYSTERY',
      'CAPTAIN',
      'TREASURE',
    ]

    applyDictionaryState({
      raw: fallbackRawWords,
      gameplay: buildGameplayWordList(fallbackRawWords),
      gameplaySource: 'fallback',
      blocklistSize: 0,
      aiPoolMode: 'game',
    })
  }
}

function getWordsByDifficulty(difficulty) {
  switch (difficulty) {
    case 'easy':
      return easyWords
    case 'medium':
      return mediumWords
    case 'hard':
      return hardWords
    default:
      return mediumWords
  }
}

function getRandomWord(difficulty) {
  const pool = getWordsByDifficulty(difficulty)
  if (!pool.length) return 'HANGMAN'
  return pool[Math.floor(Math.random() * pool.length)]
}

function getDictionaryStats() {
  return {
    rawWords: rawWords.length,
    gameplayWords: gameplayWords.length,
    aiPoolWords: aiPoolWords.length,
    easyWords: easyWords.length,
    mediumWords: mediumWords.length,
    hardWords: hardWords.length,
    indexedLengths: aiWordsByLength.size,
    gameplaySource: dictionaryMeta.gameplaySource,
    aiPoolMode: dictionaryMeta.aiPoolMode,
    blocklistSize: dictionaryMeta.blocklistSize,
  }
}

function aiGuessEasy(candidates, guessedSet, fallbackLetters) {
  if (candidates.length === 0) {
    return fallbackLetters.find((letter) => !guessedSet.has(letter)) || 'E'
  }

  const frequency = {}

  for (const word of candidates) {
    const seen = new Set()
    for (const char of word) {
      if (!guessedSet.has(char) && !seen.has(char)) {
        frequency[char] = (frequency[char] || 0) + 1
        seen.add(char)
      }
    }
  }

  let bestLetter = null
  let bestScore = -1

  for (const [letter, count] of Object.entries(frequency)) {
    const score = count * (0.9 + Math.random() * 0.2)
    if (score > bestScore) {
      bestScore = score
      bestLetter = letter
    }
  }

  return bestLetter || fallbackLetters.find((letter) => !guessedSet.has(letter)) || 'E'
}

function aiGuessMedium(candidates, patternChars, wordLen, guessedSet, fallbackLetters) {
  const candidateCount = candidates.length
  if (candidateCount === 0) {
    return fallbackLetters.find((letter) => !guessedSet.has(letter)) || 'E'
  }

  const frequency = {}
  const positionalFrequency = Array.from({ length: wordLen }, () => ({}))

  for (const word of candidates) {
    const seen = new Set()

    for (let index = 0; index < word.length; index++) {
      const char = word[index]
      if (guessedSet.has(char)) continue

      if (!seen.has(char)) {
        frequency[char] = (frequency[char] || 0) + 1
        seen.add(char)
      }

      if (patternChars[index] === '_') {
        positionalFrequency[index][char] = (positionalFrequency[index][char] || 0) + 1
      }
    }
  }

  let bestLetter = null
  let bestScore = -1

  for (const [letter, count] of Object.entries(frequency)) {
    if (guessedSet.has(letter)) continue

    const normalizedFrequency = count / candidateCount
    const wordsContainingLetter = candidates.filter((word) => word.includes(letter)).length
    const eliminationPower = wordsContainingLetter / candidateCount

    let positionalSum = 0
    let blankCount = 0

    for (let index = 0; index < wordLen; index++) {
      if (patternChars[index] === '_') {
        positionalSum += (positionalFrequency[index][letter] || 0) / candidateCount
        blankCount++
      }
    }

    const positionalProbability = blankCount > 0 ? positionalSum / blankCount : 0
    const score =
      0.5 * normalizedFrequency +
      0.3 * positionalProbability +
      0.2 * eliminationPower

    if (score > bestScore) {
      bestScore = score
      bestLetter = letter
    }
  }

  return bestLetter || fallbackLetters.find((letter) => !guessedSet.has(letter)) || 'E'
}

function aiGuessHard(candidates, wordLen, guessedSet, fallbackLetters) {
  const candidateCount = candidates.length
  if (candidateCount === 0) {
    return fallbackLetters.find((letter) => !guessedSet.has(letter)) || 'E'
  }

  if (candidateCount === 1) {
    for (const char of candidates[0]) {
      if (!guessedSet.has(char)) return char
    }
  }

  const possibleLetters = new Set()
  for (const word of candidates) {
    for (const char of word) {
      if (!guessedSet.has(char)) {
        possibleLetters.add(char)
      }
    }
  }

  if (possibleLetters.size === 0) {
    return fallbackLetters.find((letter) => !guessedSet.has(letter)) || 'E'
  }

  let bestLetter = null
  let maxEntropy = -1

  for (const letter of possibleLetters) {
    const buckets = {}

    for (const word of candidates) {
      let patternMatch = ''
      for (let index = 0; index < wordLen; index++) {
        patternMatch += word[index] === letter ? '1' : '0'
      }
      buckets[patternMatch] = (buckets[patternMatch] || 0) + 1
    }

    let entropy = 0
    for (const count of Object.values(buckets)) {
      const probability = count / candidateCount
      entropy -= probability * Math.log2(probability)
    }

    if (entropy > maxEntropy) {
      maxEntropy = entropy
      bestLetter = letter
    }
  }

  return bestLetter || fallbackLetters.find((letter) => !guessedSet.has(letter)) || 'E'
}

function aiGuess(pattern, wrongLetters, guessedLetters, difficulty = 'medium') {
  const fallbackLetters = [
    'E', 'T', 'A', 'O', 'I', 'N', 'S', 'R', 'H', 'L', 'D', 'C', 'U',
    'P', 'F', 'M', 'W', 'Y', 'B', 'G', 'V', 'K', 'Q', 'J', 'X', 'Z',
  ]

  if (!Array.isArray(wrongLetters)) {
    wrongLetters = wrongLetters ? [...wrongLetters] : []
  }
  if (!Array.isArray(guessedLetters)) {
    guessedLetters = guessedLetters ? [...guessedLetters] : []
  }

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

  const candidateCount = candidates.length
  const guessedSet = new Set(guessedLetters.map((letter) => letter.toUpperCase()))

  let letter = 'E'

  if (difficulty === 'easy') {
    letter = aiGuessEasy(candidates, guessedSet, fallbackLetters)
  } else if (difficulty === 'hard') {
    letter = aiGuessHard(candidates, wordLen, guessedSet, fallbackLetters)
  } else {
    letter = aiGuessMedium(candidates, patternChars, wordLen, guessedSet, fallbackLetters)
  }

  return { letter, candidateCount }
}

function __setDictionaryForTests(words, options = {}) {
  const normalizedWords = normalizeWords(words)
  const blockedWords = new Set(normalizeWords(options.blocklist || []))
  const generatedGameplayWords = buildGameplayWordList(normalizedWords, blockedWords)

  applyDictionaryState({
    raw: normalizedWords,
    gameplay: options.gameplayWords
      ? buildGameplayWordList(normalizeWords(options.gameplayWords), blockedWords)
      : generatedGameplayWords,
    gameplaySource: options.gameplayWords ? 'test-curated' : 'test-generated',
    blocklistSize: blockedWords.size,
    aiPoolMode: options.aiPoolMode || 'game',
  })
}

function __resetDictionaryForTests() {
  applyDictionaryState({
    raw: [],
    gameplay: [],
    gameplaySource: 'test-reset',
    blocklistSize: 0,
    aiPoolMode: 'game',
  })
}

module.exports = {
  loadDictionary,
  getWordsByDifficulty,
  getRandomWord,
  getDictionaryStats,
  buildGameplayWordList,
  aiGuess,
  __setDictionaryForTests,
  __resetDictionaryForTests,
}
