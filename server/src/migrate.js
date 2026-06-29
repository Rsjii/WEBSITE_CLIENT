import { pool } from './db.js'

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
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash    TEXT        NOT NULL,
      expires       TIMESTAMPTZ NOT NULL,
      used          BOOLEAN     NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  console.log('\x1b[32m✓ Database tables ready\x1b[0m')
}
