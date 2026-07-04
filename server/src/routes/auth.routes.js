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
  signTwoFactorChallenge,
  verifyTwoFactorChallenge,
} from '../utils/crypto.js'
import { generateSecret, otpauthUrl, verifyTotp } from '../utils/totp.js'
import { verifyGoogleCredential } from '../utils/google.js'
import { sendOtpEmail, sendResetEmail } from '../mailer.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { authLimiter, otpLimiter } from '../middleware/rateLimiters.js'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmail = (e) => typeof e === 'string' && EMAIL_RE.test(e.trim())

function passwordIssue(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must include a letter and a number.'
  if (pw.length > 200) return 'Password is too long.'
  return null
}
const cleanName = (n) => String(n || '').trim().slice(0, 60)

const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Issues a full session — unless the account has 2FA enabled, in which case
// it hands back a short-lived challenge token instead of a session cookie.
function completeLogin(res, user) {
  if (user.twoFactorEnabled) {
    return res.json({ twoFactorRequired: true, tempToken: signTwoFactorChallenge(user) })
  }
  setSessionCookie(res, signSession(user))
  return res.json({ user: publicUser(user) })
}

// ── POST /signup ─────────────────────────────────────────
router.post(
  '/signup',
  otpLimiter,
  a(async (req, res) => {
    const { name, email, password, acceptTerms, referralCode } = req.body || {}

    if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
    const pwIssue = passwordIssue(password)
    if (pwIssue) return res.status(400).json({ error: pwIssue })
    if (acceptTerms !== true)
      return res.status(400).json({ error: 'You must accept the Terms & Conditions to continue.' })

    const existing = await db.findUserByEmail(email)
    if (existing?.passwordHash)
      return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.', code: 'EXISTS' })

    const passwordHash = await hashPassword(password)
    const code = generateOtp()

    // A bad/unknown referral code shouldn't block signup — just skip it silently.
    let referredBy = null
    if (referralCode) {
      const referrer = await db.findUserByReferralCode(referralCode)
      if (referrer) referredBy = referrer.id
    }

    await db.upsertPending({
      email,
      name: cleanName(name) || undefined,
      passwordHash,
      otpHash: hashValue(code),
      otpExpires: new Date(Date.now() + config.otpTtlMin * 60_000).toISOString(),
      attempts: 0,
      lastSentAt: new Date().toISOString(),
      referredBy,
    })

    const mail = await sendOtpEmail(email, code)
    res.json({
      ok: true,
      email: email.trim().toLowerCase(),
      linking: Boolean(existing),
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

    const pending = await db.findPendingByEmail(email)
    if (!pending)
      return res.status(400).json({ error: 'No pending verification found. Please sign up again.', code: 'NO_PENDING' })

    if (new Date(pending.otpExpires).getTime() < Date.now()) {
      await db.deletePending(email)
      return res.status(400).json({ error: 'Your code expired. Please request a new one.', code: 'EXPIRED' })
    }
    if ((pending.attempts || 0) >= config.otpMaxAttempts)
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.', code: 'LOCKED' })

    if (!safeEqualHash(pending.otpHash, hashValue(String(code).trim()))) {
      await db.upsertPending({ ...pending, attempts: (pending.attempts || 0) + 1 })
      const left = Math.max(0, config.otpMaxAttempts - (pending.attempts + 1))
      return res.status(400).json({ error: `Incorrect code.${left ? ` ${left} attempt(s) left.` : ''}`, code: 'BAD_CODE' })
    }

    const existing = await db.findUserByEmail(email)
    let user
    if (existing) {
      user = await db.updateUser(existing.id, {
        passwordHash: pending.passwordHash,
        emailVerified: true,
        name: existing.name || pending.name,
        providers: Array.from(new Set([...(existing.providers || []), 'password'])),
      })
    } else {
      user = await db.createUser({
        email,
        name: pending.name,
        passwordHash: pending.passwordHash,
        emailVerified: true,
        providers: ['password'],
        referredById: pending.referredBy,
      })
    }
    await db.deletePending(email)
    return completeLogin(res, user)
  }),
)

// ── POST /resend-otp ─────────────────────────────────────
router.post(
  '/resend-otp',
  otpLimiter,
  a(async (req, res) => {
    const { email } = req.body || {}
    if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })

    const pending = await db.findPendingByEmail(email)
    if (!pending)
      return res.status(400).json({ error: 'Nothing to resend. Please sign up again.', code: 'NO_PENDING' })

    const since = (Date.now() - new Date(pending.lastSentAt).getTime()) / 1000
    if (since < config.otpResendCooldownSec) {
      const retryAfter = Math.ceil(config.otpResendCooldownSec - since)
      return res.status(429).json({ error: `Please wait ${retryAfter}s before requesting another code.`, retryAfter })
    }

    const code = generateOtp()
    await db.upsertPending({
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

    const user = await db.findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' })

    if (!user.passwordHash)
      return res.status(409).json({
        error: 'This account uses Google sign-in. Continue with Google, or reset your password to set one.',
        code: 'USE_GOOGLE',
      })

    if (!(await verifyPassword(password, user.passwordHash)))
      return res.status(401).json({ error: 'Invalid email or password.' })

    return completeLogin(res, user)
  }),
)

// ── POST /google ─────────────────────────────────────────
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

    let user = await db.findUserByGoogleId(profile.googleId)

    if (!user) {
      const byEmail = await db.findUserByEmail(profile.email)
      if (byEmail) {
        user = await db.updateUser(byEmail.id, {
          googleId: profile.googleId,
          emailVerified: true,
          avatar: byEmail.avatar || profile.avatar,
          providers: Array.from(new Set([...(byEmail.providers || []), 'google'])),
        })
      }
    }

    if (!user) {
      user = await db.createUser({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        googleId: profile.googleId,
        emailVerified: true,
        providers: ['google'],
      })
    }

    await db.deletePending(profile.email)
    return completeLogin(res, user)
  }),
)

// ── POST /forgot-password ────────────────────────────────
router.post(
  '/forgot-password',
  otpLimiter,
  a(async (req, res) => {
    const { email } = req.body || {}
    if (!isEmail(email)) return res.json({ ok: true })

    const user = await db.findUserByEmail(email)
    if (user) {
      const token = generateToken()
      await db.createReset({
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

    const rec = await db.findValidResetByHash(hashValue(token))
    if (!rec) return res.status(400).json({ error: 'This reset link is invalid or has expired.', code: 'BAD_TOKEN' })

    const user = await db.findUserById(rec.userId)
    if (!user) return res.status(400).json({ error: 'Account not found.' })

    const passwordHash = await hashPassword(password)
    await db.updateUser(user.id, {
      passwordHash,
      emailVerified: true,
      providers: Array.from(new Set([...(user.providers || []), 'password'])),
    })
    await db.consumeReset(rec.id)
    return completeLogin(res, await db.findUserById(user.id))
  }),
)

// ── 2FA: setup / enable / disable (account settings) ─────
router.post(
  '/2fa/setup',
  requireAuth,
  a(async (req, res) => {
    const secret = generateSecret()
    await db.updateUser(req.user.id, { twoFactorPendingSecret: secret })
    res.json({ secret, otpauthUrl: otpauthUrl(secret, req.user.email) })
  }),
)

router.post(
  '/2fa/enable',
  requireAuth,
  a(async (req, res) => {
    const { code } = req.body || {}
    if (!req.user.twoFactorPendingSecret) return res.status(400).json({ error: 'Start setup first.' })
    if (!verifyTotp(req.user.twoFactorPendingSecret, code))
      return res.status(400).json({ error: 'Incorrect code. Check your authenticator app and try again.' })

    await db.updateUser(req.user.id, {
      twoFactorSecret: req.user.twoFactorPendingSecret,
      twoFactorPendingSecret: null,
      twoFactorEnabled: true,
    })
    res.json({ ok: true })
  }),
)

router.post(
  '/2fa/disable',
  requireAuth,
  a(async (req, res) => {
    const { code } = req.body || {}
    if (!req.user.twoFactorEnabled) return res.status(400).json({ error: '2FA is not enabled.' })
    if (!verifyTotp(req.user.twoFactorSecret, code)) return res.status(400).json({ error: 'Incorrect code.' })

    await db.updateUser(req.user.id, { twoFactorSecret: null, twoFactorPendingSecret: null, twoFactorEnabled: false })
    res.json({ ok: true })
  }),
)

// ── POST /2fa/verify-login ────────────────────────────────
// Completes a login that completeLogin() paused for a second factor.
router.post(
  '/2fa/verify-login',
  authLimiter,
  a(async (req, res) => {
    const { tempToken, code } = req.body || {}
    const payload = tempToken && verifyTwoFactorChallenge(tempToken)
    if (!payload) return res.status(401).json({ error: 'This verification step expired. Please sign in again.', code: 'BAD_CHALLENGE' })

    const user = await db.findUserById(payload.sub)
    if (!user || !user.twoFactorEnabled) return res.status(401).json({ error: 'Account not found.', code: 'BAD_CHALLENGE' })
    if (!verifyTotp(user.twoFactorSecret, code)) return res.status(400).json({ error: 'Incorrect code.' })

    setSessionCookie(res, signSession(user))
    res.json({ user: publicUser(user) })
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
