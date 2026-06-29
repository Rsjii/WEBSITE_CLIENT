import { useEffect } from 'react'

const CONTENT = {
  terms: {
    title: 'Terms & Conditions',
    body: [
      {
        heading: '1. Acceptance of Terms',
        text: 'By creating an account and using AuraTrade ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, you may not use our services. We reserve the right to update these terms at any time, with notice provided via email or platform notification.',
      },
      {
        heading: '2. Eligibility',
        text: 'You must be at least 18 years of age and a legal resident of a jurisdiction where trading financial instruments is permitted. By registering, you represent and warrant that you meet these requirements. AuraTrade reserves the right to refuse service to anyone at its sole discretion.',
      },
      {
        heading: '3. Managed Trading Service',
        text: 'AuraTrade offers a managed trading desk service. Your deposited funds are traded on your behalf by our professional trading team through regulated broker accounts. Past performance is not indicative of future results. All trading involves risk, including the possible loss of principal.',
      },
      {
        heading: '4. Minimum Deposit',
        text: 'The minimum deposit to activate a managed trading account is USD $100 or equivalent. Deposits below this threshold will not be eligible for managed trading and will be held in your account wallet until the minimum is reached.',
      },
      {
        heading: '5. Withdrawals',
        text: 'Withdrawal requests are processed within 3–5 business days. AuraTrade reserves the right to verify the identity of account holders before processing withdrawals in accordance with AML/KYC regulations. Withdrawal fees, if any, will be disclosed prior to processing.',
      },
      {
        heading: '6. Risk Disclosure',
        text: 'Trading foreign exchange, cryptocurrencies, stocks, indices, and commodities carries a high level of risk and may not be suitable for all investors. The high degree of leverage available in trading can work against you as well as for you. You should carefully consider your investment objectives, level of experience, and risk appetite before investing.',
      },
      {
        heading: '7. Account Security',
        text: 'You are responsible for maintaining the confidentiality of your account credentials. AuraTrade will never ask for your password via email or phone. Any activity conducted under your account credentials is your responsibility. Report unauthorized access immediately via our support channels.',
      },
      {
        heading: '8. Prohibited Activities',
        text: 'You may not use the Platform for money laundering, fraud, market manipulation, or any illegal activity. Accounts found engaging in prohibited activities will be immediately suspended, funds frozen pending investigation, and reported to relevant authorities.',
      },
      {
        heading: '9. Limitation of Liability',
        text: 'AuraTrade shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to trading losses, loss of profits, or loss of data. Our maximum liability to you shall not exceed the total fees paid by you in the preceding 12 months.',
      },
      {
        heading: '10. Governing Law',
        text: 'These Terms shall be governed by and construed in accordance with applicable international financial regulations. Any disputes shall first be attempted to be resolved through good-faith negotiation, followed by binding arbitration if necessary.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      {
        heading: '1. Information We Collect',
        text: 'We collect information you provide directly, including your full name, email address, phone number, government-issued identification documents, and financial information required for KYC/AML compliance. We also collect usage data, IP addresses, device identifiers, and cookies to improve our services.',
      },
      {
        heading: '2. How We Use Your Information',
        text: 'Your information is used to create and manage your account, process transactions, verify your identity, comply with legal obligations, prevent fraud, send service-related communications, and improve our Platform. We do not sell your personal data to third parties.',
      },
      {
        heading: '3. Data Sharing',
        text: 'We may share your information with regulated broker partners for trade execution, payment processors for deposit and withdrawal processing, identity verification services for KYC compliance, and law enforcement or regulatory authorities when required by law. All third parties are contractually bound to protect your data.',
      },
      {
        heading: '4. Data Security',
        text: 'We implement industry-standard security measures including 256-bit SSL encryption, secure data centers, two-factor authentication, and regular security audits. While we strive to protect your information, no method of transmission over the internet is 100% secure.',
      },
      {
        heading: '5. Cookies',
        text: 'We use essential cookies to maintain your session and authentication state. We use analytics cookies to understand how users interact with our Platform. You may disable non-essential cookies in your browser settings without affecting core Platform functionality.',
      },
      {
        heading: '6. Data Retention',
        text: 'We retain your personal data for as long as your account is active or as required by applicable financial regulations (typically 5–7 years after account closure). After this period, your data is securely deleted or anonymized in accordance with our data retention schedule.',
      },
      {
        heading: '7. Your Rights',
        text: 'You have the right to access, correct, or request deletion of your personal data, subject to legal retention requirements. You may also request data portability or restrict processing of your data. To exercise these rights, contact our Data Protection Officer at privacy@auratrade.com.',
      },
      {
        heading: '8. International Transfers',
        text: 'Your data may be transferred to and processed in countries other than your country of residence. We ensure adequate protections are in place for any international transfers of personal data, including the use of standard contractual clauses where required.',
      },
      {
        heading: '9. Children\'s Privacy',
        text: 'Our Platform is not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us and we will promptly delete such information.',
      },
      {
        heading: '10. Contact Us',
        text: 'For any privacy-related questions, concerns, or to exercise your data rights, please contact our Data Protection Officer at privacy@auratrade.com or write to AuraTrade Privacy Team. We aim to respond to all requests within 30 days.',
      },
    ],
  },
}

export default function LegalModal({ type, onClose }) {
  const content = CONTENT[type]

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!content) return null

  return (
    <div className="legal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={content.title}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal__header">
          <h2 className="legal-modal__title">{content.title}</h2>
          <button className="legal-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="legal-modal__body">
          {content.body.map((section) => (
            <div key={section.heading} className="legal-modal__section">
              <h3 className="legal-modal__section-title">{section.heading}</h3>
              <p className="legal-modal__section-text">{section.text}</p>
            </div>
          ))}
          <p className="legal-modal__updated">Last updated: June 2026</p>
        </div>
        <div className="legal-modal__footer">
          <button className="auth-btn" style={{ maxWidth: '200px', padding: '0.75rem 2rem' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
