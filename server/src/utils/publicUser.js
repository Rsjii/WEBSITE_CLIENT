// Strips secrets before a user object is ever sent to the client.
export function publicUser(u) {
  if (!u) return null
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    providers: u.providers || [],
    emailVerified: Boolean(u.emailVerified),
    role: u.role || 'trader',
    balance: u.balance ?? 0,
    currency: u.currency || 'USD',
    hasPassword: Boolean(u.passwordHash),
    createdAt: u.createdAt,
  }
}
