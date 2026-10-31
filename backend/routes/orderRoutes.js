import express from 'express'
import {
  createOrder,
  claimPayment,
  confirmPayment,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)
router.post('/', createOrder)
router.get('/my', getMyOrders)
router.get('/', admin, getAllOrders)
router.get('/:id', getOrderById)
router.put('/:id/claim-payment', claimPayment)
router.put('/:id/confirm-payment', admin, confirmPayment)
router.put('/:id/status', admin, updateOrderStatus)

export default router
