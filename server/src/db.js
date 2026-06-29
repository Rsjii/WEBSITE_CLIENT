import pg from 'pg'
import { config } from './config.js'

export const pool = new pg.Pool({ connectionString: config.databaseUrl })

const norm = (email) => String(email || '').trim().toLowerCase()

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    passwordHash: row.password_hash,
    googleId: row.google_id,
    providers: row.providers || [],
    emailVerified: row.email_verified,
    role: row.role,
    balance: Number(row.balance),
    currency: row.currency,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  }
}

function mapPending(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    otpHash: row.otp_hash,
    otpExpires: row.otp_expires?.toISOString(),
    attempts: row.attempts,
    lastSentAt: row.last_sent_at?.toISOString(),
    createdAt: row.created_at?.toISOString(),
  }
}

function mapReset(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expires: row.expires?.toISOString(),
    used: row.used,
    createdAt: row.created_at?.toISOString(),
  }
}

export const db = {
  // ── Users ──────────────────────────────────────────────
  async findUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [norm(email)])
    return mapUser(rows[0])
  },
  async findUserById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    return mapUser(rows[0])
  },
  async findUserByGoogleId(googleId) {
    const { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId])
    return mapUser(rows[0])
  },
  async createUser(data) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, name, avatar, password_hash, google_id, providers, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        norm(data.email),
        data.name || norm(data.email).split('@')[0],
        data.avatar || null,
        data.passwordHash || null,
        data.googleId || null,
        data.providers || [],
        Boolean(data.emailVerified),
      ],
    )
    return mapUser(rows[0])
  },
  async updateUser(id, patch) {
    const colMap = {
      name: 'name',
      avatar: 'avatar',
      passwordHash: 'password_hash',
      googleId: 'google_id',
      providers: 'providers',
      emailVerified: 'email_verified',
      role: 'role',
      balance: 'balance',
      currency: 'currency',
    }
    const fields = []
    const values = []
    let i = 1
    for (const [key, col] of Object.entries(colMap)) {
      if (key in patch) {
        fields.push(`${col} = $${i++}`)
        values.push(patch[key])
      }
    }
    if (!fields.length) return this.findUserById(id)
    fields.push(`updated_at = NOW()`)
    values.push(id)
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    )
    return mapUser(rows[0])
  },

  // ── Pending signups ────────────────────────────────────
  async findPendingByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM pending_signups WHERE email = $1', [norm(email)])
    return mapPending(rows[0])
  },
  async upsertPending(data) {
    const { rows } = await pool.query(
      `INSERT INTO pending_signups (email, name, password_hash, otp_hash, otp_expires, attempts, last_sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         name          = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         otp_hash      = EXCLUDED.otp_hash,
         otp_expires   = EXCLUDED.otp_expires,
         attempts      = EXCLUDED.attempts,
         last_sent_at  = EXCLUDED.last_sent_at
       RETURNING *`,
      [
        norm(data.email),
        data.name || null,
        data.passwordHash || null,
        data.otpHash,
        data.otpExpires,
        data.attempts ?? 0,
        data.lastSentAt || new Date().toISOString(),
      ],
    )
    return mapPending(rows[0])
  },
  async deletePending(email) {
    await pool.query('DELETE FROM pending_signups WHERE email = $1', [norm(email)])
  },

  // ── Password resets ────────────────────────────────────
  async createReset(data) {
    const { rows } = await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires) VALUES ($1, $2, $3) RETURNING *`,
      [data.userId, data.tokenHash, data.expires],
    )
    return mapReset(rows[0])
  },
  async findValidResetByHash(tokenHash) {
    const { rows } = await pool.query(
      `SELECT * FROM password_resets WHERE token_hash = $1 AND used = false AND expires > NOW()`,
      [tokenHash],
    )
    return mapReset(rows[0])
  },
  async consumeReset(id) {
    await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [id])
  },
}
