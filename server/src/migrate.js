import { pool } from './db.js'
import { generateReferralCode } from './utils/referral.js'

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT        UNIQUE NOT NULL,
      name          TEXT        NOT NULL,
      avatar        TEXT,
      password_hash TEXT,
      google_id     TEXT        UNIQUE,
      providers     TEXT[]      NOT NULL DEFAULT '{}',
      email_verified BOOLEAN    NOT NULL DEFAULT false,
      role          TEXT        NOT NULL DEFAULT 'trader',
      balance       NUMERIC(18,2) NOT NULL DEFAULT 0,
      currency      TEXT        NOT NULL DEFAULT 'USD',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pending_signups (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT        UNIQUE NOT NULL,
      name          TEXT,
      password_hash TEXT,
      otp_hash      TEXT        NOT NULL,
      otp_expires   TIMESTAMPTZ NOT NULL,
      attempts      INTEGER     NOT NULL DEFAULT 0,
      last_sent_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      referred_by   UUID        REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash    TEXT        NOT NULL,
      expires       TIMESTAMPTZ NOT NULL,
      used          BOOLEAN     NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Trading sub-accounts. One wallet (users.balance) can fund many accounts;
    -- each account costs config.accountPrice + config.accountTicketFee to open.
    CREATE TABLE IF NOT EXISTS accounts (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label         TEXT        NOT NULL,
      status        TEXT        NOT NULL DEFAULT 'active',
      balance       NUMERIC(18,2) NOT NULL DEFAULT 0,
      trades        INTEGER     NOT NULL DEFAULT 0,
      wins          INTEGER     NOT NULL DEFAULT 0,
      losses        INTEGER     NOT NULL DEFAULT 0,
      profit        NUMERIC(18,2) NOT NULL DEFAULT 0,
      opened_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

    -- Wallet ledger: deposit / withdraw requests + account-open tickets.
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id    UUID        REFERENCES accounts(id) ON DELETE SET NULL,
      type          TEXT        NOT NULL,
      method        TEXT,
      amount        NUMERIC(18,2) NOT NULL,
      status        TEXT        NOT NULL DEFAULT 'pending',
      destination   TEXT,
      note          TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_pending_secret TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;

    -- Referrals: every user has a code; referred_by is set once (at signup or
    -- via "apply a code" later) and is never changed after that.
    ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

    ALTER TABLE pending_signups ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL;

    -- One row per commission payout — credited instantly whenever a referred
    -- user opens a trading account (see db.openAccount).
    CREATE TABLE IF NOT EXISTS referral_earnings (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referred_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id    UUID        REFERENCES accounts(id) ON DELETE SET NULL,
      amount        NUMERIC(18,2) NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings(referrer_id);
  `)
  console.log('\x1b[32m✓ Database tables ready\x1b[0m')

  await backfillReferralCodes()
}

// Existing rows predate the referral_code column — give each one a unique
// code so nobody in the DB is stuck without a referral identity.
async function backfillReferralCodes() {
  const { rows } = await pool.query('SELECT id FROM users WHERE referral_code IS NULL')
  for (const { id } of rows) {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [generateReferralCode(), id])
        break
      } catch (err) {
        if (err.constraint === 'idx_users_referral_code' && attempt < 7) continue
        throw err
      }
    }
  }
  if (rows.length) console.log(`\x1b[32m✓ Assigned referral codes to ${rows.length} existing user(s)\x1b[0m`)
}
