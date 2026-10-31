import Gallery from '../models/Gallery.js'

export async function getGallery(req, res) {
  const category = ['news', 'photos', 'videos'].includes(req.params.category) ? req.params.category : null
  if (!category) return res.status(400).json({ message: 'Invalid gallery category' })
  const items = await Gallery.find({ category, active: true }).sort({ order: 1, createdAt: -1 })
  res.json(items)
}

export async function getAllGallery(req, res) {
  const items = await Gallery.find({}).sort({ category: 1, order: 1, createdAt: -1 })
  res.json(items)
}

export async function createGallery(req, res) {
  const { category, type, title, description, url, order, active } = req.body
  if (!['news', 'photos', 'videos'].includes(category)) return res.status(400).json({ message: 'Invalid gallery category' })
  if (!['image', 'video'].includes(type)) return res.status(400).json({ message: 'Invalid gallery type' })
  if (!url) return res.status(400).json({ message: 'Media URL is required' })
  const item = await Gallery.create({ category, type, title, description, url, order, active })
  res.status(201).json(item)
}

export async function updateGallery(req, res) {
  const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!item) return res.status(404).json({ message: 'Gallery item not found' })
  res.json(item)
}

export async function deleteGallery(req, res) {
  const item = await Gallery.findByIdAndDelete(req.params.id)
  if (!item) return res.status(404).json({ message: 'Gallery item not found' })
  res.json({ message: 'Gallery item removed' })
}
