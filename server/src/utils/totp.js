// RFC 4226 (HOTP) / RFC 6238 (TOTP) — implemented on node:crypto only, no dependency.
import crypto from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateSecret(bytesLen = 20) {
  return base32Encode(crypto.randomBytes(bytesLen))
}

function base32Encode(buf) {
  let bits = ''
  for (const b of buf) bits += b.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)]
  const rem = bits.length % 5
  if (rem) out += BASE32_ALPHABET[parseInt(bits.slice(-rem).padEnd(5, '0'), 2)]
  return out
}

function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch)
    if (idx === -1) continue
    bits += idx.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

function hotp(secret, counter, digits = 6) {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 10 ** digits).padStart(digits, '0')
}

export function totp(secret, { step = 30, digits = 6, at = Date.now(), counterOffset = 0 } = {}) {
  const counter = Math.floor(at / 1000 / step) + counterOffset
  return hotp(secret, counter, digits)
}

// Accepts a code from one step before/after "now" to tolerate clock drift.
export function verifyTotp(secret, token, { window = 1, step = 30, digits = 6 } = {}) {
  if (!secret || !token) return false
  const clean = String(token).trim()
  if (!/^\d{6}$/.test(clean)) return false
  for (let w = -window; w <= window; w++) {
    if (totp(secret, { step, digits, counterOffset: w }) === clean) return true
  }
  return false
}

export function otpauthUrl(secret, email, issuer = 'AuraTrade') {
  const label = encodeURIComponent(`${issuer}:${email}`)
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' })
  return `otpauth://totp/${label}?${params.toString()}`
}
