// Run: npm run seed
// Ye script sample products database mein daal deta hai taaki turant testing kar sako.
import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import Product from '../models/Product.js'

dotenv.config()

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

async function seed() {
  await connectDB()
  await Product.deleteMany()
  await Product.insertMany(sampleProducts)
  console.log('Sample products inserted!')
  process.exit()
}

seed()
