const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.warn(`⚠️ MongoDB connection failed (${err.message}) — running with in-memory fallback`)
  }
}

module.exports = connectDB
