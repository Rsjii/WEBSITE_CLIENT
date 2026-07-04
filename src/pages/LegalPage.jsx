import { Link } from 'react-router-dom'
import { LEGAL_CONTENT } from '../data/legalContent'

export default function LegalPage({ type }) {
  const content = LEGAL_CONTENT[type]
  if (!content) return null

  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <Link to="/" className="legal-page__back">← Back to Home</Link>
        <h1 className="legal-page__title">{content.title}</h1>
        <div className="legal-page__body">
          {content.body.map((section) => (
            <div key={section.heading} className="legal-modal__section">
              <h3 className="legal-modal__section-title">{section.heading}</h3>
              <p className="legal-modal__section-text">{section.text}</p>
            </div>
          ))}
          <p className="legal-modal__updated">Last updated: June 2026</p>
        </div>
      </div>
    </div>
  )
}
