const mongoose = require('mongoose')

const participantSchema = new mongoose.Schema(
  {
    socketId: { type: String, default: null },
    nickname: { type: String, required: true, trim: true },
    connected: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const chatMessageSchema = new mongoose.Schema(
  {
    senderRole: { type: String, enum: ['word-giver', 'guesser'], required: true },
    senderNickname: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const multiplayerRoomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    wordGiver: { type: participantSchema, required: true },
    guesser: { type: participantSchema, default: null },
    word: { type: String, default: null },
    maskedWord: { type: String, default: null },
    guesses: { type: [String], default: [] },
    wrongGuesses: { type: [String], default: [] },
    maxAttempts: { type: Number, default: 6 },
    status: {
      type: String,
      enum: ['waiting', 'word-entry', 'ongoing', 'won', 'lost', 'abandoned'],
      default: 'waiting',
    },
    chatMessages: { type: [chatMessageSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('MultiplayerRoom', multiplayerRoomSchema)
