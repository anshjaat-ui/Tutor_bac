import express from 'express'
import {
  getActiveSchemes,
  getAllSchemes,
  createScheme,
  updateScheme,
  deleteScheme,
  joinScheme,
  claimDeposit,
  confirmDeposit,
  redeemCoupon,
  getMyEnrollments,
  getAllEnrollments,
} from '../controllers/schemeController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', getActiveSchemes)
router.get('/all', protect, admin, getAllSchemes)
router.post('/', protect, admin, createScheme)
router.put('/:id', protect, admin, updateScheme)
router.delete('/:id', protect, admin, deleteScheme)

router.post('/:id/join', protect, joinScheme)
router.get('/my-enrollments', protect, getMyEnrollments)
router.get('/enrollments/all', protect, admin, getAllEnrollments)
router.put('/enrollments/:id/claim-deposit', protect, claimDeposit)
router.put('/enrollments/:id/confirm-deposit', protect, admin, confirmDeposit)
router.put('/enrollments/:id/redeem', protect, redeemCoupon)

export default router
