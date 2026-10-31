import mongoose from 'mongoose'

const gallerySchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['news', 'photos', 'videos'], required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('Gallery', gallerySchema)
