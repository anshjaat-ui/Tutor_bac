import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

// GET /api/cart
export async function getCart(req, res) {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name price images stock hasSizes sizes'
  )
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] })
  }
  res.json(cart)
}

// POST /api/cart  { productId, qty }
export async function addToCart(req, res) {
  const { productId, qty = 1, size } = req.body

  let cart = await Cart.findOne({ user: req.user._id })
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] })
  }

  const product = await Product.findById(productId)
  if (!product) return res.status(404).json({ message: 'Product not found' })

  const cleanSize = typeof size === 'string' ? size.trim() : ''
  if (product.hasSizes) {
    if (!cleanSize) return res.status(400).json({ message: 'Please select a size' })
    if (!product.sizes.includes(cleanSize)) {
      return res.status(400).json({ message: 'Selected size is not available' })
    }
  }

  const existingItem = cart.items.find(
    (i) => i.product.toString() === productId && (i.size || '') === cleanSize
  )
  if (existingItem) {
    existingItem.qty += qty
  } else {
    cart.items.push({ product: productId, qty, size: cleanSize || undefined })
  }

  await cart.save()
  await cart.populate('items.product', 'name price images stock hasSizes sizes')
  res.status(201).json(cart)
}

// PUT /api/cart/:productId  { qty }
export async function updateCartItem(req, res) {
  const { qty } = req.body
  const size = typeof req.query.size === 'string' ? req.query.size.trim() : ''
  const cart = await Cart.findOne({ user: req.user._id })
  if (!cart) return res.status(404).json({ message: 'Cart not found' })

  const item = cart.items.find((i) => i.product.toString() === req.params.productId && (i.size || '') === size)
  if (!item) return res.status(404).json({ message: 'Item not in cart' })

  item.qty = qty
  await cart.save()
  await cart.populate('items.product', 'name price images stock hasSizes sizes')
  res.json(cart)
}

// DELETE /api/cart/:productId
export async function removeCartItem(req, res) {
  const size = typeof req.query.size === 'string' ? req.query.size.trim() : ''
  const cart = await Cart.findOne({ user: req.user._id })
  if (!cart) return res.status(404).json({ message: 'Cart not found' })

  cart.items = cart.items.filter(
    (i) => !(i.product.toString() === req.params.productId && (i.size || '') === size)
  )
  await cart.save()
  await cart.populate('items.product', 'name price images stock hasSizes sizes')
  res.json(cart)
}
