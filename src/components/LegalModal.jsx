import { useEffect } from 'react'
import { LEGAL_CONTENT } from '../data/legalContent'

export default function LegalModal({ type, onClose }) {
  const content = LEGAL_CONTENT[type]

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
