import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

// ── Passwords ────────────────────────────────────────────
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12)
}
export async function verifyPassword(plain, hash) {
  if (!hash) return false
  return bcrypt.compare(plain, hash)
}

// ── OTP codes ────────────────────────────────────────────
export function generateOtp() {
  // 6-digit numeric code, zero-padded
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

// High-entropy URL-safe token (for password-reset links)
export function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Deterministic hash for short-lived secrets (OTP / reset tokens).
// Peppered with the JWT secret; compared with a constant-time check.
export function hashValue(value) {
  return crypto.createHmac('sha256', config.jwtSecret).update(String(value)).digest('hex')
}
export function safeEqualHash(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

// ── Session JWT ──────────────────────────────────────────
export function signSession(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}
export function verifySession(token) {
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch {
    return null
  }
}

// Short-lived token issued between "password/Google verified" and "2FA code
// verified" — never a full session, just proof of the first factor.
export function signTwoFactorChallenge(user) {
  return jwt.sign({ sub: user.id, purpose: '2fa' }, config.jwtSecret, { expiresIn: '5m' })
}
export function verifyTwoFactorChallenge(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    return payload.purpose === '2fa' ? payload : null
  } catch {
    return null
  }
}

// ── Cookie helpers ───────────────────────────────────────
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7 // 7 days

export function setSessionCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}
export function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, { path: '/' })
}
