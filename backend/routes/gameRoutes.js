const express = require('express')
const router  = express.Router()
const { startGame, makeGuess, getGame, getLeaderboard, explainGuess } = require('../controllers/gameController')
const { optionalAuth } = require('../middleware/authMiddleware')
const validate = require('../middleware/validate')
const { StartGameSchema, GuessSchema, ExplainSchema } = require('../schemas/gameSchemas')

router.post('/start',      optionalAuth, validate(StartGameSchema), startGame)
router.post('/guess',      validate(GuessSchema), makeGuess)
router.post('/explain',    validate(ExplainSchema), explainGuess)
router.get('/leaderboard', getLeaderboard)
router.get('/:id',         getGame)

module.exports = router
