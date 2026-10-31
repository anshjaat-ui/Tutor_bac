import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

// POST /api/auth/signup
export async function signup(req, res) {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill all fields' })
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email' })
  }

  const user = await User.create({ name, email, password })

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    token: generateToken(user._id),
  })
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    token: generateToken(user._id),
  })
}

// GET /api/auth/profile
export async function getProfile(req, res) {
  const user = await User.findById(req.user._id).select('-password')
  res.json(user)
}

// PUT /api/auth/profile
export async function updateProfile(req, res) {
  const user = await User.findById(req.user._id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  const { name, email, avatar } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' })
  }

  if (email && email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } })
    if (exists) return res.status(400).json({ message: 'Email already in use' })
    user.email = email.toLowerCase().trim()
  }

  user.name = name.trim()
  if (avatar !== undefined) user.avatar = String(avatar).trim()
  await user.save()

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    createdAt: user.createdAt,
    addresses: user.addresses,
  })
}

// PUT /api/auth/profile/address
export async function addAddress(req, res) {
  const user = await User.findById(req.user._id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const shouldBeDefault = Boolean(req.body.isDefault) || user.addresses.length === 0
  if (shouldBeDefault) user.addresses.forEach((item) => { item.isDefault = false })
  user.addresses.push({ ...req.body, isDefault: shouldBeDefault })
  await user.save()
  res.status(201).json(user.addresses)
}

// PUT /api/auth/profile/address/:addressId
export async function updateAddress(req, res) {
  const user = await User.findById(req.user._id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const address = user.addresses.id(req.params.addressId)
  if (!address) return res.status(404).json({ message: 'Address not found' })

  const allowed = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'pincode']
  for (const key of allowed) {
    if (req.body[key] !== undefined) address[key] = String(req.body[key]).trim()
  }
  if (req.body.isDefault === true) {
    user.addresses.forEach((item) => { item.isDefault = item._id.equals(address._id) })
  } else if (req.body.isDefault === false) {
    address.isDefault = false
  }
  await user.save()
  res.json(user.addresses)
}

// DELETE /api/auth/profile/address/:addressId
export async function deleteAddress(req, res) {
  const user = await User.findById(req.user._id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const address = user.addresses.id(req.params.addressId)
  if (!address) return res.status(404).json({ message: 'Address not found' })
  const wasDefault = address.isDefault
  address.deleteOne()
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true
  await user.save()
  res.json(user.addresses)
}

// PUT /api/auth/profile/address/:addressId/default
export async function setDefaultAddress(req, res) {
  const user = await User.findById(req.user._id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const address = user.addresses.id(req.params.addressId)
  if (!address) return res.status(404).json({ message: 'Address not found' })
  user.addresses.forEach((item) => { item.isDefault = item._id.equals(address._id) })
  await user.save()
  res.json(user.addresses)
}

// GET /api/auth/users (admin only)
export async function getAllUsers(req, res) {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 })
  res.json(users)
}
