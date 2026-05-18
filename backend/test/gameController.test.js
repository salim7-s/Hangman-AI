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
]
