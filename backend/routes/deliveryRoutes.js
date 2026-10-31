import express from 'express'
import { checkDelivery } from '../controllers/deliveryController.js'

const router = express.Router()

router.post('/', checkDelivery)

export default router
