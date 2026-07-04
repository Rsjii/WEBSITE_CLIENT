import { Router } from 'express'
import { sendContactEmail } from '../mailer.js'
import { contactLimiter } from '../middleware/rateLimiters.js'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmail = (e) => typeof e === 'string' && EMAIL_RE.test(e.trim())

const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// ── POST / ────────────────────────────────────────────────
// Public "Contact Us" form on the landing page.
router.post(
  '/',
  contactLimiter,
  a(async (req, res) => {
    const { name, email, message } = req.body || {}
    const cleanName = String(name || '').trim().slice(0, 100)
    const cleanMessage = String(message || '').trim().slice(0, 4000)

    if (!cleanName) return res.status(400).json({ error: 'Please enter your name.' })
    if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
    if (!cleanMessage) return res.status(400).json({ error: 'Please enter a message.' })

    await sendContactEmail({ name: cleanName, email: email.trim().toLowerCase(), message: cleanMessage })
    res.json({ ok: true })
  }),
)

export default router
