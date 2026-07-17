const fs = require('fs')
const path = require('path')

const RAW_WORDS_PATH = path.join(__dirname, '..', 'data', 'words_alpha.txt')
const DEFAULT_GAME_WORDS_PATH = path.join(__dirname, '..', 'data', 'words_game_curated.txt')
const DEFAULT_BLOCKLIST_PATH = path.join(__dirname, '..', 'data', 'word_blocklist.txt')
const AI_POOL_MODE = (process.env.AI_WORD_POOL || 'full').toLowerCase()
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

function evaluateWordDifficulty(word) {
  const commonLetters = new Set(['E', 'T', 'A', 'O', 'I', 'N', 'S', 'R', 'H'])
  let commonCount = 0
  for (const char of word) {
    if (commonLetters.has(char)) commonCount++
  }
  const commonRatio = commonCount / word.length
  const uniqueCount = new Set(word).size
  
  // Heuristic difficulty score (higher score = easier to guess)
  const score = uniqueCount * 0.4 + commonRatio * 3.0 + word.length * 0.3
  return score
}

function setGameplayWords(words, source) {
  gameplayWords = words
  gameplayWordsByLength = indexWordsByLength(words)

  const sortedWords = gameplayWords
    .map((word) => ({ word, score: evaluateWordDifficulty(word) }))
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.word)

  const total = sortedWords.length
  const hardCut = Math.floor(total * 0.33)
  const mediumCut = Math.floor(total * 0.67)

  hardWords = sortedWords.slice(0, hardCut)
  mediumWords = sortedWords.slice(hardCut, mediumCut)
  easyWords = sortedWords.slice(mediumCut)

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
  // Easy: use global English letter frequency, ignore candidates.
  // This makes it feel casual — the AI doesn't "think hard".
  const ENGLISH_FREQ = ['E','T','A','O','I','N','S','R','H','L','D','C','U','M','F','P','G','W','Y','B','V','K','X','J','Q','Z']
  return ENGLISH_FREQ.find(l => !guessedSet.has(l)) || fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
}

// ── MEDIUM: candidate letter frequency ───────────────────────────────────────
// The industry-standard approach. For each unguessed letter, count how many
// candidate words contain it. Pick the letter appearing in the most words.
// This is statistically optimal for maximising the probability of a correct guess.
function aiGuessMedium(candidates, patternChars, wordLen, guessedSet, fallbackLetters) {
  if (candidates.length === 0) {
    return fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
  }

  // If only 1 candidate left, spell it out
  if (candidates.length === 1) {
    for (const char of candidates[0]) {
      if (!guessedSet.has(char)) return char
    }
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
  let bestScore  = -1
  for (const [letter, count] of Object.entries(frequency)) {
    if (count > bestScore) { bestScore = count; bestLetter = letter }
  }

  return bestLetter || fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
}

// ── HARD: entropy-based scoring ──────────────────────────────────────────────
// Picks the letter that best SPLITS the candidate pool.
// Entropy = -p*log2(p) - (1-p)*log2(1-p), maximised at p=0.5.
// A letter in exactly 50% of candidates gives maximum information per guess.
// When the candidate pool is very small (≤ 3), switches back to pure frequency
// to just directly guess the answer rather than splitting further.
function aiGuessHard(candidates, wordLen, guessedSet, fallbackLetters) {
  const n = candidates.length
  if (n === 0) return fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
  if (n === 1) {
    for (const char of candidates[0]) {
      if (!guessedSet.has(char)) return char
    }
  }

  // Count how many candidates contain each letter
  const hitCount = {}
  for (const word of candidates) {
    const seen = new Set()
    for (const char of word) {
      if (!guessedSet.has(char) && !seen.has(char)) {
        hitCount[char] = (hitCount[char] || 0) + 1
        seen.add(char)
      }
    }
  }

  if (Object.keys(hitCount).length === 0) {
    return fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
  }

  let bestLetter = null
  let bestScore  = -1

  for (const [letter, hits] of Object.entries(hitCount)) {
    const p = hits / n

    let score
    if (n <= 3) {
      // Small pool: just pick most common letter to directly guess the word
      score = p
    } else {
      // Entropy: maximised at p=0.5, rewards letters that split pool evenly
      const entropy = p < 1 ? (-p * Math.log2(p) - (1 - p) * Math.log2(1 - p)) : 0
      // Blend: 70% entropy (information gain) + 30% frequency (correctness probability)
      score = 0.7 * entropy + 0.3 * p
    }

    if (score > bestScore) { bestScore = score; bestLetter = letter }
  }

  return bestLetter || fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
}


const datamuse_cache = new Map()

async function fetchDatamuseCandidates(patternChars, wrongLetters) {
  const sp = patternChars.map((ch) => ch === '_' ? '?' : ch.toLowerCase()).join('')
  const cacheKey = `${sp}|${wrongLetters.slice().sort().join('')}`

  if (datamuse_cache.has(cacheKey)) return datamuse_cache.get(cacheKey)

  try {
    const keyParam = process.env.DATAMUSE_API_KEY
      ? `&key=${process.env.DATAMUSE_API_KEY}`
      : ''
    const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(sp)}&max=500${keyParam}`
    
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) return []

    const data = await res.json()
    const wrongSet = new Set(wrongLetters.map((l) => l.toUpperCase()))

    const candidates = data
      .map((entry) => entry.word.toUpperCase().replace(/\s+/g, ''))
      .filter((word) =>
        word.length === patternChars.length &&
        /^[A-Z]+$/.test(word) &&
        ![...wrongSet].some((bad) => word.includes(bad))
      )

    datamuse_cache.set(cacheKey, candidates)
    setTimeout(() => datamuse_cache.delete(cacheKey), 5 * 60 * 1000)

    return candidates
  } catch (err) {
    console.error('Datamuse API error:', err.message)
    return []
  }
}

async function aiGuess(pattern, wrongLetters, guessedLetters, difficulty = 'medium', mode = 'ai-vs-player') {
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
  
  const poolMode = mode === 'player-vs-ai' ? 'full' : 'game'
  const activeWordsByLength = poolMode === 'full' ? rawWordsByLength : gameplayWordsByLength
  const sourceWords = activeWordsByLength.get(wordLen) || []

  let candidates = sourceWords.filter((word) => {
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

  let effectiveCandidates = candidates
  let usedExternalApi = false

  // In player-vs-ai (Reverse) mode, run local filter + Datamuse API in parallel
  // so we cover slang, names, and brand words the player may have typed.
  // In ai-vs-player (Solo) mode, the curated gameplay pool is sufficient — skip the API.
  if (mode === 'player-vs-ai' && !dictionaryMeta.gameplaySource.startsWith('test')) {
    const externalPromise = fetchDatamuseCandidates(patternChars, wrongLetters)

    // Both results are now ready — local was already computed above
    const external = await externalPromise
    if (external.length > 0) {
      const merged = new Set([...candidates, ...external])
      effectiveCandidates = [...merged]
      usedExternalApi = true
    }
  }

  const candidateCount = effectiveCandidates.length
  const guessedSet = new Set(guessedLetters.map((letter) => letter.toUpperCase()))
  const isFirstGuess = guessedLetters.length === 0 && wrongLetters.length === 0
  const wordInDictionary = candidates.length > 0 || !isFirstGuess

  let letter = 'E'

  if (difficulty === 'easy') {
    letter = aiGuessEasy(effectiveCandidates, guessedSet, fallbackLetters)
  } else if (difficulty === 'hard') {
    letter = aiGuessHard(effectiveCandidates, wordLen, guessedSet, fallbackLetters)
  } else {
    letter = aiGuessMedium(effectiveCandidates, patternChars, wordLen, guessedSet, fallbackLetters)
  }

  return { letter, candidateCount, wordInDictionary, usedExternalApi }
}

async function aiExplain(pattern, wrongLetters, guessedLetters, difficulty = 'medium', mode = 'ai-vs-player') {
  if (!Array.isArray(wrongLetters)) {
    wrongLetters = wrongLetters ? [...wrongLetters] : []
  }
  if (!Array.isArray(guessedLetters)) {
    guessedLetters = guessedLetters ? [...guessedLetters] : []
  }

  const patternChars = pattern.split(' ')
  const wordLen = patternChars.length
  
  const poolMode = mode === 'player-vs-ai' ? 'full' : 'game'
  const activeWordsByLength = poolMode === 'full' ? rawWordsByLength : gameplayWordsByLength
  const sourceWords = activeWordsByLength.get(wordLen) || []

  let candidates = sourceWords.filter((word) => {
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

  let effectiveCandidates = candidates
  let usedExternalApi = false

  if (!dictionaryMeta.gameplaySource.startsWith('test')) {
    const external = await fetchDatamuseCandidates(patternChars, wrongLetters)
    if (external.length > 0) {
      const merged = new Set([...candidates, ...external])
      effectiveCandidates = [...merged]
      usedExternalApi = true
    }
  }

  const candidateCount = effectiveCandidates.length
  const guessedSet = new Set(guessedLetters.map((letter) => letter.toUpperCase()))

  const topCandidates = effectiveCandidates.slice(0, 5)

  const possibleLetters = new Set()
  for (const word of effectiveCandidates) {
    for (const char of word) {
      if (!guessedSet.has(char)) {
        possibleLetters.add(char)
      }
    }
  }

  const letterScores = {}
  
  if (difficulty === 'hard') {
    for (const letter of possibleLetters) {
      const count = effectiveCandidates.filter((w) => w.includes(letter)).length
      letterScores[letter] = Number((count / candidateCount).toFixed(3))
    }
  } else if (difficulty === 'easy') {
    for (const letter of possibleLetters) {
      const count = effectiveCandidates.filter((w) => w.includes(letter)).length
      letterScores[letter] = Number((count / candidateCount).toFixed(3))
    }
  } else {
    for (const letter of possibleLetters) {
      const count = effectiveCandidates.filter((w) => w.includes(letter)).length
      const normalizedFrequency = count / candidateCount
      letterScores[letter] = Number(normalizedFrequency.toFixed(3))
    }
  }

  const { letter: chosenLetter, wordInDictionary } = await aiGuess(pattern, wrongLetters, guessedLetters, difficulty)

  let strategy = 'Letter frequency'
  if (difficulty === 'hard') {
    strategy = 'Candidate Letter Frequency'
  } else if (difficulty === 'easy') {
    strategy = 'Randomized Frequency'
  }

  return {
    candidatesRemaining: candidateCount,
    topCandidates,
    letterScores,
    nextGuess: chosenLetter,
    strategy,
    wordInDictionary,
    usedExternalApi,
  }
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
  aiExplain,
  __setDictionaryForTests,
  __resetDictionaryForTests,
  dictionaryMeta,
}
