import express from 'express'
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/couponController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/validate', protect, validateCoupon)
router.get('/', protect, admin, getAllCoupons)
router.post('/', protect, admin, createCoupon)
router.put('/:id', protect, admin, updateCoupon)
router.delete('/:id', protect, admin, deleteCoupon)

export default router
