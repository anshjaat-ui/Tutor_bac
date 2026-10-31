import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: true }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String, required: true }],
    category: { type: String, required: true, index: true },
    subcategory: { type: String, index: true },
    brand: String,
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    hasSizes: { type: Boolean, default: false },
    sizes: [{ type: String, trim: true }],
    viewCount: { type: Number, default: 0, index: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true }
)

productSchema.index({ name: 'text', description: 'text', category: 'text' })

export default mongoose.model('Product', productSchema)
