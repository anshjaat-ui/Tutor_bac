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
import Product from './models/Product.js'

import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import couponRoutes from './routes/couponRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import bannerRoutes from './routes/bannerRoutes.js'
import schemeRoutes from './routes/schemeRoutes.js'
import deliveryRoutes from './routes/deliveryRoutes.js'
import galleryRoutes from './routes/galleryRoutes.js'
import Category from './models/Category.js'
import enquiryRoutes from './routes/enquiryRoutes.js'

dotenv.config()
connectDB()

const app = express()

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }))

// Customer site aur Admin panel — dono alag Vercel projects hain, alag naam ke
// URLs, aur Vercel har naye deploy pe naya preview URL bhi banata hai. Isliye
// kisi bhi *.vercel.app domain ko allow karte hain, plus CLIENT_URL aur local dev.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (origin.endsWith('.vercel.app')) return callback(null, true)
      if (origin === (process.env.CLIENT_URL || '').replace(/\/$/, '')) return callback(null, true)
      if (origin === (process.env.ADMIN_URL || '').replace(/\/$/, '')) return callback(null, true)
      if (origin === 'http://localhost:5173' || origin === 'http://localhost:5174') return callback(null, true)
      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())
app.use(mongoSanitize()) // NoSQL injection se bachata hai (jaise { "$gt": "" } jaisi query)

// Login/signup pe spam/brute-force attempts limit karo
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 20, // 15 min mein max 20 tries per IP
  message: { message: 'Bahut zyada attempts. 15 minute baad try karo.' },
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)
app.use('/api/enquiries', rateLimit({ windowMs: 15 * 60 * 1000, max: 12, message: { message: 'Too many enquiries. Please try again later.' } }))

app.get('/', (req, res) => res.json({ status: 'API running' }))

app.get('/api/legacy-seed-products/:key', async (req, res) => {
  if (req.params.key !== process.env.SEED_KEY) {
    return res.status(403).json({ message: 'Invalid seed key' })
  }

  const sampleProducts = [
    {
      name: 'Wireless Bluetooth Headphones with Active Noise Cancellation, 40Hr Battery',
      description: 'Premium over-ear headphones with ANC, 40 hour battery life, and quick charge support.',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600'],
      category: 'Electronics',
      brand: 'SoundPro',
      price: 1799,
      mrp: 4999,
      stock: 50,
    },
    {
      name: 'Smart Watch with Heart Rate Monitor, AMOLED Display, 7-Day Battery Life',
      description: 'Track your fitness with heart rate, SpO2, and sleep monitoring. AMOLED display.',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600'],
      category: 'Electronics',
      brand: 'FitTrack',
      price: 2499,
      mrp: 6999,
      stock: 30,
    },
    {
      name: "Men's Casual Cotton Shirt — Regular Fit, Machine Wash",
      description: '100% cotton casual shirt, breathable fabric, regular fit.',
      images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600'],
      category: 'Fashion',
      brand: 'UrbanFit',
      price: 599,
      mrp: 1299,
      stock: 100,
    },
    {
      name: 'Non-Stick Cookware Set, 5-Piece, Induction Compatible',
      description: 'Durable non-stick cookware set suitable for all stovetops including induction.',
      images: ['https://images.unsplash.com/photo-1584990347449-a5d9f800a783?q=80&w=600'],
      category: 'Home & Kitchen',
      brand: 'HomeChef',
      price: 1249,
      mrp: 2499,
      stock: 40,
    },
  ]

  await Product.deleteMany()
  await Product.insertMany(sampleProducts)
  res.json({ message: `${sampleProducts.length} products inserted successfully!` })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/schemes', schemeRoutes)
app.use('/api/check-delivery', deliveryRoutes)
app.use('/api/gallery', galleryRoutes)
app.use('/api/enquiries', enquiryRoutes)

// Ek baar browser mein khol ke default categories daalne ke liye (jaise product seed)
app.get('/api/legacy-seed-categories/:key', async (req, res) => {
  if (req.params.key !== process.env.SEED_KEY) {
    return res.status(403).json({ message: 'Invalid seed key' })
  }
  const defaults = [
    { name: 'Electronics', emoji: '📱', order: 1 },
    { name: 'Fashion', emoji: '👗', order: 2 },
    { name: 'Home & Kitchen', emoji: '🏠', order: 3 },
    { name: 'Books', emoji: '📚', order: 4 },
    { name: 'Beauty', emoji: '💄', order: 5 },
    { name: 'Sports', emoji: '⚽', order: 6 },
    { name: 'Toys', emoji: '🧸', order: 7 },
    { name: 'Grocery', emoji: '🛒', order: 8 },
    { name: 'Mobiles', emoji: '📞', order: 9 },
  ]
  await Category.deleteMany()
  await Category.insertMany(defaults)
  res.json({ message: `${defaults.length} categories inserted!` })
})

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
