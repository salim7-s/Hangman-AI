const express = require('express')
const router  = express.Router()
const { startGame, makeGuess, getGame, getLeaderboard } = require('../controllers/gameController')
const { optionalAuth } = require('../middleware/authMiddleware')

router.post('/start',      optionalAuth, startGame)
router.post('/guess',      makeGuess)
router.get('/leaderboard', getLeaderboard)
router.get('/:id',         getGame)

module.exports = router
