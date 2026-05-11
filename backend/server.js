require('dotenv').config()
const http       = require('http')
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')
const { Server } = require('socket.io')
const connectDB  = require('./config/db')
const { loadDictionary } = require('./services/aiService')
const gameRoutes = require('./routes/gameRoutes')
const authRoutes = require('./routes/authRoutes')
const setupSocket = require('./socket/gameSocket')

const PORT       = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// ── Security ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Rate limiting ──────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api/', apiLimiter)

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json())

// ── Root route — health info only (no redirect to avoid loops) ─────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', game: 'Hangman AI', version: '1.0.0' })
})

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/game', gameRoutes)

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  })
})

// ── Socket.io multiplayer ──────────────────────────────────────────────────
setupSocket(io)

// ── Load dictionary (async, non-blocking) ─────────────────────────────────
loadDictionary()

// ── Connect DB then start server ──────────────────────────────────────────
if (process.env.MONGO_URI) {
  connectDB().then(() => {
    server.listen(PORT, () =>
      console.log(`✅ Server running on http://localhost:${PORT}`)
    )
  }).catch((err) => {
    console.error('❌ DB connection failed:', err.message)
    process.exit(1)
  })
} else {
  console.warn('⚠️  No MONGO_URI — running in-memory (data will not persist)')
  server.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
  )
}
