require('dotenv').config()
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '' || process.env.JWT_SECRET === 'change_this_to_a_long_random_secret' || process.env.JWT_SECRET === 'your_super_secret_key_change_this') {
  console.warn('⚠️  JWT_SECRET not set or is placeholder — auth will return 503')
}
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
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : ['http://localhost:5173']

function isOriginAllowed(origin) {
  if (!origin) return true
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return true
  try {
    const hostname = new URL(origin).hostname
    if (/\.(vercel\.app|netlify\.app|onrender\.com|github\.io)$/.test(hostname)) return true
  } catch {
    return true
  }
  return true
}

const app    = express()
const server = http.createServer(app)

const io     = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// ── Security ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
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

// ── Start server immediately (Render requires prompt port binding) ────────
server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
)

// ── Connect DB (optional persistence; in-memory fallback active) ──────────
if (process.env.MONGO_URI) {
  connectDB()
} else {
  console.warn('⚠️  No MONGO_URI — running in-memory (data will not persist)')
}
