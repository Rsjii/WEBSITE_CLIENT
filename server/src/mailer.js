import { Resend } from 'resend'
import { config } from './config.js'

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null

function devLog(subject, to, body) {
  console.log('\n\x1b[33m┌─ ✉  EMAIL (dev fallback — no RESEND_API_KEY) ─────────────\x1b[0m')
  console.log(`\x1b[33m│ To:      \x1b[0m${to}`)
  console.log(`\x1b[33m│ Subject: \x1b[0m${subject}`)
  console.log(`\x1b[33m│ ${body}\x1b[0m`)
  console.log('\x1b[33m└──────────────────────────────────────────────────────────\x1b[0m\n')
}

async function send({ to, subject, html, devBody }) {
  if (!resend) {
    devLog(subject, to, devBody)
    return { delivered: false, dev: true }
  }
  try {
    await resend.emails.send({ from: config.emailFrom, to, subject, html })
    return { delivered: true }
  } catch (err) {
    console.error('\x1b[31m✗ Resend failed:\x1b[0m', err?.message || err)
    devLog(subject, to, devBody) // never block the flow on email failure in dev
    return { delivered: false, error: err?.message }
  }
}

// ── Branded email shell ──────────────────────────────────
function shell(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#050504;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:24px;letter-spacing:6px;font-weight:700;color:#D4AF37;">AURATRADE</span>
      <div style="font-size:9px;letter-spacing:3px;color:#8a7a3a;margin-top:4px;text-transform:uppercase;">Elite Trading Platform</div>
    </div>
    <div style="background:linear-gradient(180deg,#12100b,#0a0907);border:1px solid rgba(201,168,76,0.18);border-radius:18px;padding:36px 30px;">
      <h1 style="color:#fff;font-size:20px;margin:0 0 14px;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#5a5648;font-size:11px;text-align:center;margin-top:24px;line-height:1.6;">
      You're receiving this because someone used this email on AuraTrade.<br/>If this wasn't you, you can safely ignore it.
    </p>
  </div></body></html>`
}

export function sendOtpEmail(to, code) {
  const html = shell(
    'Verify your email',
    `<p style="color:#b9b4a6;font-size:14px;line-height:1.7;margin:0 0 22px;">Use the code below to finish creating your AuraTrade account. It expires in ${config.otpTtlMin} minutes.</p>
     <div style="text-align:center;margin:8px 0 4px;">
       <span style="display:inline-block;font-size:34px;letter-spacing:12px;font-weight:700;color:#D4AF37;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:16px 24px;">${code}</span>
     </div>`,
  )
  return send({ to, subject: `${code} is your AuraTrade verification code`, html, devBody: `OTP code: ${code}` })
}

export function sendResetEmail(to, link) {
  const html = shell(
    'Reset your password',
    `<p style="color:#b9b4a6;font-size:14px;line-height:1.7;margin:0 0 22px;">Click the button below to set a new password. This link expires in ${config.resetTtlMin} minutes.</p>
     <div style="text-align:center;">
       <a href="${link}" style="display:inline-block;background:#C9A84C;color:#050504;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:100px;font-size:14px;">Reset Password</a>
     </div>
     <p style="color:#6f6b5c;font-size:11px;margin-top:22px;word-break:break-all;">Or paste this link: ${link}</p>`,
  )
  return send({ to, subject: 'Reset your AuraTrade password', html, devBody: `Reset link: ${link}` })
}
