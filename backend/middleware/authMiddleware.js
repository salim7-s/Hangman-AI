const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// Full auth — returns 401 if no valid token
async function protect(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Not authenticated' })

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) return res.status(401).json({ error: 'User not found' })
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Optional auth — attaches user if token present, continues either way
async function optionalAuth(req, res, next) {
  const auth = req.headers.authorization
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
    } catch { /* guest */ }
  }
  next()
}

module.exports = { protect, optionalAuth }
