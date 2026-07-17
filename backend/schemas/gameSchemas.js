const { z } = require('zod')

const StartGameSchema = z.object({
  mode: z.enum(['ai-vs-player', 'player-vs-ai', 'player-vs-player']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  word: z.string().max(20).optional(),
}).refine(
  (data) => {
    if (data.mode === 'player-vs-ai' || data.mode === 'player-vs-player') {
      return Boolean(data.word && data.word.trim().length > 0)
    }
    return true
  },
  {
    message: 'word is required for this mode',
    path: ['word'],
  }
).refine(
  (data) => {
    if (data.word) {
      return /^[a-zA-Z]+$/.test(data.word)
    }
    return true
  },
  {
    message: 'word must contain only letters',
    path: ['word'],
  }
)

const GuessSchema = z.object({
  gameId: z.string().min(1),
  letter: z.string().max(1).regex(/^[a-zA-Z]?$/).optional(),
})

const ExplainSchema = z.object({
  pattern: z.string().min(1),
  wrongLetters: z.array(z.string().length(1)).optional().default([]),
  guesses: z.array(z.string().length(1)).optional().default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  mode: z.enum(['ai-vs-player', 'player-vs-ai', 'player-vs-player']).optional().default('ai-vs-player'),
})

module.exports = {
  StartGameSchema,
  GuessSchema,
  ExplainSchema,
}
