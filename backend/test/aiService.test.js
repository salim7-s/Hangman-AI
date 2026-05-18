const assert = require('node:assert/strict')

const {
  aiGuess,
  buildGameplayWordList,
  getDictionaryStats,
  __setDictionaryForTests,
  __resetDictionaryForTests,
} = require('../services/aiService')

module.exports = [
  {
    name: 'aiGuess preserves repeated-letter candidates and excludes wrong letters',
    run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['EERIE', 'EAGLE', 'EMBER'])

      const result = aiGuess('E _ _ _ E', ['A'], ['E'], 'medium')

      assert.equal(result.candidateCount, 1)
      assert.match(result.letter, /^[A-Z]$/)
      assert.notEqual(result.letter, 'E')
    },
  },
  {
    name: 'hard mode returns the only remaining unresolved letter for a single candidate',
    run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['PLANET'])

      const result = aiGuess('P L A N E _', [], ['P', 'L', 'A', 'N', 'E'], 'hard')

      assert.equal(result.candidateCount, 1)
      assert.equal(result.letter, 'T')
    },
  },
  {
    name: 'fallback logic skips letters that have already been guessed',
    run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['PLAY'])

      const result = aiGuess('_ _ _ _ _', [], ['E', 'T', 'A', 'O', 'I', 'N'], 'easy')

      assert.notEqual(result.letter, 'E')
      assert.notEqual(result.letter, 'T')
    },
  },
  {
    name: 'dictionary stats reflect indexed buckets after injecting words',
    run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['PLAY', 'PUZZLE', 'MYSTERY'])

      const stats = getDictionaryStats()

      assert.equal(stats.rawWords, 3)
      assert.equal(stats.gameplayWords, 3)
      assert.equal(stats.easyWords, 1)
      assert.equal(stats.mediumWords, 2)
      assert.equal(stats.hardWords, 0)
      assert.equal(stats.indexedLengths, 3)
    },
  },
  {
    name: 'gameplay word builder filters noise and honors the blocklist',
    run() {
      const result = buildGameplayWordList(
        ['AAA', 'AACHEN', 'COOL', 'PUZZLE', 'HELLLO', 'MYSTERY'],
        new Set(['AACHEN', 'PUZZLE'])
      )

      assert.deepEqual(result, ['COOL', 'MYSTERY'])
    },
  },
]
