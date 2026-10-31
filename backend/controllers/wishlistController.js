import Wishlist from '../models/Wishlist.js'

// GET /api/wishlist
export async function getWishlist(req, res) {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products')
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] })
  }
  res.json(wishlist)
}

// POST /api/wishlist/:productId - toggle add/remove
export async function toggleWishlist(req, res) {
  let wishlist = await Wishlist.findOne({ user: req.user._id })
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] })
  }

  const idx = wishlist.products.findIndex((p) => p.toString() === req.params.productId)
  let added
  if (idx > -1) {
    wishlist.products.splice(idx, 1)
    added = false
  } else {
    wishlist.products.push(req.params.productId)
    added = true
  }

  await wishlist.save()
  await wishlist.populate('products')
  res.json({ wishlist, added })
}
