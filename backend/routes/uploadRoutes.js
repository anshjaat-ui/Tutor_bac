import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary
}

// POST /api/upload (admin only) - form-data field name: "image"
// Supports both images and videos uploaded directly from the admin device.
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(500).json({
      message: 'Media upload configured nahi hai. CLOUDINARY_* env vars Render mein set karo.',
    })
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Koi file nahi mili' })
  }

  const cld = getCloudinary()
  const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image'
  const folder = resourceType === 'video' ? 'teotia-shopprix-gallery-videos' : 'teotia-shopprix-products'

  const result = await new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, uploaded) => error ? reject(error) : resolve(uploaded)
    )
    stream.end(req.file.buffer)
  })

  res.json({ url: result.secure_url, resourceType })
})


// POST /api/upload/profile-avatar (authenticated customer/admin)
router.post('/profile-avatar', protect, upload.single('image'), async (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(500).json({
      message: 'Image upload configured nahi hai. CLOUDINARY_* env vars Render mein set karo.',
    })
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Koi file nahi mili' })
  }

  const cld = getCloudinary()
  const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
  const result = await cld.uploader.upload(base64, {
    folder: 'teotia-shopprix-profile-avatars',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  })
  res.json({ url: result.secure_url })
})

export default router
