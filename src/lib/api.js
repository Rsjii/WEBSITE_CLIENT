// Thin fetch wrapper. In dev, calls go to /api/* and Vite proxies them to the
// backend (same-origin → session cookie works). Override with VITE_API_URL in prod.
const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    /* no body */
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    err.code = data?.code
    err.data = data
    throw err
  }
  return data
}

export const api = {
  config: () => request('/config'),

  me: () => request('/auth/me'),
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  verifyOtp: (body) => request('/auth/verify-otp', { method: 'POST', body }),
  resendOtp: (body) => request('/auth/resend-otp', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  google: (body) => request('/auth/google', { method: 'POST', body }),
  forgot: (body) => request('/auth/forgot-password', { method: 'POST', body }),
  reset: (body) => request('/auth/reset-password', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
}
