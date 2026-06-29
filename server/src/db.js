import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '..', 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

const EMPTY = { users: [], pendingSignups: [], passwordResets: [] }

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY, null, 2))
}

function load() {
  ensureFile()
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8')
    return { ...EMPTY, ...JSON.parse(raw || '{}') }
  } catch {
    return structuredClone(EMPTY)
  }
}

// In-memory cache, persisted write-through with an atomic temp-file rename.
let cache = load()

function persist() {
  ensureFile()
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2))
  fs.renameSync(tmp, DB_FILE)
}

const newId = () => crypto.randomUUID()
const norm = (email) => String(email || '').trim().toLowerCase()

export const db = {
  // ── Users ──────────────────────────────────────────────
  findUserByEmail(email) {
    const e = norm(email)
    return cache.users.find((u) => u.email === e) || null
  },
  findUserById(id) {
    return cache.users.find((u) => u.id === id) || null
  },
  findUserByGoogleId(googleId) {
    return cache.users.find((u) => u.googleId === googleId) || null
  },
  createUser(data) {
    const now = new Date().toISOString()
    const user = {
      id: newId(),
      email: norm(data.email),
      name: data.name || norm(data.email).split('@')[0],
      avatar: data.avatar || null,
      passwordHash: data.passwordHash || null,
      googleId: data.googleId || null,
      providers: data.providers || [],
      emailVerified: Boolean(data.emailVerified),
      role: 'trader',
      balance: 0,
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
    }
    cache.users.push(user)
    persist()
    return user
  },
  updateUser(id, patch) {
    const u = this.findUserById(id)
    if (!u) return null
    Object.assign(u, patch, { updatedAt: new Date().toISOString() })
    persist()
    return u
  },

  // ── Pending signups (email + password awaiting OTP) ────
  findPendingByEmail(email) {
    const e = norm(email)
    return cache.pendingSignups.find((p) => p.email === e) || null
  },
  upsertPending(data) {
    const e = norm(data.email)
    const existing = cache.pendingSignups.find((p) => p.email === e)
    if (existing) {
      Object.assign(existing, data, { email: e })
      persist()
      return existing
    }
    const rec = { id: newId(), ...data, email: e, createdAt: new Date().toISOString() }
    cache.pendingSignups.push(rec)
    persist()
    return rec
  },
  deletePending(email) {
    const e = norm(email)
    cache.pendingSignups = cache.pendingSignups.filter((p) => p.email !== e)
    persist()
  },

  // ── Password resets ────────────────────────────────────
  createReset(data) {
    const rec = { id: newId(), used: false, ...data, createdAt: new Date().toISOString() }
    cache.passwordResets.push(rec)
    persist()
    return rec
  },
  findValidResetByHash(tokenHash) {
    const now = Date.now()
    return (
      cache.passwordResets.find(
        (r) => r.tokenHash === tokenHash && !r.used && new Date(r.expires).getTime() > now,
      ) || null
    )
  },
  consumeReset(id) {
    const r = cache.passwordResets.find((x) => x.id === id)
    if (r) {
      r.used = true
      persist()
    }
  },
}
