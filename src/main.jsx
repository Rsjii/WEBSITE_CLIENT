import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import { Protected, PublicOnly } from './components/RouteGuards'
import BrandLoader from './components/BrandLoader'
import './index.css'

// Lazy routes → the branded loader shows only while a chunk is actually loading.
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const TwoFactor = lazy(() => import('./pages/auth/TwoFactor'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'))
const Overview = lazy(() => import('./pages/dashboard/tabs/Overview'))
const Portfolio = lazy(() => import('./pages/dashboard/tabs/Portfolio'))
const Markets = lazy(() => import('./pages/dashboard/tabs/Markets'))
const Funds = lazy(() => import('./pages/dashboard/tabs/Funds'))
const Referrals = lazy(() => import('./pages/dashboard/tabs/Referrals'))
const Settings = lazy(() => import('./pages/dashboard/tabs/Settings'))

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<BrandLoader fullscreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
          <Route path="/verify" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/two-factor" element={<TwoFactor />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />

          <Route path="/dashboard" element={<Protected><DashboardLayout /></Protected>}>
            <Route index element={<Overview />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="markets" element={<Markets />} />
            <Route path="funds" element={<Funds />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>,
)
