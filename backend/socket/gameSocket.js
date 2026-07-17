const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { randomUUID } = require('crypto')

const memRooms = {}
let RoomModel = null
let UserModel = null

function isMongoConnected() {
  return mongoose.connection.readyState === 1
}

function getRoomModel() {
  if (!RoomModel && isMongoConnected()) {
    RoomModel = require('../models/MultiplayerRoom')
  }
  return RoomModel
}

function getUserModel() {
  if (!UserModel && isMongoConnected()) {
    UserModel = require('../models/User')
  }
  return UserModel
}

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function buildMasked(word, guesses) {
  return word.split('').map((ch) => (guesses.includes(ch) ? ch : '_')).join(' ')
}

function toPlainRoom(room) {
  if (!room) return null
  return typeof room.toObject === 'function' ? room.toObject() : room
}

async function getRoomByCode(code) {
  const Room = getRoomModel()
  if (Room) return Room.findOne({ code })
  return memRooms[code] || null
}

async function createRoomRecord(roomData) {
  const Room = getRoomModel()
  if (Room) return Room.create(roomData)

  memRooms[roomData.code] = { ...roomData }
  return memRooms[roomData.code]
}

async function saveRoom(room) {
  const Room = getRoomModel()
  if (Room) return room.save()

  memRooms[room.code] = room
  return room
}

async function generateUniqueCode() {
  let code
  do {
    code = generateCode()
  } while (await getRoomByCode(code))
  return code
}

function getParticipantRole(room, socketId) {
  if (room.wordGiver?.socketId === socketId) return 'word-giver'
  if (room.guesser?.socketId === socketId) return 'guesser'
  return null
}

function getParticipantByRole(room, role) {
  return role === 'word-giver' ? room.wordGiver : room.guesser
}

function getActiveRoomCodeForSocket(socketId) {
  for (const room of Object.values(memRooms)) {
    if (room.wordGiver?.socketId === socketId || room.guesser?.socketId === socketId) {
      return room.code
    }
  }
  return null
}

function sanitize(room) {
  const plainRoom = toPlainRoom(room)

  return {
    code: plainRoom.code,
    status: plainRoom.status,
    maskedWord: plainRoom.maskedWord,
    guesses: plainRoom.guesses,
    wrongGuesses: plainRoom.wrongGuesses,
    attemptsLeft: plainRoom.maxAttempts - plainRoom.wrongGuesses.length,
    wordGiver: plainRoom.wordGiver?.nickname,
    guesser: plainRoom.guesser?.nickname || null,
    connections: {
      wordGiver: Boolean(plainRoom.wordGiver?.connected),
      guesser: Boolean(plainRoom.guesser?.connected),
    },
    chatMessages: (plainRoom.chatMessages || []).map((message) => ({
      id: message.id,
      senderRole: message.senderRole,
      senderNickname: message.senderNickname,
      message: message.message,
      createdAt: message.createdAt,
    })),
  }
}

async function resolveSocketUser(socket) {
  const token = socket.handshake.auth?.token
  if (!token || !process.env.JWT_SECRET || !isMongoConnected()) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const User = getUserModel()
    if (!User) return null
    return User.findById(decoded.id).select('_id username')
  } catch {
    return null
  }
}

async function incrementParticipantStats(participant, won) {
  if (!participant) return

  const User = getUserModel()
  if (!User) return

  const inc = { gamesPlayed: 1, [won ? 'wins' : 'losses']: 1 }

  if (participant.userId) {
    await User.findByIdAndUpdate(participant.userId, { $inc: inc })
    return
  }

  if (participant.nickname) {
    await User.findOneAndUpdate({ username: participant.nickname }, { $inc: inc })
  }
}

function resolveLobbyScreen(role, status) {
  if (status === 'waiting' && role === 'word-giver') return 'create'
  if (status === 'word-entry' && role === 'word-giver') return 'word-entry'
  return 'game'
}

module.exports = function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)
    socket.data.user = null

    socket.on('create-room', async ({ nickname }) => {
      try {
        const currentUser = socket.data.user || await resolveSocketUser(socket)
        socket.data.user = currentUser || null
        const cleanNickname = (nickname || '').trim()
        if (!/^[A-Z0-9 ]{2,20}$/i.test(cleanNickname)) {
          return socket.emit('error', { message: 'Nickname must be 2-20 letters or numbers' })
        }

        const code = await generateUniqueCode()
        const room = await createRoomRecord({
          code,
          wordGiver: {
            socketId: socket.id,
            userId: currentUser?._id || null,
            nickname: cleanNickname,
            connected: true,
            lastSeenAt: new Date(),
          },
          guesser: null,
          word: null,
          maskedWord: null,
          guesses: [],
          wrongGuesses: [],
          maxAttempts: 6,
          status: 'waiting',
          chatMessages: [],
        })

        socket.join(code)
        socket.emit('room-created', {
          code,
          role: 'word-giver',
          screen: 'create',
          room: sanitize(room),
        })
      } catch (error) {
        console.error('create-room failed:', error)
        socket.emit('error', { message: 'Could not create room' })
      }
    })

    socket.on('join-room', async ({ code, nickname }) => {
      try {
        const currentUser = socket.data.user || await resolveSocketUser(socket)
        socket.data.user = currentUser || null
        const cleanCode = (code || '').trim().toUpperCase()
        const cleanNickname = (nickname || '').trim()
        if (!cleanCode) return socket.emit('error', { message: 'Room code is required' })
        if (!/^[A-Z0-9 ]{2,20}$/i.test(cleanNickname)) {
          return socket.emit('error', { message: 'Nickname must be 2-20 letters or numbers' })
        }

        const room = await getRoomByCode(cleanCode)
        if (!room) return socket.emit('error', { message: 'Room not found' })

        let role = null
        const wordGiverNickname = room.wordGiver?.nickname

        if (room.wordGiver && !room.wordGiver.connected && room.wordGiver.nickname === cleanNickname) {
          room.wordGiver.socketId = socket.id
          room.wordGiver.userId = room.wordGiver.userId || currentUser?._id || null
          room.wordGiver.connected = true
          room.wordGiver.lastSeenAt = new Date()
          role = 'word-giver'
        } else if (room.guesser && !room.guesser.connected && room.guesser.nickname === cleanNickname) {
          room.guesser.socketId = socket.id
          room.guesser.userId = room.guesser.userId || currentUser?._id || null
          room.guesser.connected = true
          room.guesser.lastSeenAt = new Date()
          role = 'guesser'
        } else if (!room.guesser && room.status === 'waiting') {
          room.guesser = {
            socketId: socket.id,
            userId: currentUser?._id || null,
            nickname: cleanNickname,
            connected: true,
            lastSeenAt: new Date(),
          }
          room.status = 'word-entry'
          role = 'guesser'
        } else {
          return socket.emit('error', { message: 'Room is full or already in progress' })
        }

        await saveRoom(room)
        socket.join(cleanCode)

        socket.emit('room-joined', {
          code: cleanCode,
          role,
          screen: resolveLobbyScreen(role, room.status),
          wordGiverNickname,
          room: sanitize(room),
          reconnected: room.status !== 'waiting' && room.status !== 'word-entry',
        })

        if (role === 'guesser' && room.status === 'word-entry') {
          io.to(room.wordGiver.socketId).emit('guesser-joined', {
            guesserNickname: room.guesser.nickname,
          })
        } else {
          io.to(cleanCode).emit('game-state', sanitize(room))
        }
      } catch (error) {
        console.error('join-room failed:', error)
        socket.emit('error', { message: 'Could not join room' })
      }
    })

    socket.on('submit-word', async ({ code, word }) => {
      try {
        const room = await getRoomByCode((code || '').trim().toUpperCase())
        if (!room) return socket.emit('error', { message: 'Room not found' })
        if (socket.id !== room.wordGiver?.socketId) {
          return socket.emit('error', { message: 'Only the word-giver can submit the word' })
        }
        if (room.status !== 'word-entry') {
          return socket.emit('error', { message: 'Not the right time to submit a word' })
        }

        const cleanWord = (word || '').trim().toUpperCase()
        if (!/^[A-Z]+$/.test(cleanWord) || cleanWord.length < 2 || cleanWord.length > 20) {
          return socket.emit('error', { message: 'Word must be 2-20 letters only' })
        }

        room.word = cleanWord
        room.maskedWord = buildMasked(cleanWord, [])
        room.status = 'ongoing'
        await saveRoom(room)

        io.to(room.code).emit('game-started', {
          maskedWord: room.maskedWord,
          attemptsLeft: room.maxAttempts,
        })
        io.to(room.code).emit('game-state', sanitize(room))
      } catch (error) {
        console.error('submit-word failed:', error)
        socket.emit('error', { message: 'Could not submit word' })
      }
    })

    socket.on('guess-letter', async ({ code, letter }) => {
      try {
        const room = await getRoomByCode((code || '').trim().toUpperCase())
        if (!room) return socket.emit('error', { message: 'Room not found' })
        if (socket.id !== room.guesser?.socketId) {
          return socket.emit('error', { message: 'Only the guesser can guess letters' })
        }
        if (room.status !== 'ongoing') {
          return socket.emit('error', { message: 'Game is not active' })
        }

        const normalizedLetter = (letter || '').toUpperCase()
        if (!/^[A-Z]$/.test(normalizedLetter)) {
          return socket.emit('error', { message: 'Invalid letter' })
        }
        if (room.guesses.includes(normalizedLetter)) {
          return socket.emit('error', { message: 'Already guessed' })
        }

        room.guesses.push(normalizedLetter)

        if (room.word.includes(normalizedLetter)) {
          room.maskedWord = buildMasked(room.word, room.guesses)
        } else {
          room.wrongGuesses.push(normalizedLetter)
        }

        const attemptsLeft = room.maxAttempts - room.wrongGuesses.length
        if (!room.maskedWord.includes('_')) {
          room.status = 'won'
        } else if (attemptsLeft <= 0) {
          room.status = 'lost'
        }

        await saveRoom(room)

        // ── Track stats in User model when game ends ──────────────────────
        if (room.status !== 'ongoing' && isMongoConnected()) {
          try {
            const guesserWon = room.status === 'won'
            await incrementParticipantStats(room.guesser, guesserWon)
            await incrementParticipantStats(room.wordGiver, !guesserWon)
          } catch (statErr) {
            console.error('Failed to update user stats:', statErr.message)
          }
        }

        const state = sanitize(room)
        if (room.status !== 'ongoing') state.word = room.word
        io.to(room.code).emit('game-state', state)
      } catch (error) {
        console.error('guess-letter failed:', error)
        socket.emit('error', { message: 'Could not process guess' })
      }
    })

    socket.on('send-chat-message', async ({ code, message }) => {
      try {
        const room = await getRoomByCode((code || '').trim().toUpperCase())
        if (!room) return socket.emit('error', { message: 'Room not found' })

        const role = getParticipantRole(room, socket.id)
        if (!role) return socket.emit('error', { message: 'Join the room before chatting' })

        const cleanMessage = (message || '').trim().replace(/\s+/g, ' ')
        if (!cleanMessage) return socket.emit('error', { message: 'Message cannot be empty' })
        if (cleanMessage.length > 240) {
          return socket.emit('error', { message: 'Message must be 240 characters or less' })
        }

        const participant = getParticipantByRole(room, role)
        room.chatMessages.push({
          id: randomUUID(),
          senderRole: role,
          senderNickname: participant.nickname,
          message: cleanMessage,
          createdAt: new Date(),
        })

        room.chatMessages = room.chatMessages.slice(-50)
        await saveRoom(room)

        io.to(room.code).emit('chat-message', sanitize(room).chatMessages.at(-1))
      } catch (error) {
        console.error('send-chat-message failed:', error)
        socket.emit('error', { message: 'Could not send message' })
      }
    })

    socket.on('rematch', async ({ code }) => {
      try {
        const room = await getRoomByCode((code || '').trim().toUpperCase())
        if (!room) return
        if (!room.wordGiver || !room.guesser) return

        const temp = room.wordGiver
        room.wordGiver = room.guesser
        room.guesser = temp
        room.word = null
        room.maskedWord = null
        room.guesses = []
        room.wrongGuesses = []
        room.status = 'word-entry'
        await saveRoom(room)

        io.to(room.code).emit('rematch-started', {
          wordGiverNickname: room.wordGiver.nickname,
          guesserNickname: room.guesser.nickname,
        })
        if (room.wordGiver?.socketId) {
          io.to(room.wordGiver.socketId).emit('role-updated', {
            role: 'word-giver',
            screen: 'word-entry',
          })
        }
        if (room.guesser?.socketId) {
          io.to(room.guesser.socketId).emit('role-updated', {
            role: 'guesser',
            screen: 'game',
          })
        }
        io.to(room.code).emit('game-state', sanitize(room))
      } catch (error) {
        console.error('rematch failed:', error)
        socket.emit('error', { message: 'Could not start rematch' })
      }
    })

    socket.on('disconnect', async () => {
      try {
        const Room = getRoomModel()
        let room = null

        if (Room) {
          room = await Room.findOne({
            $or: [{ 'wordGiver.socketId': socket.id }, { 'guesser.socketId': socket.id }],
          })
        } else {
          const code = getActiveRoomCodeForSocket(socket.id)
          room = code ? memRooms[code] : null
        }

        if (!room) return

        let nickname = null
        if (room.wordGiver?.socketId === socket.id) {
          room.wordGiver.socketId = null
          room.wordGiver.connected = false
          room.wordGiver.lastSeenAt = new Date()
          nickname = room.wordGiver.nickname
        } else if (room.guesser?.socketId === socket.id) {
          room.guesser.socketId = null
          room.guesser.connected = false
          room.guesser.lastSeenAt = new Date()
          nickname = room.guesser.nickname
        }

        if (!room.wordGiver?.connected && !room.guesser?.connected) {
          room.status = room.status === 'waiting' ? 'abandoned' : room.status
        }

        await saveRoom(room)
        io.to(room.code).emit('player-left', { nickname })
        io.to(room.code).emit('game-state', sanitize(room))
      } catch (error) {
        console.error('disconnect handling failed:', error)
      }
    })
  })
}
