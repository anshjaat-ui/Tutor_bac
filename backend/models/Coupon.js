import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    discountValue: { type: Number, required: true }, // percent: 10 = 10%, flat: 100 = ₹100
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number }, // percent type ke liye cap (optional)
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
    usageLimit: { type: Number }, // total kitni baar use ho sakta hai (optional, unlimited agar nahi diya)
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Coupon', couponSchema)
