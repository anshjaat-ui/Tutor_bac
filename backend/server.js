
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import 'express-async-errors'

import connectDB from './config/db.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'

import authRoutes from './routes/authRoutes.js'
import enquiryRoutes from './routes/enquiryRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import galleryRoutes from './routes/galleryRoutes.js'

dotenv.config()
connectDB()

const app = express()

app.use(helmet({ crossOriginResourcePolicy: false }))

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean).map(url => url.replace(/\/$/, ''))

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true)
    }

    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
      return callback(null, true)
    }

    return callback(new Error('CORS origin not allowed'))
  },
  credentials: true
}))

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(mongoSanitize())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts. Try again later.' }
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)

app.use('/api/enquiries', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12
}))

app.get('/', (req, res) => {
  res.json({
    status: 'API running',
    app: 'ALPHA HOME TUTORS'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/gallery', galleryRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`ALPHA HOME TUTORS API running on port ${PORT}`)
})
