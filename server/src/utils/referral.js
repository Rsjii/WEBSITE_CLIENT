import crypto from 'node:crypto'

// No 0/O/1/I — avoids codes that are ambiguous to read or type back in.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateReferralCode(len = 8) {
  let code = ''
  for (let i = 0; i < len; i++) code += ALPHABET[crypto.randomInt(ALPHABET.length)]
  return code
}
