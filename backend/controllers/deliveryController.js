import Settings from '../models/Settings.js'

// Haversine formula - do lat/lng points ke beech ki real-world distance (km mein)
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// POST /api/check-delivery { lat, lng }
export async function checkDelivery(req, res) {
  const { lat, lng } = req.body
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ message: 'Location (lat, lng) required' })
  }

  const settings = await Settings.findOne({ key: 'main' })
  if (!settings || !settings.deliveryEnabled) {
    return res.json({ allowed: true, distanceKm: null, message: 'Delivery restriction disabled' })
  }

  const distance = distanceKm(settings.baseLat, settings.baseLng, lat, lng)
  const allowed = distance <= settings.radiusKm

  res.json({
    allowed,
    distanceKm: Math.round(distance * 10) / 10,
    radiusKm: settings.radiusKm,
    message: allowed
      ? 'Delivery available at this location'
      : `Sorry, we only deliver within ${settings.radiusKm} km of our store.`,
  })
}
