import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLoader from './BrandLoader'

// Requires a logged-in user; otherwise bounces to /login (remembering origin).
export function Protected({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <BrandLoader fullscreen label="Securing session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

// For /login & /signup — send already-authenticated users to the dashboard.
export function PublicOnly({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return <BrandLoader fullscreen label="Loading" />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}
