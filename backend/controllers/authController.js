const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const INVALID_JWT_SECRETS = new Set([
  '',
  'change_this_to_a_long_random_secret',
  'your_super_secret_key_change_this',
])

function isMongoConnected() {
  return mongoose.connection.readyState === 1
}

function getUser() {
  if (!isMongoConnected()) return null
  return require('../models/User')
}

function hasValidJwtSecret() {
  const secret = (process.env.JWT_SECRET || '').trim()
  return !INVALID_JWT_SECRETS.has(secret)
}

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function authUnavailable(res) {
  return res.status(503).json({ error: 'Authentication is temporarily unavailable' })
}

async function register(req, res) {
  const User = getUser()
  if (!User) {
    return res.status(503).json({ error: 'Database not available - auth requires MongoDB' })
  }

  if (!hasValidJwtSecret()) {
    console.error('Auth registration blocked: JWT_SECRET is missing or still using a placeholder.')
    return authUnavailable(res)
  }

  try {
    const username = req.body.username?.trim()
    const email = req.body.email?.trim().toLowerCase()
    const { password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return res.status(400).json({
        error: existing.email === email ? 'Email already exists' : 'Username already exists',
      })
    }

    const user = await User.create({ username, email, password })

    try {
      const token = signToken(user._id)
      return res.status(201).json({ token, user: { id: user._id, username: user.username } })
    } catch (tokenErr) {
      console.error('Registration token signing failed:', tokenErr.message)
      await User.findByIdAndDelete(user._id).catch(() => {})
      return authUnavailable(res)
    }
  } catch (err) {
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0]
      return res.status(400).json({
        error: duplicateField === 'username' ? 'Username already exists' : 'Email already exists',
      })
    }

    console.error('Registration failed:', err.message)
    return res.status(500).json({ error: 'Registration failed' })
  }
}

async function login(req, res) {
  const User = getUser()
  if (!User) {
    return res.status(503).json({ error: 'Database not available - auth requires MongoDB' })
  }

  if (!hasValidJwtSecret()) {
    console.error('Auth login blocked: JWT_SECRET is missing or still using a placeholder.')
    return authUnavailable(res)
  }

  try {
    const email = req.body.email?.trim().toLowerCase()
    const { password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const match = await user.comparePassword(password)
    if (!match) return res.status(401).json({ error: 'Invalid credentials' })

    try {
      const token = signToken(user._id)
      return res.status(200).json({ token, user: { id: user._id, username: user.username } })
    } catch (tokenErr) {
      console.error('Login token signing failed:', tokenErr.message)
      return authUnavailable(res)
    }
  } catch (err) {
    console.error('Login failed:', err.message)
    return res.status(500).json({ error: 'Login failed' })
  }
}

module.exports = { register, login }
