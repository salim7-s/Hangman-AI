const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
  mode:         { type: String, enum: ['player-vs-ai', 'ai-vs-player', 'player-vs-player'], required: true },
  word:         { type: String, required: true },
  maskedWord:   { type: String, required: true },
  guesses:      { type: [String], default: [] },
  wrongGuesses: { type: [String], default: [] },
  maxAttempts:  { type: Number, default: 6 },
  difficulty:   { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  status:       { type: String, enum: ['ongoing', 'won', 'lost'], default: 'ongoing' },
  winner:       { type: String, default: null },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt:    { type: Date, default: Date.now }
})

module.exports = mongoose.model('Game', gameSchema)
