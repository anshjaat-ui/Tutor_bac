import express from 'express'
import {
  getProducts,
  getSuggestions,
  getProductById,
  getTrendingProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
} from '../controllers/productController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', getProducts)
router.get('/suggestions', getSuggestions) // /:id se pehle honi zaroori hai
router.get('/trending', getTrendingProducts)
router.get('/:id', getProductById)
router.post('/', protect, admin, createProduct)
router.put('/:id', protect, admin, updateProduct)
router.delete('/:id', protect, admin, deleteProduct)
router.post('/:id/reviews', protect, addReview)

export default router
