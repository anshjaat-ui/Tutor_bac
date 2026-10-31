import Coupon from '../models/Coupon.js'

// GET /api/coupons (admin only) - saare coupons
export async function getAllCoupons(req, res) {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 })
  res.json(coupons)
}

// POST /api/coupons (admin only)
export async function createCoupon(req, res) {
  const coupon = await Coupon.create(req.body)
  res.status(201).json(coupon)
}

// PUT /api/coupons/:id (admin only)
export async function updateCoupon(req, res) {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' })
  res.json(coupon)
}

// DELETE /api/coupons/:id (admin only)
export async function deleteCoupon(req, res) {
  const coupon = await Coupon.findByIdAndDelete(req.params.id)
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' })
  res.json({ message: 'Coupon removed' })
}

// POST /api/coupons/validate - customer checkout pe coupon check karta hai
export async function validateCoupon(req, res) {
  const { code, orderValue } = req.body
  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), active: true })

  if (!coupon) {
    return res.status(404).json({ message: 'Invalid or expired coupon code' })
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return res.status(400).json({ message: 'This coupon has expired' })
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ message: 'This coupon has reached its usage limit' })
  }
  if (orderValue < coupon.minOrderValue) {
    return res.status(400).json({ message: `Minimum order value ₹${coupon.minOrderValue} required for this coupon` })
  }

  let discount = coupon.discountType === 'percent'
    ? (orderValue * coupon.discountValue) / 100
    : coupon.discountValue

  if (coupon.discountType === 'percent' && coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount)
  }
  discount = Math.min(discount, orderValue) // discount order value se zyada na ho

  res.json({
    code: coupon.code,
    discount: Math.round(discount),
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  })
}
