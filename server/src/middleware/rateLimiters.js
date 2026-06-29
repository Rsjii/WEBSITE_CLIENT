import rateLimit from 'express-rate-limit'

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  })

// Sensitive credential endpoints — tighter limits to blunt brute force.
export const authLimiter = make(15 * 60 * 1000, 30, 'Too many attempts. Please try again in a few minutes.')

// OTP / email sending — protect the mail provider and inbox.
export const otpLimiter = make(15 * 60 * 1000, 12, 'Too many code requests. Please wait a while and try again.')
