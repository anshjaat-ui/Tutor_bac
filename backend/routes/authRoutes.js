import express from 'express'
import { signup, login, getProfile, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress, getAllUsers } from '../controllers/authController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.put('/profile/address', protect, addAddress)
router.put('/profile/address/:addressId', protect, updateAddress)
router.delete('/profile/address/:addressId', protect, deleteAddress)
router.put('/profile/address/:addressId/default', protect, setDefaultAddress)
router.get('/users', protect, admin, getAllUsers)

export default router
