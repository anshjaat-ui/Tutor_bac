import Banner from '../models/Banner.js'

// GET /api/banners - public, sirf active, order se sorted
export async function getActiveBanners(req, res) {
  const banners = await Banner.find({ active: true }).sort({ order: 1 })
  res.json(banners)
}

// GET /api/banners/all (admin only) - sab dikhao, active/inactive dono
export async function getAllBanners(req, res) {
  const banners = await Banner.find({}).sort({ order: 1 })
  res.json(banners)
}

export async function createBanner(req, res) {
  const banner = await Banner.create(req.body)
  res.status(201).json(banner)
}

export async function updateBanner(req, res) {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!banner) return res.status(404).json({ message: 'Banner not found' })
  res.json(banner)
}

export async function deleteBanner(req, res) {
  const banner = await Banner.findByIdAndDelete(req.params.id)
  if (!banner) return res.status(404).json({ message: 'Banner not found' })
  res.json({ message: 'Banner removed' })
}
