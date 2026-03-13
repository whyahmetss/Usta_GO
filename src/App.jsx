import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { MapsProvider } from './context/MapsContext'
import Layout from './components/Layout'
import PageErrorBoundary from './components/PageErrorBoundary'
import SplashScreen from './components/SplashScreen'
import OnboardingScreen from './components/OnboardingScreen'
import AuthPage from './pages/AuthPage'
import UstaRegisterPage from './pages/UstaRegisterPage'
import HomePage from './pages/HomePage'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import ProfessionalMapPage from './pages/ProfessionalMapPage'
import AdminDashboard from './pages/AdminDashboard'
import ProfilePage from './pages/ProfilePage'
import MyJobsPage from './pages/MyJobsPage'
import MessagesPage from './pages/MessagesPage'
import JobDetailPage from './pages/JobDetailPage'
import RateJobPage from './pages/RateJobPage'
import SettingsPage from './pages/SettingsPage'
import NotificationsPage from './pages/NotificationsPage'
import CreateJobPage from './pages/CreateJobPage'
import WalletPage from './pages/WalletPage'
import WithdrawPage from './pages/WithdrawPage'
import AdminWithdrawalsPage from './pages/AdminWithdrawalsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminJobsPage from './pages/AdminJobsPage'
import AdminComplaintsPage from './pages/AdminComplaintsPage'
import AdminMessagesPage from './pages/AdminMessagesPage'
import AdminCouponsPage from './pages/AdminCouponsPage'
import AdminPricingPage from './pages/AdminPricingPage'
import AdminCertificatesPage from './pages/AdminCertificatesPage'
import AdminPendingUstasPage from './pages/AdminPendingUstasPage'
import AdminCampaignsPage from './pages/AdminCampaignsPage'
import AdminFinancePage from './pages/AdminFinancePage'
import AdminPromotionsPage from './pages/AdminPromotionsPage'
import AdminVerificationPage from './pages/AdminVerificationPage'
import AdminSupportMonitorPage from './pages/AdminSupportMonitorPage'
import CancelJobPage from './pages/CancelJobPage'
import CustomerRegisterPage from './pages/CustomerRegisterPage'
import SupportDashboard from './pages/SupportDashboard'
import LiveSupportChatPage from './pages/LiveSupportChatPage'
import SupportChatPage from './pages/SupportChatPage'
import LiveTrackingPage from './pages/LiveTrackingPage'
import HelpPage from './pages/HelpPage'
import AboutPage from './pages/AboutPage'
import Odeme from './pages/odeme'
import PaymentResultPage from './pages/PaymentResultPage'

function ProtectedRoute({ children, roleRequired = null }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <SplashScreen key="protected-splash" />
  }

  if (!user) {
    return <Navigate to="/" />
  }

  let userRole = user.role?.toLowerCase();
  if (userRole === 'usta') userRole = 'professional';

  const requiredRole = roleRequired?.toLowerCase();

  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'admin') return <Navigate to="/admin" />
    if (userRole === 'professional') return <Navigate to="/professional" />
    if (userRole === 'support') return <Navigate to="/support" />
    return <Navigate to="/home" />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()
  
  let userRole = user?.role?.toLowerCase();
  if (userRole === 'usta') userRole = 'professional';

  return (
    <Routes>
      {/* Auth - no layout */}
      <Route
        path="/"
        element={
          user ? (
            userRole === 'admin' ? <Navigate to="/admin" /> :
            userRole === 'professional' ? <Navigate to="/professional" /> :
            userRole === 'support' ? <Navigate to="/support" /> :
            <Navigate to="/home" />
          ) : (
            <AuthPage />
          )
        }
      />
      <Route path="/register/usta" element={user ? <Navigate to="/professional" /> : <UstaRegisterPage />} />
      <Route path="/register/customer" element={<ProtectedRoute roleRequired="customer"><CustomerRegisterPage /></ProtectedRoute>} />

      {/* Customer */}
      <Route path="/home" element={<ProtectedRoute roleRequired="customer"><Layout><HomePage /></Layout></ProtectedRoute>} />

      {/* Professional */}
      <Route path="/professional" element={<ProtectedRoute roleRequired="professional"><Layout><ProfessionalDashboard /></Layout></ProtectedRoute>} />
      <Route path="/professional/map" element={<ProtectedRoute roleRequired="professional"><ProfessionalMapPage /></ProtectedRoute>} />

      {/* Shared - with layout */}
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Layout><HelpPage /></Layout></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><Layout><AboutPage /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Layout><PageErrorBoundary><NotificationsPage /></PageErrorBoundary></Layout></ProtectedRoute>} />
      <Route path="/my-jobs" element={<ProtectedRoute><Layout><MyJobsPage /></Layout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>} />
      <Route path="/messages/:jobId" element={<ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>} />
      <Route path="/job/:id" element={<ProtectedRoute><Layout><JobDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/rate/:id" element={<ProtectedRoute><Layout><RateJobPage /></Layout></ProtectedRoute>} />
      <Route path="/create-job" element={<ProtectedRoute roleRequired="customer"><Layout><CreateJobPage /></Layout></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Layout><WalletPage /></Layout></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute roleRequired="professional"><Layout><WithdrawPage /></Layout></ProtectedRoute>} />
      <Route path="/odeme" element={<ProtectedRoute><Layout><Odeme /></Layout></ProtectedRoute>} />
      <Route path="/payment-result" element={<PaymentResultPage />} />

      {/* Admin - with layout */}
      <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/withdrawals" element={<ProtectedRoute roleRequired="admin"><Layout><AdminWithdrawalsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roleRequired="admin"><Layout><AdminUsersPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/jobs" element={<ProtectedRoute roleRequired="admin"><Layout><AdminJobsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute roleRequired="admin"><Layout><AdminComplaintsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute roleRequired="admin"><Layout><PageErrorBoundary><AdminMessagesPage /></PageErrorBoundary></Layout></ProtectedRoute>} />
      <Route path="/admin/coupons" element={<ProtectedRoute roleRequired="admin"><Layout><AdminCouponsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/promotions" element={<ProtectedRoute roleRequired="admin"><AdminPromotionsPage /></ProtectedRoute>} />
      <Route path="/admin/verification" element={<ProtectedRoute roleRequired="admin"><AdminVerificationPage /></ProtectedRoute>} />
      <Route path="/admin/support-monitor" element={<ProtectedRoute roleRequired="admin"><AdminSupportMonitorPage /></ProtectedRoute>} />
      <Route path="/admin/pricing" element={<ProtectedRoute roleRequired="admin"><Layout><AdminPricingPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/certificates" element={<ProtectedRoute roleRequired="admin"><Layout><AdminCertificatesPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/pending-ustas" element={<ProtectedRoute roleRequired="admin"><Layout><AdminPendingUstasPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/campaigns" element={<ProtectedRoute roleRequired="admin"><Layout><AdminCampaignsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/finance" element={<ProtectedRoute roleRequired="admin"><AdminFinancePage /></ProtectedRoute>} />

      <Route path="/support" element={<ProtectedRoute roleRequired="support"><SupportDashboard /></ProtectedRoute>} />
      <Route path="/support/chat/:userId" element={<ProtectedRoute roleRequired="support"><SupportChatPage /></ProtectedRoute>} />
      <Route path="/live-support" element={<ProtectedRoute><LiveSupportChatPage /></ProtectedRoute>} />
      <Route path="/track/:id" element={<ProtectedRoute><Layout hideNav><LiveTrackingPage /></Layout></ProtectedRoute>} />
      <Route path="/cancel-job/:id" element={<ProtectedRoute><Layout><CancelJobPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function AppWithOnboarding() {
  const [splashDone, setSplashDone] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(
    () => !!localStorage.getItem('ug_onboarding_done')
  )

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />
  }

  if (!onboardingDone) {
    return <OnboardingScreen onDone={() => setOnboardingDone(true)} />
  }

  return <AppRoutes />
}

function App() {
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

export default App
