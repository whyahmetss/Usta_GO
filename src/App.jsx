/**
 * App — Usta Go Mobil Uygulama
 *
 * SADECE Müşteri + Usta rotalarını içerir.
 * Admin ve Destek sayfaları bu bundle'a girmez.
 * → Bakınız: src/AdminApp.jsx + vite.admin.config.js
 */

import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { MapsProvider } from './context/MapsContext'
import Layout from './components/Layout'
import PageErrorBoundary from './components/PageErrorBoundary'
import SplashScreen from './components/SplashScreen'
import OnboardingScreen from './components/OnboardingScreen'

/* ── Eager: kritik ilk render ── */
import AuthPage from './pages/AuthPage'

/* ── Lazy: müşteri ── */
const HomePage              = lazy(() => import('./pages/HomePage'))
const CreateJobPage         = lazy(() => import('./pages/CreateJobPage'))
const CustomerRegisterPage  = lazy(() => import('./pages/CustomerRegisterPage'))

/* ── Lazy: usta ── */
const ProfessionalDashboard = lazy(() => import('./pages/ProfessionalDashboard'))
const ProfessionalMapPage   = lazy(() => import('./pages/ProfessionalMapPage'))
const UstaRegisterPage      = lazy(() => import('./pages/UstaRegisterPage'))

/* ── Lazy: ortak sayfalar ── */
const ProfilePage       = lazy(() => import('./pages/ProfilePage'))
const SettingsPage      = lazy(() => import('./pages/SettingsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const MyJobsPage        = lazy(() => import('./pages/MyJobsPage'))
const MessagesPage      = lazy(() => import('./pages/MessagesPage'))
const JobDetailPage     = lazy(() => import('./pages/JobDetailPage'))
const RateJobPage       = lazy(() => import('./pages/RateJobPage'))
const WalletPage        = lazy(() => import('./pages/WalletPage'))
const WithdrawPage      = lazy(() => import('./pages/WithdrawPage'))
const CancelJobPage     = lazy(() => import('./pages/CancelJobPage'))
const LiveSupportChatPage = lazy(() => import('./pages/LiveSupportChatPage'))
const LiveTrackingPage  = lazy(() => import('./pages/LiveTrackingPage'))
const HelpPage          = lazy(() => import('./pages/HelpPage'))
const AboutPage         = lazy(() => import('./pages/AboutPage'))
const Odeme             = lazy(() => import('./pages/odeme'))
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'))

/* ── Sayfa geçişlerinde minimal spinner ── */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a1628]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Yükleniyor...</p>
      </div>
    </div>
  )
}

/* ── Route koruma ── */
function ProtectedRoute({ children, roleRequired = null }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <SplashScreen key="protected-splash" />

  if (!user) return <Navigate to="/" replace />

  let userRole = user.role?.toLowerCase()
  if (userRole === 'usta') userRole = 'professional'

  /* Admin / Support bu uygulamaya gelirse, admin paneline yönlendir */
  if (userRole === 'admin' || userRole === 'support') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a1628] px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🛠️</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Yönetim Paneli</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Admin ve destek hesapları için lütfen <strong>Yönetim Paneli</strong>'ni kullanın.
          </p>
          <a
            href={import.meta.env.VITE_ADMIN_URL || 'https://usta-go-admin.onrender.com'}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition"
          >
            Yönetim Paneline Git →
          </a>
        </div>
      </div>
    )
  }

  const requiredRole = roleRequired?.toLowerCase()

  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'professional') return <Navigate to="/professional" replace />
    return <Navigate to="/home" replace />
  }

  return children
}

/* ── Tüm uygulama rotaları ── */
function AppRoutes() {
  const { user } = useAuth()

  let userRole = user?.role?.toLowerCase()
  if (userRole === 'usta') userRole = 'professional'

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Auth */}
        <Route
          path="/"
          element={
            user ? (
              userRole === 'professional' ? <Navigate to="/professional" replace /> :
              userRole === 'admin' || userRole === 'support' ? <Navigate to="/professional" replace /> :
              <Navigate to="/home" replace />
            ) : (
              <AuthPage />
            )
          }
        />
        <Route path="/register/usta"     element={user ? <Navigate to="/professional" replace /> : <UstaRegisterPage />} />
        <Route path="/register/customer" element={<ProtectedRoute roleRequired="customer"><CustomerRegisterPage /></ProtectedRoute>} />

        {/* Müşteri */}
        <Route path="/home"       element={<ProtectedRoute roleRequired="customer"><Layout><HomePage /></Layout></ProtectedRoute>} />
        <Route path="/create-job" element={<ProtectedRoute roleRequired="customer"><Layout><CreateJobPage /></Layout></ProtectedRoute>} />

        {/* Usta */}
        <Route path="/professional"     element={<ProtectedRoute roleRequired="professional"><Layout><ProfessionalDashboard /></Layout></ProtectedRoute>} />
        <Route path="/professional/map" element={<ProtectedRoute roleRequired="professional"><ProfessionalMapPage /></ProtectedRoute>} />

        {/* Ortak */}
        <Route path="/profile"        element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
        <Route path="/settings"       element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
        <Route path="/help"           element={<ProtectedRoute><Layout><HelpPage /></Layout></ProtectedRoute>} />
        <Route path="/about"          element={<ProtectedRoute><Layout><AboutPage /></Layout></ProtectedRoute>} />
        <Route path="/notifications"  element={<ProtectedRoute><Layout><PageErrorBoundary><NotificationsPage /></PageErrorBoundary></Layout></ProtectedRoute>} />
        <Route path="/my-jobs"        element={<ProtectedRoute><Layout><MyJobsPage /></Layout></ProtectedRoute>} />
        <Route path="/messages"       element={<ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>} />
        <Route path="/messages/:jobId" element={<ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>} />
        <Route path="/job/:id"        element={<ProtectedRoute><Layout><JobDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/rate/:id"       element={<ProtectedRoute><Layout><RateJobPage /></Layout></ProtectedRoute>} />
        <Route path="/wallet"         element={<ProtectedRoute><Layout><WalletPage /></Layout></ProtectedRoute>} />
        <Route path="/withdraw"       element={<ProtectedRoute roleRequired="professional"><Layout><WithdrawPage /></Layout></ProtectedRoute>} />
        <Route path="/odeme"          element={<ProtectedRoute><Odeme /></ProtectedRoute>} />
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/live-support"   element={<ProtectedRoute><LiveSupportChatPage /></ProtectedRoute>} />
        <Route path="/track/:id"      element={<ProtectedRoute><Layout hideNav><LiveTrackingPage /></Layout></ProtectedRoute>} />
        <Route path="/cancel-job/:id" element={<ProtectedRoute><Layout><CancelJobPage /></Layout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

/* ── Splash + Onboarding ── */
function AppWithOnboarding() {
  const [splashDone, setSplashDone] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(
    () => !!localStorage.getItem('ug_onboarding_done')
  )

  if (!splashDone)     return <SplashScreen onDone={() => setSplashDone(true)} />
  if (!onboardingDone) return <OnboardingScreen onDone={() => setOnboardingDone(true)} />

  return <AppRoutes />
}

/* ── Root ── */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MapsProvider>
            <AppWithOnboarding />
          </MapsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
