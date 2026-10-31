import Product from '../models/Product.js'

// GET /api/products?keyword=&category=&page=&minPrice=&maxPrice=
export async function getProducts(req, res) {
  const pageSize = 12
  const page = Number(req.query.page) || 1

  const filter = {}

  if (req.query.keyword) {
    filter.$text = { $search: req.query.keyword }
  }
  if (req.query.category) {
    filter.category = req.query.category
  }
  if (req.query.subcategory) {
    filter.subcategory = req.query.subcategory
  }
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {}
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice)
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice)
  }

  const count = await Product.countDocuments(filter)
  const products = await Product.find(filter)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 })

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  })
}


// GET /api/products/trending
// Homepage ke liye sirf high-discount, most-viewed aur high-stock products
// ko combine karta hai. Duplicate products ko hata kar compact list deta hai.
export async function getTrendingProducts(req, res) {
  const candidates = await Product.find({ stock: { $gt: 0 } })
    .select('name description images category subcategory brand price mrp stock rating numReviews viewCount createdAt')
    .limit(300)
    .lean()

  const withDiscount = candidates.map((p) => ({
    ...p,
    discountPercent: p.mrp > 0 ? Math.max(0, Math.round(((p.mrp - p.price) / p.mrp) * 100)) : 0,
  }))

  const topDiscount = [...withDiscount].sort((a, b) =>
    (b.discountPercent - a.discountPercent) || (b.viewCount || 0) - (a.viewCount || 0)
  ).slice(0, 4)

  const mostViewed = [...withDiscount].sort((a, b) =>
    ((b.viewCount || 0) - (a.viewCount || 0)) || (b.discountPercent - a.discountPercent)
  ).slice(0, 4)

  const bulkStock = [...withDiscount].sort((a, b) =>
    (b.stock - a.stock) || (b.discountPercent - a.discountPercent)
  ).slice(0, 4)

  const seen = new Set()
  const products = []
  for (const product of [...topDiscount, ...mostViewed, ...bulkStock]) {
    const id = String(product._id)
    if (seen.has(id)) continue
    seen.add(id)
    products.push(product)
    if (products.length >= 8) break
  }

  res.json({ products })
}

// GET /api/products/suggestions?keyword= - search autocomplete ke liye, halka response
export async function getSuggestions(req, res) {
  const keyword = req.query.keyword || ''
  if (!keyword.trim()) return res.json([])

  const products = await Product.find({
    name: { $regex: keyword, $options: 'i' },
  })
    .select('name images price category')
    .limit(6)

  res.json(products)
}

// GET /api/products/:id
export async function getProductById(req, res) {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }
  res.json(product)
}

// POST /api/products  (admin only)
export async function createProduct(req, res) {
  const product = await Product.create(req.body)
  res.status(201).json(product)
}

// PUT /api/products/:id  (admin only)
export async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }
  res.json(product)
}

// DELETE /api/products/:id  (admin only)
export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }
  res.json({ message: 'Product removed' })
}

// POST /api/products/:id/reviews
export async function addReview(req, res) {
  const { rating, comment } = req.body
  const product = await Product.findById(req.params.id)

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  )
  if (alreadyReviewed) {
    return res.status(400).json({ message: 'You already reviewed this product' })
  }

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  })

  product.numReviews = product.reviews.length
  product.rating =
    product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length

  await product.save()
  res.status(201).json({ message: 'Review added' })
}
