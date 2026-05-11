// backend/socket/gameSocket.js
// Room-based multiplayer: word-giver vs guesser, no accounts needed

const rooms = {} // { roomCode: { wordGiver, guesser, word, maskedWord, guesses, wrongGuesses, status } }

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function buildMasked(word, guesses) {
  return word.split('').map(ch => (guesses.includes(ch) ? ch : '_')).join(' ')
}

module.exports = function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    // ── Create Room ──────────────────────────────────────────────────
    socket.on('create-room', ({ nickname }) => {
      let code
      do { code = generateCode() } while (rooms[code])

      rooms[code] = {
        code,
        wordGiver:   { id: socket.id, nickname: nickname || 'Player 1' },
        guesser:     null,
        word:        null,
        maskedWord:  null,
        guesses:     [],
        wrongGuesses:[],
        maxAttempts: 6,
        status:      'waiting', // waiting | word-entry | ongoing | won | lost
      }

      socket.join(code)
      socket.emit('room-created', { code, role: 'word-giver' })
      console.log(`Room created: ${code} by ${nickname}`)
    })

    // ── Join Room ────────────────────────────────────────────────────
    socket.on('join-room', ({ code, nickname }) => {
      const room = rooms[code]
      if (!room) return socket.emit('error', { message: 'Room not found' })
      if (room.guesser) return socket.emit('error', { message: 'Room is full' })
      if (room.status !== 'waiting') return socket.emit('error', { message: 'Game already started' })

      room.guesser = { id: socket.id, nickname: nickname || 'Player 2' }
      room.status  = 'word-entry'
      socket.join(code)

      socket.emit('room-joined', { code, role: 'guesser', wordGiverNickname: room.wordGiver.nickname })
      io.to(room.wordGiver.id).emit('guesser-joined', { guesserNickname: room.guesser.nickname })
      io.to(code).emit('game-state', sanitize(room))
    })

    // ── Word Giver Submits Word ──────────────────────────────────────
    socket.on('submit-word', ({ code, word }) => {
      const room = rooms[code]
      if (!room) return socket.emit('error', { message: 'Room not found' })
      if (socket.id !== room.wordGiver.id) return socket.emit('error', { message: 'Only the word-giver can submit the word' })
      if (room.status !== 'word-entry') return socket.emit('error', { message: 'Not the right time to submit a word' })

      const clean = word.trim().toUpperCase()
      if (!/^[A-Z]+$/.test(clean) || clean.length < 2 || clean.length > 20)
        return socket.emit('error', { message: 'Word must be 2-20 letters only' })

      room.word      = clean
      room.maskedWord = buildMasked(clean, [])
      room.status    = 'ongoing'

      io.to(code).emit('game-started', { maskedWord: room.maskedWord, attemptsLeft: room.maxAttempts })
      io.to(code).emit('game-state', sanitize(room))
    })

    // ── Guesser Makes a Guess ────────────────────────────────────────
    socket.on('guess-letter', ({ code, letter }) => {
      const room = rooms[code]
      if (!room) return socket.emit('error', { message: 'Room not found' })
      if (socket.id !== room.guesser?.id) return socket.emit('error', { message: 'Only the guesser can guess letters' })
      if (room.status !== 'ongoing') return socket.emit('error', { message: 'Game is not active' })

      const L = letter.toUpperCase()
      if (!/^[A-Z]$/.test(L)) return socket.emit('error', { message: 'Invalid letter' })
      if (room.guesses.includes(L)) return socket.emit('error', { message: 'Already guessed' })

      room.guesses.push(L)

      if (room.word.includes(L)) {
        room.maskedWord = buildMasked(room.word, room.guesses)
      } else {
        room.wrongGuesses.push(L)
      }

      const attemptsLeft = room.maxAttempts - room.wrongGuesses.length

      if (!room.maskedWord.includes('_')) {
        room.status = 'won'
      } else if (attemptsLeft <= 0) {
        room.status = 'lost'
      }

      const state = sanitize(room)
      if (room.status !== 'ongoing') state.word = room.word

      io.to(code).emit('game-state', state)
    })

    // ── Rematch ──────────────────────────────────────────────────────
    socket.on('rematch', ({ code }) => {
      const room = rooms[code]
      if (!room) return

      // Swap roles
      const tmp        = room.wordGiver
      room.wordGiver   = room.guesser
      room.guesser     = tmp
      room.word        = null
      room.maskedWord  = null
      room.guesses     = []
      room.wrongGuesses= []
      room.status      = 'word-entry'

      io.to(code).emit('rematch-started', {
        wordGiverNickname: room.wordGiver.nickname,
        guesserNickname:   room.guesser.nickname
      })
      io.to(code).emit('game-state', sanitize(room))
    })

    // ── Disconnect ───────────────────────────────────────────────────
    socket.on('disconnect', () => {
      for (const [code, room] of Object.entries(rooms)) {
        const isWordGiver = room.wordGiver?.id === socket.id
        const isGuesser   = room.guesser?.id   === socket.id
        if (isWordGiver || isGuesser) {
          io.to(code).emit('player-left', {
            nickname: isWordGiver ? room.wordGiver.nickname : room.guesser.nickname
          })
          delete rooms[code]
          break
        }
      }
    })
  })
}

// Never expose word while game is ongoing
function sanitize(room) {
  return {
    code:         room.code,
    status:       room.status,
    maskedWord:   room.maskedWord,
    guesses:      room.guesses,
    wrongGuesses: room.wrongGuesses,
    attemptsLeft: room.maxAttempts - room.wrongGuesses.length,
    wordGiver:    room.wordGiver?.nickname,
    guesser:      room.guesser?.nickname,
  }
}
