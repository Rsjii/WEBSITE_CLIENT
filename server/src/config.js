import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load server/.env regardless of where the process is launched from
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const isProd = process.env.NODE_ENV === 'production'

const DEV_JWT_SECRET = 'dev-only-insecure-secret-change-me-please'

export const config = {
  isProd,
  port: Number(process.env.PORT) || 4000,

  // Where the frontend lives (used for CORS + password-reset links)
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Sessions
  jwtSecret: process.env.JWT_SECRET || DEV_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'aura_session',

  // Email (Resend). When the API key is missing we fall back to console logging.
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'AuraTrade <onboarding@resend.dev>',

  // Inbox that receives public "Contact Us" form submissions from the landing page.
  contactEmail: process.env.CONTACT_EMAIL || 'support@auratrade.com',

  // PostgreSQL
  databaseUrl: process.env.DATABASE_URL || '',

  // Google OAuth (Google Identity Services credential verification)
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',

  // OTP policy
  otpTtlMin: Number(process.env.OTP_TTL_MIN) || 10,
  otpResendCooldownSec: Number(process.env.OTP_RESEND_COOLDOWN_SEC) || 60,
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,

  // Password reset token lifetime
  resetTtlMin: Number(process.env.RESET_TTL_MIN) || 30,

  // Trading account pricing (wallet → account allocation)
  accountPrice: Number(process.env.ACCOUNT_PRICE) || 100,
  accountTicketFee: Number(process.env.ACCOUNT_TICKET_FEE) || 10,

  // Funding destinations shown to users in the Funds tab
  depositWallets: {
    usdt: process.env.DEPOSIT_WALLET_USDT || '',
    btc: process.env.DEPOSIT_WALLET_BTC || '',
    eth: process.env.DEPOSIT_WALLET_ETH || '',
  },
  bankWire: {
    bankName: process.env.BANK_NAME || '',
    accountName: process.env.BANK_ACCOUNT_NAME || '',
    iban: process.env.BANK_IBAN || '',
    swift: process.env.BANK_SWIFT || '',
  },

  // % of (accountPrice + accountTicketFee) credited to a referrer, every time
  // the user they referred opens a trading account.
  referralCommissionPercent: Number(process.env.REFERRAL_COMMISSION_PERCENT) || 10,
}

// Loud, friendly warnings so misconfiguration is obvious in the terminal.
export function printConfigWarnings() {
  const warn = (m) => console.warn(`\x1b[33m⚠  ${m}\x1b[0m`)
  if (config.jwtSecret === DEV_JWT_SECRET)
    warn('JWT_SECRET not set — using an insecure dev secret. Set JWT_SECRET in server/.env before production.')
  if (!config.resendApiKey)
    warn('RESEND_API_KEY not set — OTP & reset emails will be printed to this console instead of sent.')
  if (!process.env.CONTACT_EMAIL)
    warn('CONTACT_EMAIL not set — contact form messages will go to the support@auratrade.com placeholder.')
  if (!config.databaseUrl)
    warn('DATABASE_URL not set — database queries will fail. Add a PostgreSQL service on Railway.')
  if (!config.googleClientId)
    warn('GOOGLE_CLIENT_ID not set — "Continue with Google" will be disabled until you add it.')
  if (!config.depositWallets.usdt && !config.depositWallets.btc && !config.depositWallets.eth)
    warn('No DEPOSIT_WALLET_* addresses set — the Funds tab will prompt users to contact support instead.')
  if (config.isProd && config.jwtSecret === DEV_JWT_SECRET)
    throw new Error('Refusing to start in production with the default JWT secret.')
}
