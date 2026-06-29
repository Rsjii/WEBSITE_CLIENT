import { Router } from 'express'
import { config } from '../config.js'
import { db } from '../db.js'
import { publicUser } from '../utils/publicUser.js'
import {
  hashPassword,
  verifyPassword,
  generateOtp,
  generateToken,
  hashValue,
  safeEqualHash,
  signSession,
  setSessionCookie,
  clearSessionCookie,
} from '../utils/crypto.js'
import { verifyGoogleCredential } from '../utils/google.js'
import { sendOtpEmail, sendResetEmail } from '../mailer.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { authLimiter, otpLimiter } from '../middleware/rateLimiters.js'

const router = Router()

// ── Validation helpers ───────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmail = (e) => typeof e === 'string' && EMAIL_RE.test(e.trim())

function passwordIssue(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must include a letter and a number.'
  if (pw.length > 200) return 'Password is too long.'
  return null
}
const cleanName = (n) => String(n || '').trim().slice(0, 60)

// Wrap async handlers so thrown errors hit the error middleware.
const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function loginUser(res, user) {
  setSessionCookie(res, signSession(user))
  return res.json({ user: publicUser(user) })
}

// ── POST /signup  (email + password → OTP) ───────────────
router.post(
  '/signup',
  otpLimiter,
  a(async (req, res) => {
    const { name, email, password, acceptTerms } = req.body || {}

    if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
    const pwIssue = passwordIssue(password)
    if (pwIssue) return res.status(400).json({ error: pwIssue })
    if (acceptTerms !== true)
      return res.status(400).json({ error: 'You must accept the Terms & Conditions to continue.' })

    const existing = db.findUserByEmail(email)
    // A full account (already has a password) — don't let them re-register.
    if (existing?.passwordHash)
      return res
        .status(409)
        .json({ error: 'An account with this email already exists. Please log in instead.', code: 'EXISTS' })

    // Google-only account adding a password is allowed — it links on verify.
    const passwordHash = await hashPassword(password)
    const code = generateOtp()

    db.upsertPending({
      email,
      name: cleanName(name) || undefined,
      passwordHash,
      otpHash: hashValue(code),
      otpExpires: new Date(Date.now() + config.otpTtlMin * 60_000).toISOString(),
      attempts: 0,
      lastSentAt: new Date().toISOString(),
    })

    const mail = await sendOtpEmail(email, code)
    res.json({
      ok: true,
      email: email.trim().toLowerCase(),
      linking: Boolean(existing), // google account gaining a password
      devMode: Boolean(mail.dev),
    })
  }),
)

// ── POST /verify-otp ─────────────────────────────────────
router.post(
  '/verify-otp',
  otpLimiter,
  a(async (req, res) => {
    const { email, code } = req.body || {}
    if (!isEmail(email) || !code) return res.status(400).json({ error: 'Email and code are required.' })

    const pending = db.findPendingByEmail(email)
    if (!pending)
      return res.status(400).json({ error: 'No pending verification found. Please sign up again.', code: 'NO_PENDING' })

    if (new Date(pending.otpExpires).getTime() < Date.now()) {
      db.deletePending(email)
      return res.status(400).json({ error: 'Your code expired. Please request a new one.', code: 'EXPIRED' })
    }
    if ((pending.attempts || 0) >= config.otpMaxAttempts)
      return res
        .status(429)
        .json({ error: 'Too many incorrect attempts. Please request a new code.', code: 'LOCKED' })

    if (!safeEqualHash(pending.otpHash, hashValue(String(code).trim()))) {
      db.upsertPending({ ...pending, attempts: (pending.attempts || 0) + 1 })
      const left = Math.max(0, config.otpMaxAttempts - (pending.attempts + 1))
      return res.status(400).json({ error: `Incorrect code.${left ? ` ${left} attempt(s) left.` : ''}`, code: 'BAD_CODE' })
    }

    // Success — create the user, or link a password to an existing Google account.
    const existing = db.findUserByEmail(email)
    let user
    if (existing) {
      user = db.updateUser(existing.id, {
        passwordHash: pending.passwordHash,
        emailVerified: true,
        name: existing.name || pending.name,
        providers: Array.from(new Set([...(existing.providers || []), 'password'])),
      })
    } else {
      user = db.createUser({
        email,
        name: pending.name,
        passwordHash: pending.passwordHash,
        emailVerified: true,
        providers: ['password'],
      })
    }
    db.deletePending(email)
    return loginUser(res, user)
  }),
)

// ── POST /resend-otp ─────────────────────────────────────
router.post(
  '/resend-otp',
  otpLimiter,
  a(async (req, res) => {
    const { email } = req.body || {}
    if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })

    const pending = db.findPendingByEmail(email)
    if (!pending)
      return res.status(400).json({ error: 'Nothing to resend. Please sign up again.', code: 'NO_PENDING' })

    const since = (Date.now() - new Date(pending.lastSentAt).getTime()) / 1000
    if (since < config.otpResendCooldownSec) {
      const retryAfter = Math.ceil(config.otpResendCooldownSec - since)
      return res.status(429).json({ error: `Please wait ${retryAfter}s before requesting another code.`, retryAfter })
    }

    const code = generateOtp()
    db.upsertPending({
      ...pending,
      otpHash: hashValue(code),
      otpExpires: new Date(Date.now() + config.otpTtlMin * 60_000).toISOString(),
      attempts: 0,
      lastSentAt: new Date().toISOString(),
    })
    const mail = await sendOtpEmail(email, code)
    res.json({ ok: true, devMode: Boolean(mail.dev) })
  }),
)

// ── POST /login ──────────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  a(async (req, res) => {
    const { email, password } = req.body || {}
    if (!isEmail(email) || !password) return res.status(400).json({ error: 'Email and password are required.' })

    const user = db.findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' })

    // Account exists but was created via Google and never set a password.
    if (!user.passwordHash)
      return res.status(409).json({
        error: 'This account uses Google sign-in. Continue with Google, or reset your password to set one.',
        code: 'USE_GOOGLE',
      })

    if (!(await verifyPassword(password, user.passwordHash)))
      return res.status(401).json({ error: 'Invalid email or password.' })

    return loginUser(res, user)
  }),
)

// ── POST /google  (Google Identity Services credential) ──
router.post(
  '/google',
  authLimiter,
  a(async (req, res) => {
    const { credential } = req.body || {}
    if (!credential) return res.status(400).json({ error: 'Missing Google credential.' })

    let profile
    try {
      profile = await verifyGoogleCredential(credential)
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Could not verify Google sign-in.' })
    }

    // 1) Known Google identity → log in.
    let user = db.findUserByGoogleId(profile.googleId)

    // 2) Same email already registered (e.g. via password) → link Google to it.
    if (!user) {
      const byEmail = db.findUserByEmail(profile.email)
      if (byEmail) {
        user = db.updateUser(byEmail.id, {
          googleId: profile.googleId,
          emailVerified: true,
          avatar: byEmail.avatar || profile.avatar,
          providers: Array.from(new Set([...(byEmail.providers || []), 'google'])),
        })
      }
    }

    // 3) Brand new user.
    if (!user) {
      user = db.createUser({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        googleId: profile.googleId,
        emailVerified: true,
        providers: ['google'],
      })
    }

    db.deletePending(profile.email) // any half-finished email signup is now moot
    return loginUser(res, user)
  }),
)

// ── POST /forgot-password ────────────────────────────────
router.post(
  '/forgot-password',
  otpLimiter,
  a(async (req, res) => {
    const { email } = req.body || {}
    // Always respond ok — never reveal whether an email is registered.
    if (!isEmail(email)) return res.json({ ok: true })

    const user = db.findUserByEmail(email)
    if (user) {
      const token = generateToken()
      db.createReset({
        userId: user.id,
        tokenHash: hashValue(token),
        expires: new Date(Date.now() + config.resetTtlMin * 60_000).toISOString(),
      })
      const link = `${config.appUrl}/reset-password?token=${token}`
      await sendResetEmail(user.email, link)
    }
    res.json({ ok: true })
  }),
)

// ── POST /reset-password ─────────────────────────────────
router.post(
  '/reset-password',
  authLimiter,
  a(async (req, res) => {
    const { token, password } = req.body || {}
    if (!token) return res.status(400).json({ error: 'Missing reset token.' })
    const pwIssue = passwordIssue(password)
    if (pwIssue) return res.status(400).json({ error: pwIssue })

    const rec = db.findValidResetByHash(hashValue(token))
    if (!rec) return res.status(400).json({ error: 'This reset link is invalid or has expired.', code: 'BAD_TOKEN' })

    const user = db.findUserById(rec.userId)
    if (!user) return res.status(400).json({ error: 'Account not found.' })

    const passwordHash = await hashPassword(password)
    db.updateUser(user.id, {
      passwordHash,
      emailVerified: true,
      providers: Array.from(new Set([...(user.providers || []), 'password'])),
    })
    db.consumeReset(rec.id)
    return loginUser(res, db.findUserById(user.id))
  }),
)

// ── GET /me ──────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => res.json({ user: req.publicUser }))

// ── POST /logout ─────────────────────────────────────────
router.post('/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

export default router
