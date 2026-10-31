import mongoose from 'mongoose'

// Singleton document - hero, payment, aur delivery settings, sab admin se editable
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },

    // Hero (ab Banners model use hoti hai homepage slider ke liye, ye sirf fallback)
    heading: { type: String, default: 'Shop More, Save More, Smile More' },
    subheading: { type: String, default: 'Curated picks across categories — delivered fast.' },
    ctaText: { type: String, default: 'Explore Now' },
    highlights: [{ type: String }],

    // Payment settings
    upiId: { type: String, default: '' },
    upiName: { type: String, default: '' },
    qrCodeImage: { type: String, default: '' },
    codEnabled: { type: Boolean, default: true },
    qrUpiEnabled: { type: Boolean, default: true },

    // Delivery restriction
    deliveryEnabled: { type: Boolean, default: true },
    baseAddressText: { type: String, default: 'Moti Kunj, near Hanuman Nagar, Mathura' },
    baseLat: { type: Number, default: 27.4924 },
    baseLng: { type: Number, default: 77.6737 },
    radiusKm: { type: Number, default: 5 },
  },
  { timestamps: true }
)

export default mongoose.model('Settings', settingsSchema)
