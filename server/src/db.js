import pg from 'pg'
import { config } from './config.js'
import { generateReferralCode } from './utils/referral.js'

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
    twoFactorSecret: row.two_factor_secret,
    twoFactorPendingSecret: row.two_factor_pending_secret,
    twoFactorEnabled: row.two_factor_enabled,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  }
}

function mapAccount(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    status: row.status,
    balance: Number(row.balance),
    trades: row.trades,
    wins: row.wins,
    losses: row.losses,
    profit: Number(row.profit),
    openedAt: row.opened_at?.toISOString(),
    createdAt: row.created_at?.toISOString(),
  }
}

function mapWalletTx(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    type: row.type,
    method: row.method,
    amount: Number(row.amount),
    status: row.status,
    destination: row.destination,
    note: row.note,
    createdAt: row.created_at?.toISOString(),
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
    referredBy: row.referred_by,
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
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO users (email, name, avatar, password_hash, google_id, providers, email_verified, referral_code, referred_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            norm(data.email),
            data.name || norm(data.email).split('@')[0],
            data.avatar || null,
            data.passwordHash || null,
            data.googleId || null,
            data.providers || [],
            Boolean(data.emailVerified),
            generateReferralCode(),
            data.referredById || null,
          ],
        )
        return mapUser(rows[0])
      } catch (err) {
        if (err.constraint === 'idx_users_referral_code' && attempt < 7) continue
        throw err
      }
    }
    throw new Error('Could not generate a unique referral code.')
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
      twoFactorSecret: 'two_factor_secret',
      twoFactorPendingSecret: 'two_factor_pending_secret',
      twoFactorEnabled: 'two_factor_enabled',
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
      `INSERT INTO pending_signups (email, name, password_hash, otp_hash, otp_expires, attempts, last_sent_at, referred_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET
         name          = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         otp_hash      = EXCLUDED.otp_hash,
         otp_expires   = EXCLUDED.otp_expires,
         attempts      = EXCLUDED.attempts,
         last_sent_at  = EXCLUDED.last_sent_at,
         referred_by   = EXCLUDED.referred_by
       RETURNING *`,
      [
        norm(data.email),
        data.name || null,
        data.passwordHash || null,
        data.otpHash,
        data.otpExpires,
        data.attempts ?? 0,
        data.lastSentAt || new Date().toISOString(),
        data.referredBy || null,
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

  // ── Trading accounts ───────────────────────────────────
  async listAccounts(userId) {
    const { rows } = await pool.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC', [userId])
    return rows.map(mapAccount)
  },
  // Atomically deducts (price + ticketFee) from the wallet and opens a new
  // active account. Row-locks the user so concurrent opens can't overdraw.
  // If the account owner was referred, the referrer is credited a commission
  // on the same total — every account opened, not just the first.
  async openAccount(userId, { price, ticketFee, label, commissionPercent = 0 }) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows: urows } = await client.query(
        'SELECT balance, referred_by FROM users WHERE id = $1 FOR UPDATE',
        [userId],
      )
      if (!urows[0]) throw Object.assign(new Error('Account not found.'), { status: 404 })

      const total = price + ticketFee
      const balance = Number(urows[0].balance)
      if (balance < total)
        throw Object.assign(
          new Error(`Insufficient wallet balance. Opening an account needs $${total} ($${price} account + $${ticketFee} ticket).`),
          { status: 400, code: 'INSUFFICIENT_FUNDS' },
        )

      const { rows: balRows } = await client.query(
        'UPDATE users SET balance = balance - $1, updated_at = NOW() WHERE id = $2 RETURNING balance',
        [total, userId],
      )
      const { rows: accRows } = await client.query(
        `INSERT INTO accounts (user_id, label, status, balance) VALUES ($1, $2, 'active', $3) RETURNING *`,
        [userId, label, price],
      )
      const account = accRows[0]
      await client.query(
        `INSERT INTO wallet_transactions (user_id, account_id, type, amount, status, note)
         VALUES ($1, $2, 'account_open', $3, 'approved', $4)`,
        [userId, account.id, total, `Opened ${label}`],
      )

      const referrerId = urows[0].referred_by
      if (referrerId && commissionPercent > 0) {
        const commission = Number(((total * commissionPercent) / 100).toFixed(2))
        if (commission > 0) {
          await client.query('UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2', [commission, referrerId])
          await client.query(
            `INSERT INTO referral_earnings (referrer_id, referred_id, account_id, amount) VALUES ($1, $2, $3, $4)`,
            [referrerId, userId, account.id, commission],
          )
          await client.query(
            `INSERT INTO wallet_transactions (user_id, type, amount, status, note)
             VALUES ($1, 'referral_commission', $2, 'approved', $3)`,
            [referrerId, commission, 'Commission from an account opened by your referral'],
          )
        }
      }

      await client.query('COMMIT')
      return { account: mapAccount(account), balance: Number(balRows[0].balance) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  // ── Wallet transactions ─────────────────────────────────
  async listTransactions(userId, limit = 100) {
    const { rows } = await pool.query(
      'SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    )
    return rows.map(mapWalletTx)
  },
  async createTransaction(data) {
    const { rows } = await pool.query(
      `INSERT INTO wallet_transactions (user_id, account_id, type, method, amount, status, destination, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        data.userId,
        data.accountId || null,
        data.type,
        data.method || null,
        data.amount,
        data.status || 'pending',
        data.destination || null,
        data.note || null,
      ],
    )
    return mapWalletTx(rows[0])
  },
  async walletTotals(userId) {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'approved'), 0)  AS deposited,
         COALESCE(SUM(amount) FILTER (WHERE type = 'withdraw' AND status = 'approved'), 0) AS withdrawn
       FROM wallet_transactions WHERE user_id = $1`,
      [userId],
    )
    return { deposited: Number(rows[0].deposited), withdrawn: Number(rows[0].withdrawn) }
  },

  // ── Referrals ────────────────────────────────────────────
  async findUserByReferralCode(code) {
    const { rows } = await pool.query('SELECT * FROM users WHERE referral_code = $1', [String(code || '').trim().toUpperCase()])
    return mapUser(rows[0])
  },
  // referred_by is set exactly once — the WHERE guard makes a second call a no-op.
  async setReferredBy(userId, referrerId) {
    const { rows } = await pool.query(
      `UPDATE users SET referred_by = $1, updated_at = NOW() WHERE id = $2 AND referred_by IS NULL RETURNING *`,
      [referrerId, userId],
    )
    return mapUser(rows[0])
  },
  async referralTotals(referrerId) {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE referred_by = $1) AS referred_count,
         (SELECT COALESCE(SUM(amount), 0) FROM referral_earnings WHERE referrer_id = $1) AS total_earned`,
      [referrerId],
    )
    return { referredCount: Number(rows[0].referred_count), totalEarned: Number(rows[0].total_earned) }
  },
  async listReferrals(referrerId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              COUNT(a.id) FILTER (WHERE a.id IS NOT NULL) AS accounts_opened,
              COALESCE(SUM(re.amount), 0) AS earned
       FROM users u
       LEFT JOIN accounts a ON a.user_id = u.id
       LEFT JOIN referral_earnings re ON re.referred_id = u.id AND re.referrer_id = $1
       WHERE u.referred_by = $1
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [referrerId],
    )
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      joinedAt: r.created_at?.toISOString(),
      accountsOpened: Number(r.accounts_opened),
      earned: Number(r.earned),
    }))
  },
  async listReferralEarnings(referrerId, limit = 50) {
    const { rows } = await pool.query(
      `SELECT re.*, u.name AS referred_name, u.email AS referred_email
       FROM referral_earnings re JOIN users u ON u.id = re.referred_id
       WHERE re.referrer_id = $1 ORDER BY re.created_at DESC LIMIT $2`,
      [referrerId, limit],
    )
    return rows.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      createdAt: r.created_at?.toISOString(),
      referredName: r.referred_name,
      referredEmail: r.referred_email,
    }))
  },
}
