import { OAuth2Client } from 'google-auth-library'
import { config } from '../config.js'

const client = config.googleClientId ? new OAuth2Client(config.googleClientId) : null

// Verifies a Google Identity Services ID token (the "credential" the
// frontend button returns) and extracts a trusted profile.
export async function verifyGoogleCredential(credential) {
  if (!client) throw new Error('Google sign-in is not configured on the server.')
  const ticket = await client.verifyIdToken({ idToken: credential, audience: config.googleClientId })
  const p = ticket.getPayload()
  if (!p?.email) throw new Error('Google account has no email.')
  return {
    googleId: p.sub,
    email: p.email,
    emailVerified: Boolean(p.email_verified),
    name: p.name || p.email.split('@')[0],
    avatar: p.picture || null,
  }
}
