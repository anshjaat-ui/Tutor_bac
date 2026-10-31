import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, required: true },
    heading: String,
    subheading: String,
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('Banner', bannerSchema)
