import crypto from 'crypto'
import Scheme from '../models/Scheme.js'
import SchemeEnrollment from '../models/SchemeEnrollment.js'
import Coupon from '../models/Coupon.js'
import { sendEmail } from '../utils/sendEmail.js'

export async function getActiveSchemes(req, res) {
  const schemes = await Scheme.find({ active: true }).sort({ depositAmount: 1 })
  res.json(schemes)
}

export async function getAllSchemes(req, res) {
  const schemes = await Scheme.find({}).sort({ createdAt: -1 })
  res.json(schemes)
}

export async function createScheme(req, res) {
  const scheme = await Scheme.create(req.body)
  res.status(201).json(scheme)
}

export async function updateScheme(req, res) {
  const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!scheme) return res.status(404).json({ message: 'Scheme not found' })
  res.json(scheme)
}

export async function deleteScheme(req, res) {
  const scheme = await Scheme.findByIdAndDelete(req.params.id)
  if (!scheme) return res.status(404).json({ message: 'Scheme not found' })
  res.json({ message: 'Scheme removed' })
}

export async function joinScheme(req, res) {
  const scheme = await Scheme.findById(req.params.id)
  if (!scheme || !scheme.active) {
    return res.status(404).json({ message: 'Scheme not available' })
  }

  const existing = await SchemeEnrollment.findOne({
    user: req.user._id,
    scheme: scheme._id,
    status: { $in: ['pending_deposit', 'active'] },
  })
  if (existing) {
    return res.status(400).json({ message: 'You have already joined this scheme' })
  }

  const coupons = []
  for (let m = 1; m <= scheme.durationMonths; m++) {
    coupons.push({
      monthNumber: m,
      baseAmount: m === scheme.durationMonths ? scheme.finalPayout : scheme.monthlyPayout,
    })
  }

  const enrollment = await SchemeEnrollment.create({
    user: req.user._id,
    scheme: scheme._id,
    coupons,
  })
  res.status(201).json(enrollment)
}

export async function claimDeposit(req, res) {
  const { upiRef } = req.body
  const enrollment = await SchemeEnrollment.findById(req.params.id)
  if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' })
  if (enrollment.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' })
  }
  if (enrollment.depositConfirmed) {
    return res.status(400).json({ message: 'Deposit already confirmed' })
  }

  enrollment.depositClaimed = true
  enrollment.depositUpiRef = upiRef || ''
  await enrollment.save()
  res.json(enrollment)
}

export async function confirmDeposit(req, res) {
  const enrollment = await SchemeEnrollment.findById(req.params.id)
  if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' })
  if (enrollment.depositConfirmed) {
    return res.status(400).json({ message: 'Already confirmed' })
  }

  enrollment.depositConfirmed = true
  enrollment.depositConfirmedAt = new Date()
  enrollment.status = 'active'
  await enrollment.save()
  res.json(enrollment)
}

function monthsElapsedSince(date) {
  const now = new Date()
  const months =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth()) + 1
  return Math.max(months, 1)
}

// PUT /api/schemes/enrollments/:id/redeem - is mahine ke (aur miss kiye hue) coupons ke liye
// real discount coupon codes generate karke email karta hai
export async function redeemCoupon(req, res) {
  const enrollment = await SchemeEnrollment.findById(req.params.id).populate('scheme').populate('user')
  if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' })
  if (enrollment.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' })
  }
  if (enrollment.status !== 'active') {
    return res.status(400).json({ message: 'Deposit not confirmed yet, or scheme not active' })
  }

  const eligibleMonths = monthsElapsedSince(enrollment.depositConfirmedAt)
  const redeemable = enrollment.coupons.filter((c) => !c.redeemed && c.monthNumber <= eligibleMonths)

  if (redeemable.length === 0) {
    return res.status(400).json({ message: 'Is mahine ka coupon abhi eligible nahi hai. Thoda wait karo.' })
  }

  const generatedCoupons = []

  for (const c of redeemable) {
    const code = `SCHEME${enrollment._id.toString().slice(-4)}M${c.monthNumber}${crypto.randomBytes(2).toString('hex').toUpperCase()}`

    await Coupon.create({
      code,
      discountType: 'flat',
      discountValue: c.baseAmount,
      minOrderValue: 0,
      usageLimit: 1,
      active: true,
    })

    c.redeemed = true
    c.redeemedAt = new Date()
    c.couponCode = code
    generatedCoupons.push({ code, amount: c.baseAmount, month: c.monthNumber })
  }

  const allRedeemed = enrollment.coupons.every((cc) => cc.redeemed)
  if (allRedeemed) enrollment.status = 'completed'

  await enrollment.save()

  // Email bhejo (agar configured hai, warna silently skip hota hai)
  const couponListHtml = generatedCoupons
    .map((g) => `<li><b>${g.code}</b> — ₹${g.amount} off (Month ${g.month})</li>`)
    .join('')
  const emailResult = await sendEmail({
    to: enrollment.user.email,
    subject: `Your Teotia Shopprix Scheme Coupon${generatedCoupons.length > 1 ? 's' : ''}`,
    html: `
      <p>Hi ${enrollment.user.name},</p>
      <p>Your <b>${enrollment.scheme.name}</b> coupon${generatedCoupons.length > 1 ? 's are' : ' is'} ready:</p>
      <ul>${couponListHtml}</ul>
      <p>Use ${generatedCoupons.length > 1 ? 'these codes' : 'this code'} at checkout on Teotia Shopprix.</p>
    `,
  })

  if (emailResult.sent) {
    redeemable.forEach((c) => { c.emailSent = true })
    await enrollment.save()
  }

  res.json({
    message: emailResult.sent
      ? `${generatedCoupons.length} coupon(s) generated aur email pe bhej diye gaye!`
      : `${generatedCoupons.length} coupon(s) generated! (Email configured nahi hai, neeche code dekh lo)`,
    coupons: generatedCoupons,
    emailSent: emailResult.sent,
    enrollment,
  })
}

export async function getMyEnrollments(req, res) {
  const enrollments = await SchemeEnrollment.find({ user: req.user._id }).populate('scheme')
  res.json(enrollments)
}

export async function getAllEnrollments(req, res) {
  const enrollments = await SchemeEnrollment.find({}).populate('scheme').populate('user', 'name email')
  res.json(enrollments)
}
