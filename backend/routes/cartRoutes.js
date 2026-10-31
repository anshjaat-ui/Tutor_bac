import express from 'express'
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)
router.get('/', getCart)
router.post('/', addToCart)
router.put('/:productId', updateCartItem)
router.delete('/:productId', removeCartItem)

export default router
