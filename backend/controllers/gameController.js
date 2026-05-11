const mongoose = require('mongoose')
const { getRandomWord, aiGuess } = require('../services/aiService')

// ─── In-memory fallback (used when no MONGO_URI) ──────────────────────────
const memGames = {}
let GameModel = null

function isMongoConnected() {
  return mongoose.connection.readyState === 1
}

function getGameModel() {
  if (!GameModel && isMongoConnected()) {
    GameModel = require('../models/Game')
  }
  return GameModel
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function buildMaskedWord(word, guesses) {
  return word.split('').map(ch => (guesses.includes(ch) ? ch : '_')).join(' ')
}

// ─── POST /api/game/start ─────────────────────────────────────────────────
async function startGame(req, res) {
  try {
    const { mode, difficulty = 'easy', word: providedWord } = req.body
    if (!mode) return res.status(400).json({ error: 'mode is required' })

    let word
    if (mode === 'ai-vs-player') {
      word = getRandomWord(difficulty).toUpperCase()
    } else {
      if (!providedWord?.trim())
        return res.status(400).json({ error: 'word is required for this mode' })
      word = providedWord.trim().toUpperCase()
      if (!/^[A-Z]+$/.test(word))
        return res.status(400).json({ error: 'word must contain only letters' })
    }

    const maskedWord = buildMaskedWord(word, [])
    const Game = getGameModel()

    if (Game) {
      const game = await Game.create({
        mode, difficulty, word, maskedWord,
        userId: req.user?._id || null
      })
      return res.status(201).json({ gameId: game._id, maskedWord, attemptsLeft: 6, mode, difficulty })
    }

    // In-memory fallback
    const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2)}`
    memGames[gameId] = { gameId, mode, difficulty, word, maskedWord, guesses: [], wrongGuesses: [], maxAttempts: 6, status: 'ongoing', winner: null }
    return res.status(201).json({ gameId, maskedWord, attemptsLeft: 6, mode, difficulty })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to start game' })
  }
}

// ─── POST /api/game/guess ─────────────────────────────────────────────────
async function makeGuess(req, res) {
  try {
    const { gameId, letter } = req.body
    if (!gameId || !letter)
      return res.status(400).json({ error: 'gameId and letter are required' })

    const Game = getGameModel()
    let game

    if (Game) {
      game = await Game.findById(gameId)
    } else {
      game = memGames[gameId]
    }

    if (!game) return res.status(404).json({ error: 'Game not found' })
    if (game.status !== 'ongoing') return res.status(400).json({ error: 'Game is already over' })

    const L = letter.toUpperCase()
    if (game.guesses.includes(L)) return res.status(400).json({ error: 'Letter already guessed' })

    game.guesses.push(L)
    let aiGuessResult = null

    if (game.word.includes(L)) {
      game.maskedWord = buildMaskedWord(game.word, game.guesses)
    } else {
      game.wrongGuesses.push(L)
    }

    // ai-vs-player: player is guessing, winning = player, losing = ai
    if (game.mode === 'ai-vs-player') {
      if (!game.maskedWord.includes('_')) {
        game.status = 'won'; game.winner = 'player'
      } else if (game.wrongGuesses.length >= game.maxAttempts) {
        game.status = 'lost'; game.winner = 'ai'
      }
    }

    // player-vs-player: player guessing a human-set word
    if (game.mode === 'player-vs-player') {
      if (!game.maskedWord.includes('_')) {
        game.status = 'won'; game.winner = 'player'
      } else if (game.wrongGuesses.length >= game.maxAttempts) {
        game.status = 'lost'; game.winner = 'ai'
      }
    }

    // player-vs-ai: human set the word, AI is guessing
    if (game.mode === 'player-vs-ai' && game.status === 'ongoing') {
      const { letter: aiLetter, candidateCount } = aiGuess(game.maskedWord, game.wrongGuesses, game.guesses)
      aiGuessResult = { letter: aiLetter, candidateCount }
      game.guesses.push(aiLetter)

      if (game.word.includes(aiLetter)) {
        game.maskedWord = buildMaskedWord(game.word, game.guesses)
        // AI solved the word → AI wins
        if (!game.maskedWord.includes('_')) { game.status = 'won'; game.winner = 'ai' }
      } else {
        game.wrongGuesses.push(aiLetter)
        // AI ran out of attempts → player wins
        if (game.wrongGuesses.length >= game.maxAttempts) { game.status = 'lost'; game.winner = 'player' }
      }
    }

    if (Game) {
      await game.save()
      // Update user stats on game end
      if (game.userId && game.status !== 'ongoing') {
        const User = require('../models/User')
        const inc = { gamesPlayed: 1, [game.status === 'won' ? 'wins' : 'losses']: 1 }
        await User.findByIdAndUpdate(game.userId, { $inc: inc })
      }
    }

    const attemptsLeft = game.maxAttempts - game.wrongGuesses.length
    const response = {
      maskedWord: game.maskedWord, wrongGuesses: game.wrongGuesses,
      guesses: game.guesses, attemptsLeft, status: game.status, winner: game.winner
    }
    if (game.status !== 'ongoing') response.word = game.word
    if (aiGuessResult) { response.aiGuess = aiGuessResult.letter; response.candidateCount = aiGuessResult.candidateCount }

    return res.status(200).json(response)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to process guess' })
  }
}

// ─── GET /api/game/:id ────────────────────────────────────────────────────
async function getGame(req, res) {
  try {
    const Game = getGameModel()
    let game

    if (Game) {
      game = await Game.findById(req.params.id)
      if (!game) return res.status(404).json({ error: 'Game not found' })
      const obj = game.toObject()
      if (game.status === 'ongoing') delete obj.word
      return res.status(200).json(obj)
    }

    game = memGames[req.params.id]
    if (!game) return res.status(404).json({ error: 'Game not found' })
    const { word, ...safe } = game
    if (game.status !== 'ongoing') safe.word = word
    return res.status(200).json(safe)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch game' })
  }
}

// ─── GET /api/game/leaderboard ────────────────────────────────────────────
async function getLeaderboard(req, res) {
  try {
    const Game = getGameModel()
    if (!Game) return res.status(200).json([])

    const User = require('../models/User')
    const users = await User.find({ gamesPlayed: { $gt: 0 } })
      .sort({ wins: -1 }).limit(10).select('username wins gamesPlayed')

    return res.status(200).json(users.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      wins: u.wins,
      gamesPlayed: u.gamesPlayed,
      winPercent: ((u.wins / u.gamesPlayed) * 100).toFixed(1)
    })))
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
}

module.exports = { startGame, makeGuess, getGame, getLeaderboard }
