const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    // Return first error message in standard { error } format for compatibility
    const errorMsg = result.error.errors[0]?.message || 'Invalid request parameters'
    return res.status(400).json({ error: errorMsg })
  }
  req.body = result.data
  next()
}

module.exports = validate
