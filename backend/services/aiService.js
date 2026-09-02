const fs = require('fs')
const path = require('path')

const RAW_WORDS_PATH = path.join(__dirname, '..', 'data', 'words_alpha.txt')
const DEFAULT_GAME_WORDS_PATH = path.join(__dirname, '..', 'data', 'words_game_curated.txt')
const DEFAULT_BLOCKLIST_PATH = path.join(__dirname, '..', 'data', 'word_blocklist.txt')
const LEARNING_PATH = path.join(__dirname, '..', 'data', 'ai_learning.json')
const AI_POOL_MODE = (process.env.AI_WORD_POOL || 'full').toLowerCase()
const MIN_GAME_WORD_LENGTH = 4
const MAX_GAME_WORD_LENGTH = 10
const GAME_DIFFICULTY_RANGES = {
  easy: [4, 5],
  medium: [6, 8],
  hard: [9, 10],
}

// ── Persistent Learning Store ─────────────────────────────────────────────────
// Tracks which letters the AI wasted on wrong guesses, keyed by word length.
// Penalties decay over time so old mistakes don't dominate forever.
// Format: { "4": { "E": 3.2, "T": 1.5 }, "6": { "Q": 2.0 } }
let learningStore = {}

function loadLearning() {
  try {
    if (fs.existsSync(LEARNING_PATH)) {
      learningStore = JSON.parse(fs.readFileSync(LEARNING_PATH, 'utf-8'))
    }
  } catch { learningStore = {} }
}

function saveLearning() {
  if (process.env.NODE_ENV === 'test') return
  try { fs.writeFileSync(LEARNING_PATH, JSON.stringify(learningStore, null, 2)) } catch {}
}

function __setLearningForTests(data) {
  learningStore = data
}

function __resetLearningForTests() {
  learningStore = {}
}


// Called after each LOSS to record which letters were wasted
function recordLoss(wordLength, wrongLetters) {
  const key = String(wordLength)
  if (!learningStore[key]) learningStore[key] = {}
  for (const letter of wrongLetters) {
    // Accumulate penalty; each loss adds 1.0, decayed by 0.9 on re-access
    learningStore[key][letter] = (learningStore[key][letter] || 0) + 1.0
  }
  // Decay ALL existing penalties by 5% so old data fades
  for (const l of Object.keys(learningStore[key])) {
    learningStore[key][l] *= 0.95
    if (learningStore[key][l] < 0.1) delete learningStore[key][l]
  }
  saveLearning()
}

// Returns a penalty multiplier for a letter given word length (1.0 = no penalty)
function getLearningPenalty(letter, wordLength) {
  const key = String(wordLength)
  const penalty = learningStore[key]?.[letter] || 0
  if (!penalty) return 1.0
  // Dynamic adaptation: 1 loss = 35% drop, 2 losses = 70% drop, 3+ losses = 95% drop (forces AI to pivot to alternative letters)
  return Math.max(1.0 - (penalty * 0.35), 0.05)
}

loadLearning()

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

  easyWords = gameplayWords.filter((w) => w.length >= 4 && w.length <= 5)
  mediumWords = gameplayWords.filter((w) => w.length >= 6 && w.length <= 7)
  hardWords = gameplayWords.filter((w) => w.length >= 8 && w.length <= 10)

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
  let pool
  switch (difficulty) {
    case 'easy':
      pool = easyWords
      break
    case 'medium':
      pool = mediumWords
      break
    case 'hard':
      pool = hardWords
      break
    default:
      pool = mediumWords
  }
  return pool && pool.length ? pool : (gameplayWords.length ? gameplayWords : rawWords)
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

function aiGuessEasy(candidates, guessedSet, fallbackLetters, wordLen) {
  // Easy: use global English letter frequency, ignore candidates.
  // This makes it feel casual — the AI doesn't "think hard".
  // Apply learning penalty to the frequency values to deprioritize consistently failed letters.
  const ENGLISH_FREQ = ['E','T','A','O','I','N','S','R','H','L','D','C','U','M','F','P','G','W','Y','B','V','K','X','J','Q','Z']
  
  let bestLetter = null
  let bestScore = -1
  
  for (let i = 0; i < ENGLISH_FREQ.length; i++) {
    const letter = ENGLISH_FREQ[i]
    if (guessedSet.has(letter)) continue
    
    const indexScore = 26 - i
    const score = indexScore * getLearningPenalty(letter, wordLen)
    if (score > bestScore) {
      bestScore = score
      bestLetter = letter
    }
  }
  
  return bestLetter || fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
}

// ── MEDIUM: candidate letter frequency + learning ────────────────────────────
function aiGuessMedium(candidates, patternChars, wordLen, guessedSet, fallbackLetters) {
  if (candidates.length === 0) {
    return fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
  }
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

  const n = candidates.length
  let bestLetter = null, bestScore = -1
  for (const [letter, count] of Object.entries(frequency)) {
    // Apply learning penalty — letters frequently wasted in past games score lower
    const score = (count / n) * getLearningPenalty(letter, wordLen)
    if (score > bestScore) { bestScore = score; bestLetter = letter }
  }

  return bestLetter || fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
}

// ── HARD: pure candidate frequency (optimal for hangman with limited lives) ──
// For each unguessed letter, count how many candidate words contain it.
// Pick the one with the highest count — this maximises the probability that
// the next guess is CORRECT, which is what matters when wrong guesses cost lives.
// Entropy is theoretically elegant but trades correct guesses for information gain,
// wasting lives on "splitter" letters that never appear in the actual word.
function aiGuessHard(candidates, wordLen, guessedSet, fallbackLetters) {
  const n = candidates.length
  if (n === 0) return fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
  if (n === 1) {
    for (const char of candidates[0]) {
      if (!guessedSet.has(char)) return char
    }
  }

  // Build letter frequency across all candidates
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

  if (Object.keys(freq).length === 0) {
    return fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
  }

  // Pick the letter with highest frequency, penalised by past losses
  let best = null, bestScore = -1
  for (const [letter, count] of Object.entries(freq)) {
    const score = (count / n) * getLearningPenalty(letter, wordLen)
    if (score > bestScore) { bestScore = score; best = letter }
  }

  return best || fallbackLetters.find(l => !guessedSet.has(l)) || 'E'
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
    const cacheTimer = setTimeout(() => datamuse_cache.delete(cacheKey), 5 * 60 * 1000)
    if (cacheTimer.unref) {
      cacheTimer.unref()
    }

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
    letter = aiGuessEasy(effectiveCandidates, guessedSet, fallbackLetters, wordLen)
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

  const { letter: chosenLetter, wordInDictionary } = await aiGuess(pattern, wrongLetters, guessedLetters, difficulty, mode)

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
  recordLoss,
  __setDictionaryForTests,
  __resetDictionaryForTests,
  __setLearningForTests,
  __resetLearningForTests,
  dictionaryMeta,
}
