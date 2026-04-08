const SECRET = process.env.AUTH_SECRET || 'rms_dev_secret_2024'

function createToken(userId, role) {
  const payload = `${userId}:${role}:${SECRET}`
  return Buffer.from(payload).toString('base64')
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const parts = decoded.split(':')
    if (parts.length < 3) return null
    const secret = parts.slice(2).join(':')
    if (secret !== SECRET) return null
    return { userId: parseInt(parts[0], 10), role: parts[1] }
  } catch {
    return null
  }
}

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token']
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' })
  const user = verifyToken(token)
  if (!user) return res.status(401).json({ success: false, message: 'Invalid or expired session' })
  req.authUser = user
  next()
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-auth-token']
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' })
  const user = verifyToken(token)
  if (!user) return res.status(401).json({ success: false, message: 'Invalid or expired session' })
  if (user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required' })
  req.authUser = user
  next()
}

// OWNER only — admins cannot add restaurants
function requireOwner(req, res, next) {
  const token = req.headers['x-auth-token']
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' })
  const user = verifyToken(token)
  if (!user) return res.status(401).json({ success: false, message: 'Invalid or expired session' })
  if (user.role !== 'OWNER') return res.status(403).json({ success: false, message: 'Only restaurant owners can add restaurants' })
  req.authUser = user
  next()
}

module.exports = { createToken, verifyToken, requireAuth, requireAdmin, requireOwner }
