import { Router } from 'express'
import { config } from '../config.js'
import { db } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

router.use(requireAuth)

// ── GET /overview ────────────────────────────────────────
router.get(
  '/overview',
  a(async (req, res) => {
    const [referrer, totals, referrals, earnings] = await Promise.all([
      req.user.referredBy ? db.findUserById(req.user.referredBy) : null,
      db.referralTotals(req.user.id),
      db.listReferrals(req.user.id),
      db.listReferralEarnings(req.user.id, 50),
    ])
    res.json({
      referralCode: req.user.referralCode,
      referralLink: `${config.appUrl}/signup?ref=${req.user.referralCode}`,
      commissionPercent: config.referralCommissionPercent,
      referredBy: referrer ? { name: referrer.name, code: referrer.referralCode } : null,
      totals,
      referrals,
      earnings,
    })
  }),
)

// ── POST /apply ───────────────────────────────────────────
// Links an existing account to a referrer after the fact (e.g. Google
// sign-ups, or anyone who skipped the field on the signup form).
router.post(
  '/apply',
  a(async (req, res) => {
    const code = String(req.body?.code || '').trim().toUpperCase()
    if (!code) return res.status(400).json({ error: 'Enter a referral code.' })
    if (req.user.referredBy) return res.status(400).json({ error: 'You already have a referrer linked to your account.' })

    const referrer = await db.findUserByReferralCode(code)
    if (!referrer) return res.status(404).json({ error: "That referral code doesn't exist." })
    if (referrer.id === req.user.id) return res.status(400).json({ error: "You can't refer yourself." })

    const updated = await db.setReferredBy(req.user.id, referrer.id)
    if (!updated) return res.status(400).json({ error: 'You already have a referrer linked to your account.' })
    res.json({ ok: true })
  }),
)

export default router
