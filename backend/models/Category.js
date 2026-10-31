import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    emoji: { type: String, default: '🛍️' },
    order: { type: Number, default: 0 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // null = top-level category
  },
  { timestamps: true }
)

// Same naam do alag parents ke andar ho sakta hai, isliye unique sirf parent+name pe
categorySchema.index({ name: 1, parent: 1 }, { unique: true })

export default mongoose.model('Category', categorySchema)
