import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema({
  monthNumber: Number,
  baseAmount: Number,
  redeemed: { type: Boolean, default: false },
  redeemedAt: Date,
  couponCode: String, // real discount coupon code jo generate hota hai redeem hone par
  emailSent: { type: Boolean, default: false },
})

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheme: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true },

    depositClaimed: { type: Boolean, default: false },
    depositUpiRef: String,
    depositConfirmed: { type: Boolean, default: false },
    depositConfirmedAt: Date,

    coupons: [couponSchema],

    status: { type: String, enum: ['pending_deposit', 'active', 'completed', 'cancelled'], default: 'pending_deposit' },
  },
  { timestamps: true }
)

export default mongoose.model('SchemeEnrollment', enrollmentSchema)
