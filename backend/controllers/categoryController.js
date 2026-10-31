import Category from '../models/Category.js'

// GET /api/categories - public, flat list (parent field batata hai hierarchy)
export async function getCategories(req, res) {
  const categories = await Category.find({}).sort({ order: 1, name: 1 })
  res.json(categories)
}

// POST /api/categories (admin only) - top-level ya subcategory (parent bhejo)
export async function createCategory(req, res) {
  const { name, emoji, order, parent } = req.body
  const exists = await Category.findOne({ name, parent: parent || null })
  if (exists) {
    return res.status(400).json({ message: 'Category already exists' })
  }
  const category = await Category.create({ name, emoji, order, parent: parent || null })
  res.status(201).json(category)
}

export async function updateCategory(req, res) {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!category) return res.status(404).json({ message: 'Category not found' })
  res.json(category)
}

export async function deleteCategory(req, res) {
  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) return res.status(404).json({ message: 'Category not found' })
  // Iski subcategories bhi delete kar do
  await Category.deleteMany({ parent: req.params.id })
  res.json({ message: 'Category removed' })
}
