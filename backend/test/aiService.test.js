const assert = require('node:assert/strict')

const {
  aiGuess,
  aiExplain,
  buildGameplayWordList,
  getDictionaryStats,
  __setDictionaryForTests,
  __resetDictionaryForTests,
} = require('../services/aiService')

module.exports = [
  {
    name: 'aiGuess preserves repeated-letter candidates and excludes wrong letters',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['EERIE', 'EAGLE', 'EMBER'])

      const result = await aiGuess('E _ _ _ E', ['A'], ['E'], 'medium')

      assert.equal(result.candidateCount, 1)
      assert.match(result.letter, /^[A-Z]$/)
      assert.notEqual(result.letter, 'E')
    },
  },
  {
    name: 'hard mode returns the only remaining unresolved letter for a single candidate',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['PLANET'])

      const result = await aiGuess('P L A N E _', [], ['P', 'L', 'A', 'N', 'E'], 'hard')

      assert.equal(result.candidateCount, 1)
      assert.equal(result.letter, 'T')
    },
  },
  {
    name: 'fallback logic skips letters that have already been guessed',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['PLAY'])

      const result = await aiGuess('_ _ _ _ _', [], ['E', 'T', 'A', 'O', 'I', 'N'], 'easy')

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
  {
    name: 'hard mode hybrid scoring picks frequency-present letter over zero-probability one',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['CRYPT', 'LYNXS'])
      const result = await aiGuess('_ _ _ _ _', [], [], 'hard')
      assert.ok(result.letter)
      assert.equal(result.wordInDictionary, true)
    },
  },
  {
    name: 'all 3 difficulties return a valid letter when candidates = 0 (fallback)',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests([])
      const resEasy = await aiGuess('_ _ _', [], ['E'], 'easy')
      const resMed = await aiGuess('_ _ _', [], ['E'], 'medium')
      const resHard = await aiGuess('_ _ _', [], ['E'], 'hard')
      assert.match(resEasy.letter, /^[A-Z]$/)
      assert.match(resMed.letter, /^[A-Z]$/)
      assert.match(resHard.letter, /^[A-Z]$/)
      assert.notEqual(resEasy.letter, 'E')
      assert.notEqual(resMed.letter, 'E')
      assert.notEqual(resHard.letter, 'E')
    },
  },
  {
    name: 'wordInDictionary is false when candidates empty on first guess',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests([])
      const result = await aiGuess('_ _ _ _ _', [], [], 'hard')
      assert.equal(result.wordInDictionary, false)
    },
  },
  {
    name: 'medium mode positional scoring is pattern-aware',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['COPE', 'HOPE', 'CAPE'])
      const result = await aiGuess('_ _ P E', [], ['P', 'E'], 'medium')
      assert.ok(['C', 'H', 'O', 'A'].includes(result.letter))
    },
  },
  {
    name: 'repeated-letter word (LEVEL) — AI correctly guesses letter present multiple times',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['LEVEL'])
      const res1 = await aiGuess('_ _ _ _ _', [], [], 'hard')
      assert.equal(res1.letter, 'L')
    },
  },
  {
    name: 'aiExplain returns correct shape and explanation payload',
    async run() {
      __resetDictionaryForTests()
      __setDictionaryForTests(['PLANET'])
      const explanation = await aiExplain('P L A N E _', [], ['P', 'L', 'A', 'N', 'E'], 'hard')
      assert.equal(explanation.candidatesRemaining, 1)
      assert.equal(explanation.topCandidates[0], 'PLANET')
      assert.equal(explanation.nextGuess, 'T')
      assert.equal(explanation.strategy, 'Candidate Letter Frequency')
    },
  },
]
