import { Router } from 'express'
import { config } from '../config.js'
import { db } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const METHODS = ['usdt', 'btc', 'eth', 'wire']

router.use(requireAuth)

// ── GET /overview ────────────────────────────────────────
// Everything the Funds + Portfolio tabs need in one round trip.
router.get(
  '/overview',
  a(async (req, res) => {
    const [accounts, transactions, totals] = await Promise.all([
      db.listAccounts(req.user.id),
      db.listTransactions(req.user.id, 100),
      db.walletTotals(req.user.id),
    ])
    res.json({
      walletBalance: req.user.balance,
      currency: req.user.currency,
      totals,
      accounts,
      transactions,
      accountPrice: config.accountPrice,
      ticketFee: config.accountTicketFee,
      wallets: config.depositWallets,
      bankWire: config.bankWire,
    })
  }),
)

// ── POST /deposit ────────────────────────────────────────
router.post(
  '/deposit',
  a(async (req, res) => {
    const { amount, method, note } = req.body || {}
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Enter a valid amount.' })
    if (!METHODS.includes(method)) return res.status(400).json({ error: 'Choose a valid funding method.' })

    const tx = await db.createTransaction({
      userId: req.user.id,
      type: 'deposit',
      method,
      amount: amt,
      status: 'pending',
      note: String(note || '').slice(0, 300),
    })
    res.json({ ok: true, transaction: tx })
  }),
)

// ── POST /withdraw ───────────────────────────────────────
router.post(
  '/withdraw',
  a(async (req, res) => {
    const { amount, method, destination } = req.body || {}
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Enter a valid amount.' })
    if (amt > Number(req.user.balance)) return res.status(400).json({ error: 'Amount exceeds your available wallet balance.' })
    if (!destination || !String(destination).trim())
      return res.status(400).json({ error: 'Enter a destination address or bank account.' })

    const tx = await db.createTransaction({
      userId: req.user.id,
      type: 'withdraw',
      method: METHODS.includes(method) ? method : null,
      amount: amt,
      status: 'pending',
      destination: String(destination).trim().slice(0, 300),
    })
    res.json({ ok: true, transaction: tx })
  }),
)

// ── POST /accounts ───────────────────────────────────────
// Opens a new trading account: deducts (accountPrice + ticketFee) from the wallet.
router.post(
  '/accounts',
  a(async (req, res) => {
    const label = String(req.body?.label || '').trim().slice(0, 60)
    try {
      const existing = await db.listAccounts(req.user.id)
      const { account, balance } = await db.openAccount(req.user.id, {
        price: config.accountPrice,
        ticketFee: config.accountTicketFee,
        label: label || `Account ${existing.length + 1}`,
        commissionPercent: config.referralCommissionPercent,
      })
      res.json({ ok: true, account, walletBalance: balance })
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message, code: err.code })
      throw err
    }
  }),
)

export default router
