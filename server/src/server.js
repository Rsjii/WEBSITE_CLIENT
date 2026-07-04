import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { config, printConfigWarnings } from './config.js'
import { migrate } from './migrate.js'
import authRoutes from './routes/auth.routes.js'
import walletRoutes from './routes/wallet.routes.js'
import referralRoutes from './routes/referrals.routes.js'
import marketsRoutes from './routes/markets.routes.js'
import contactRoutes from './routes/contact.routes.js'

const app = express()
app.set('trust proxy', 1)

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true)
      cb(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
  }),
)
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/config', (req, res) => {
  res.json({ googleClientId: config.googleClientId || null, googleEnabled: Boolean(config.googleClientId) })
})
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))

app.use('/api/auth', authRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/referrals', referralRoutes)
app.use('/api/markets', marketsRoutes)
app.use('/api/contact', contactRoutes)

app.use((req, res) => res.status(404).json({ error: 'Not found.' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.message?.includes('CORS')) return res.status(403).json({ error: err.message })
  console.error('\x1b[31m✗ Server error:\x1b[0m', err)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

printConfigWarnings()

migrate()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`\x1b[32m✓ AuraTrade API running\x1b[0m  →  http://localhost:${config.port}`)
    })
  })
  .catch((err) => {
    console.error('\x1b[31m✗ Migration failed — server not started:\x1b[0m', err)
    process.exit(1)
  })
