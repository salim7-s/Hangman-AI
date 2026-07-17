const assert = require('node:assert/strict')
const { protect, optionalAuth } = require('../middleware/authMiddleware')

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

module.exports = [
  {
    name: 'protect returns 503 when JWT_SECRET is undefined',
    async run() {
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      const req = { headers: {} }
      const res = createResponse()
      let nextCalled = false

      await protect(req, res, () => {
        nextCalled = true
      })

      process.env.JWT_SECRET = originalSecret

      assert.equal(res.statusCode, 503)
      assert.equal(res.body.error, 'Authentication is temporarily unavailable')
      assert.equal(nextCalled, false)
    },
  },
  {
    name: 'protect returns 503 when JWT_SECRET is a placeholder',
    async run() {
      const originalSecret = process.env.JWT_SECRET
      process.env.JWT_SECRET = 'change_this_to_a_long_random_secret'

      const req = { headers: {} }
      const res = createResponse()
      let nextCalled = false

      await protect(req, res, () => {
        nextCalled = true
      })

      process.env.JWT_SECRET = originalSecret

      assert.equal(res.statusCode, 503)
      assert.equal(res.body.error, 'Authentication is temporarily unavailable')
      assert.equal(nextCalled, false)
    },
  },
  {
    name: 'protect returns 401 when no token is provided',
    async run() {
      const originalSecret = process.env.JWT_SECRET
      process.env.JWT_SECRET = 'valid_secret_for_test'

      const req = { headers: {} }
      const res = createResponse()
      let nextCalled = false

      await protect(req, res, () => {
        nextCalled = true
      })

      process.env.JWT_SECRET = originalSecret

      assert.equal(res.statusCode, 401)
      assert.equal(res.body.error, 'Not authenticated')
      assert.equal(nextCalled, false)
    },
  },
  {
    name: 'optionalAuth calls next() without setting req.user when JWT unconfigured',
    async run() {
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      const req = { headers: { authorization: 'Bearer token' } }
      const res = createResponse()
      let nextCalled = false

      await optionalAuth(req, res, () => {
        nextCalled = true
      })

      process.env.JWT_SECRET = originalSecret

      assert.equal(nextCalled, true)
      assert.equal(req.user, undefined)
    },
  },
]
