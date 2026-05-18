const {
  loadDictionary,
  getWordsByDifficulty,
  getDictionaryStats,
  aiGuess,
} = require('../services/aiService')

const SAMPLE_SIZE = Number.parseInt(process.env.SAMPLE_SIZE || '25', 10)
const MAX_ATTEMPTS = 6
const DIFFICULTIES = ['easy', 'medium', 'hard']

function buildMaskedWord(word, guesses) {
  return word
    .split('')
    .map((char) => (guesses.includes(char) ? char : '_'))
    .join(' ')
}

function sampleWords(words, size) {
  if (words.length <= size) return [...words]

  const step = words.length / size
  const sample = []

  for (let index = 0; index < size; index++) {
    sample.push(words[Math.floor(index * step)])
  }

  return sample
}

function runSimulation(word, difficulty) {
  const guesses = []
  const wrongGuesses = []
  const startedAt = process.hrtime.bigint()
  let turns = 0
  let maskedWord = buildMaskedWord(word, guesses)

  while (wrongGuesses.length < MAX_ATTEMPTS && maskedWord.includes('_')) {
    const { letter } = aiGuess(maskedWord, wrongGuesses, guesses, difficulty)

    if (guesses.includes(letter)) {
      break
    }

    guesses.push(letter)
    turns++

    if (word.includes(letter)) {
      maskedWord = buildMaskedWord(word, guesses)
    } else {
      wrongGuesses.push(letter)
    }
  }

  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6

  return {
    won: !maskedWord.includes('_'),
    turns,
    wrongGuesses: wrongGuesses.length,
    elapsedMs,
  }
}

function summarize(results) {
  const totals = results.reduce(
    (accumulator, result) => {
      accumulator.games += 1
      accumulator.wins += result.won ? 1 : 0
      accumulator.turns += result.turns
      accumulator.wrongGuesses += result.wrongGuesses
      accumulator.elapsedMs += result.elapsedMs
      return accumulator
    },
    { games: 0, wins: 0, turns: 0, wrongGuesses: 0, elapsedMs: 0 }
  )

  return {
    games: totals.games,
    winRate: ((totals.wins / totals.games) * 100).toFixed(1),
    averageTurns: (totals.turns / totals.games).toFixed(2),
    averageWrongGuesses: (totals.wrongGuesses / totals.games).toFixed(2),
    averageLatencyMs: (totals.elapsedMs / totals.games).toFixed(2),
  }
}

async function main() {
  await loadDictionary()

  console.log('AI benchmark configuration')
  console.log(JSON.stringify({
    sampleSizePerDifficulty: SAMPLE_SIZE,
    maxAttempts: MAX_ATTEMPTS,
    dictionary: getDictionaryStats(),
  }, null, 2))

  for (const difficulty of DIFFICULTIES) {
    const words = getWordsByDifficulty(difficulty)
    const sample = sampleWords(words, SAMPLE_SIZE)
    const results = sample.map((word) => runSimulation(word, difficulty))
    const summary = summarize(results)

    console.log(`\n${difficulty.toUpperCase()}`)
    console.log(JSON.stringify(summary, null, 2))
  }
}

main().catch((error) => {
  console.error('AI benchmark failed:', error)
  process.exitCode = 1
})
