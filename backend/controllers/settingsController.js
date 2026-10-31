import Settings from '../models/Settings.js'

async function getOrCreate() {
  let settings = await Settings.findOne({ key: 'main' })
  if (!settings) {
    settings = await Settings.create({ key: 'main' })
  }
  return settings
}

// GET /api/settings - public (payment/delivery info customer ko bhi chahiye checkout pe)
export async function getSettings(req, res) {
  const settings = await getOrCreate()
  res.json(settings)
}

// PUT /api/settings (admin only) - kisi bhi field ko update kar sakta hai
export async function updateSettings(req, res) {
  const settings = await getOrCreate()
  Object.keys(req.body).forEach((key) => {
    if (key !== 'key' && key !== '_id') {
      settings[key] = req.body[key]
    }
  })
  await settings.save()
  res.json(settings)
}
