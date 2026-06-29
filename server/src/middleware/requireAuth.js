import { config } from '../config.js'
import { verifySession } from '../utils/crypto.js'
import { db } from '../db.js'
import { publicUser } from '../utils/publicUser.js'

// Reads the session cookie, verifies it, and attaches req.user (sanitized).
export function requireAuth(req, res, next) {
  const token = req.cookies?.[config.cookieName]
  const payload = token && verifySession(token)
  if (!payload) return res.status(401).json({ error: 'Not authenticated.' })

  const user = db.findUserById(payload.sub)
  if (!user) return res.status(401).json({ error: 'Session no longer valid.' })

  req.user = user
  req.publicUser = publicUser(user)
  next()
}
