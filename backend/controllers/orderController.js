import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Cart from '../models/Cart.js'
import Coupon from '../models/Coupon.js'
import Settings from '../models/Settings.js'

// POST /api/orders -> order banao, payment method ke hisaab se response do
export async function createOrder(req, res) {
  const { items, shippingAddress, couponCode, paymentMethod } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' })
  }
  if (!['qr', 'upi', 'cod'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method' })
  }

  const settings = await Settings.findOne({ key: 'main' })
  if (paymentMethod === 'cod' && settings && !settings.codEnabled) {
    return res.status(400).json({ message: 'Cash on Delivery is currently not available' })
  }
  if ((paymentMethod === 'qr' || paymentMethod === 'upi') && settings && !settings.qrUpiEnabled) {
    return res.status(400).json({ message: 'QR/UPI payment is currently not available' })
  }

  let itemsPrice = 0
  const verifiedItems = []

  for (const it of items) {
    const product = await Product.findById(it.product)
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${it.product}` })
    }
    const cleanSize = typeof it.size === 'string' ? it.size.trim() : ''
    if (product.hasSizes) {
      if (!cleanSize) return res.status(400).json({ message: `Please select a size for ${product.name}` })
      if (!product.sizes.includes(cleanSize)) {
        return res.status(400).json({ message: `Selected size is not available for ${product.name}` })
      }
    }
    if (product.stock < it.qty) {
      return res.status(400).json({ message: `Insufficient stock for ${product.name}` })
    }
    itemsPrice += product.price * it.qty
    verifiedItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      qty: it.qty,
      size: cleanSize || undefined,
    })
  }

  const shippingPrice = itemsPrice > 499 ? 0 : 49

  let discountAmount = 0
  let appliedCouponCode
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true })
    if (!coupon) {
      return res.status(400).json({ message: 'Invalid or inactive coupon code' })
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired' })
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'This coupon has reached its usage limit' })
    }
    if (itemsPrice < coupon.minOrderValue) {
      return res.status(400).json({ message: `Minimum order value ₹${coupon.minOrderValue} required for this coupon` })
    }
    discountAmount = coupon.discountType === 'percent'
      ? (itemsPrice * coupon.discountValue) / 100
      : coupon.discountValue
    if (coupon.discountType === 'percent' && coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount)
    }
    discountAmount = Math.round(Math.min(discountAmount, itemsPrice))
    appliedCouponCode = coupon.code
    await Coupon.findOneAndUpdate({ code: appliedCouponCode }, { $inc: { usedCount: 1 } })
  }

  const totalPrice = Math.max(itemsPrice + shippingPrice - discountAmount, 0)

  const order = await Order.create({
    user: req.user._id,
    items: verifiedItems,
    shippingAddress,
    itemsPrice,
    shippingPrice,
    couponCode: appliedCouponCode,
    discountAmount,
    totalPrice,
    paymentMethod,
  })

  // Stock turant kam karte hain order place hote hi (COD ke liye zaroori hai,
  // kyunki payment baad mein hoti hai but order confirm ho chuka hota hai)
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } })
  }
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })

  const response = { orderId: order._id, totalPrice, paymentMethod }

  if (paymentMethod === 'qr' || paymentMethod === 'upi') {
    const upiId = settings?.upiId || ''
    const upiName = settings?.upiName || 'Store'
    const note = `Order ${order._id.toString().slice(-8)}`
    response.upiId = upiId
    response.upiLink =
      `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${totalPrice}&cu=INR&tn=${encodeURIComponent(note)}`
    response.qrCodeImage = settings?.qrCodeImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(response.upiLink)}`
  }

  res.status(201).json(response)
}

// PUT /api/orders/:id/claim-payment - customer bolta hai "maine pay kar diya" (qr/upi ke liye)
export async function claimPayment(req, res) {
  const { upiRef } = req.body
  const order = await Order.findById(req.params.id)

  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' })
  }

  order.paymentClaimed = true
  order.upiRef = upiRef || ''
  await order.save()

  res.json({ message: 'Payment claim received. Verification pending.', order })
}

// PUT /api/orders/:id/confirm-payment (admin) - QR/UPI payment ko manually confirm karo
export async function confirmPayment(req, res) {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (order.isPaid) {
    return res.status(400).json({ message: 'Order already marked as paid' })
  }

  order.isPaid = true
  order.paidAt = new Date()
  if (order.status === 'pending') order.status = 'processing'
  await order.save()

  res.json({ message: 'Payment confirmed', order })
}

export async function getMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(orders)
}

export async function getOrderById(req, res) {
  const order = await Order.findById(req.params.id).populate('user', 'name email')
  if (!order) return res.status(404).json({ message: 'Order not found' })

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view this order' })
  }
  res.json(order)
}

export async function getAllOrders(req, res) {
  const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 })
  res.json(orders)
}

// PUT /api/orders/:id/status (admin) - COD ka payment "delivered" hone pe apne aap paid mark hota hai
export async function updateOrderStatus(req, res) {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  order.status = req.body.status

  if (req.body.status === 'delivered' && order.paymentMethod === 'cod' && !order.isPaid) {
    order.isPaid = true
    order.paidAt = new Date()
  }

  await order.save()
  res.json(order)
}
