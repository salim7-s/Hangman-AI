const assert = require('node:assert/strict')

const {
  startGame,
  makeGuess,
  __resetInMemoryGames,
} = require('../controllers/gameController')
const {
  __setDictionaryForTests,
  __resetDictionaryForTests,
} = require('../services/aiService')

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

module.exports = [
  {
    name: 'startGame rejects requests without a mode',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()

      const req = { body: {} }
      const res = createResponse()

      await startGame(req, res)

      assert.equal(res.statusCode, 400)
      assert.equal(res.body.error, 'mode is required')
    },
  },
  {
    name: 'ai-vs-player game starts with a masked word and six attempts',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()
      __setDictionaryForTests(['PLAY'])

      const req = { body: { mode: 'ai-vs-player', difficulty: 'easy' } }
      const res = createResponse()

      await startGame(req, res)

      assert.equal(res.statusCode, 201)
      assert.equal(res.body.maskedWord, '_ _ _ _')
      assert.equal(res.body.attemptsLeft, 6)
    },
  },
  {
    name: 'player guesses can finish a local game and reveal the word',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()

      const startReq = { body: { mode: 'player-vs-player', word: 'GO' } }
      const startRes = createResponse()
      await startGame(startReq, startRes)

      const gameId = startRes.body.gameId

      const guessOneRes = createResponse()
      await makeGuess({ body: { gameId, letter: 'G' } }, guessOneRes)
      assert.equal(guessOneRes.statusCode, 200)
      assert.equal(guessOneRes.body.status, 'ongoing')
      assert.equal(guessOneRes.body.maskedWord, 'G _')

      const guessTwoRes = createResponse()
      await makeGuess({ body: { gameId, letter: 'O' } }, guessTwoRes)

      assert.equal(guessTwoRes.statusCode, 200)
      assert.equal(guessTwoRes.body.status, 'won')
      assert.equal(guessTwoRes.body.word, 'GO')
      assert.equal(guessTwoRes.body.winner, 'player')
    },
  },
  {
    name: 'player-vs-ai mode returns ai guess metadata',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()
      __setDictionaryForTests(['LEVEL'])

      const startReq = {
        body: { mode: 'player-vs-ai', difficulty: 'hard', word: 'LEVEL' },
      }
      const startRes = createResponse()
      await startGame(startReq, startRes)

      const guessRes = createResponse()
      await makeGuess({ body: { gameId: startRes.body.gameId } }, guessRes)

      assert.equal(guessRes.statusCode, 200)
      assert.match(guessRes.body.aiGuess, /^[A-Z]$/)
      assert.equal(typeof guessRes.body.candidateCount, 'number')
      assert.ok(guessRes.body.guesses.length >= 1)
    },
  },
  {
    name: 'player-vs-ai returns wordInDictionary field in response',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()
      __setDictionaryForTests(['LEVEL'])

      const startReq = {
        body: { mode: 'player-vs-ai', difficulty: 'hard', word: 'LEVEL' },
      }
      const startRes = createResponse()
      await startGame(startReq, startRes)

      const guessRes = createResponse()
      await makeGuess({ body: { gameId: startRes.body.gameId } }, guessRes)

      assert.equal(guessRes.statusCode, 200)
      assert.equal(guessRes.body.wordInDictionary, true)
    },
  },
  {
    name: 'guessing same letter twice returns 400',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()

      const startReq = { body: { mode: 'player-vs-player', word: 'GO' } }
      const startRes = createResponse()
      await startGame(startReq, startRes)

      const gameId = startRes.body.gameId

      const guessOneRes = createResponse()
      await makeGuess({ body: { gameId, letter: 'G' } }, guessOneRes)
      assert.equal(guessOneRes.statusCode, 200)

      const guessTwoRes = createResponse()
      await makeGuess({ body: { gameId, letter: 'G' } }, guessTwoRes)
      assert.equal(guessTwoRes.statusCode, 400)
      assert.equal(guessTwoRes.body.error, 'Letter already guessed')
    },
  },
  {
    name: 'game over — guessing on a finished game returns 400',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()

      const startReq = { body: { mode: 'player-vs-player', word: 'GO' } }
      const startRes = createResponse()
      await startGame(startReq, startRes)

      const gameId = startRes.body.gameId

      await makeGuess({ body: { gameId, letter: 'G' } }, createResponse())
      await makeGuess({ body: { gameId, letter: 'O' } }, createResponse())

      const guessAfterOverRes = createResponse()
      await makeGuess({ body: { gameId, letter: 'X' } }, guessAfterOverRes)
      assert.equal(guessAfterOverRes.statusCode, 400)
      assert.equal(guessAfterOverRes.body.error, 'Game is already over')
    },
  },
  {
    name: 'in-memory game not found returns 404',
    async run() {
      __resetInMemoryGames()
      const guessRes = createResponse()
      await makeGuess({ body: { gameId: 'nonexistent-id', letter: 'A' } }, guessRes)
      assert.equal(guessRes.statusCode, 404)
      assert.equal(guessRes.body.error, 'Game not found')
    },
  },
  {
    name: 'ai-vs-player — losing after 6 wrong guesses flips status to lost',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()
      __setDictionaryForTests(['PLAY'])

      const startReq = { body: { mode: 'ai-vs-player', difficulty: 'easy' } }
      const startRes = createResponse()
      await startGame(startReq, startRes)

      const gameId = startRes.body.gameId
      const wrongLetters = ['X', 'Q', 'Z', 'W', 'V', 'U']

      let res
      for (const char of wrongLetters) {
        res = createResponse()
        await makeGuess({ body: { gameId, letter: char } }, res)
      }
      assert.equal(res.body.status, 'lost')
      assert.equal(res.body.attemptsLeft, 0)
    },
  },
  {
    name: 'ai-vs-player — winning reveals the word in response',
    async run() {
      __resetInMemoryGames()
      __resetDictionaryForTests()
      __setDictionaryForTests(['GAME'])

      const startReq = { body: { mode: 'ai-vs-player', difficulty: 'easy' } }
      const startRes = createResponse()
      await startGame(startReq, startRes)

      const gameId = startRes.body.gameId

      await makeGuess({ body: { gameId, letter: 'G' } }, createResponse())
      await makeGuess({ body: { gameId, letter: 'A' } }, createResponse())
      await makeGuess({ body: { gameId, letter: 'M' } }, createResponse())
      const finalRes = createResponse()
      await makeGuess({ body: { gameId, letter: 'E' } }, finalRes)

      assert.equal(finalRes.body.status, 'won')
      assert.equal(finalRes.body.word, 'GAME')
    },
  },
]
