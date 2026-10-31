import express from 'express'
import { getGallery, getAllGallery, createGallery, updateGallery, deleteGallery } from '../controllers/galleryController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/all/list', protect, admin, getAllGallery)
router.get('/:category', getGallery)
router.post('/', protect, admin, createGallery)
router.put('/:id', protect, admin, updateGallery)
router.delete('/:id', protect, admin, deleteGallery)

export default router
