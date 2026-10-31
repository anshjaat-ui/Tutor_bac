import mongoose from 'mongoose'

const schemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Silver Plan"
    depositAmount: { type: Number, required: true }, // customer ek saath jitna deta hai, e.g. 12000
    durationMonths: { type: Number, required: true }, // e.g. 12
    monthlyPayout: { type: Number, required: true }, // har mahine wapas milta hai (last mahine ke alawa), e.g. 1000
    finalPayout: { type: Number, required: true }, // last mahine ka bonus payout, e.g. 1500
    description: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Kitna total wapas milega (sirf display/reference ke liye)
schemeSchema.virtual('totalReturn').get(function () {
  return this.monthlyPayout * (this.durationMonths - 1) + this.finalPayout
})
schemeSchema.set('toJSON', { virtuals: true })

export default mongoose.model('Scheme', schemeSchema)
