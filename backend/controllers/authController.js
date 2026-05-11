const jwt      = require('jsonwebtoken')
const mongoose = require('mongoose')

function isMongoConnected() {
  return mongoose.connection.readyState === 1
}

function getUser() {
  if (!isMongoConnected()) return null
  return require('../models/User')
}

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// POST /api/auth/register
async function register(req, res) {
  const User = getUser()
  if (!User) {
    return res.status(503).json({ error: 'Database not available — auth requires MongoDB' })
  }
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' })

    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already exists' })

    const user  = await User.create({ username, email, password })
    const token = signToken(user._id)

    return res.status(201).json({ token, user: { id: user._id, username: user.username } })
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: 'Username or email already exists' })
    return res.status(500).json({ error: 'Registration failed' })
  }
}

// POST /api/auth/login
async function login(req, res) {
  const User = getUser()
  if (!User) {
    return res.status(503).json({ error: 'Database not available — auth requires MongoDB' })
  }
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const match = await user.comparePassword(password)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(user._id)
    return res.status(200).json({ token, user: { id: user._id, username: user.username } })
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' })
  }
}

module.exports = { register, login }
