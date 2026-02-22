import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
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
import ProfessionalProfilePage from './pages/ProfessionalProfilePage'
import CancelJobPage from './pages/CancelJobPage'
import LiveTrackingPage from './pages/LiveTrackingPage'
import HelpPage from './pages/HelpPage'
import AboutPage from './pages/AboutPage'

// Protected Route wrapper - Büyük/Küçük harf hatası giderildi
function ProtectedRoute({ children, roleRequired = null }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" />
  }

  // Veritabanından gelen rolü ve beklenen rolü küçük harfe çevirip karşılaştırıyoruz
  const userRole = user.role?.toLowerCase();
  const requiredRole = roleRequired?.toLowerCase();

  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'admin') return <Navigate to="/admin" />
    if (userRole === 'professional') return <Navigate to="/professional" />
    return <Navigate to="/home" />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()
  const userRole = user?.role?.toLowerCase(); // Rolü burada da standart hale getirdik

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            userRole === 'admin' ? <Navigate to="/admin" /> :
            userRole === 'professional' ? <Navigate to="/professional" /> :
            <Navigate to="/home" />
          ) : (
            <AuthPage />
          )
        }
      />

      {/* Musteri Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute roleRequired="customer">
            <HomePage />
          </ProtectedRoute>
        }
      />
      {/* ... Diğer rotaların aynı kalabilir ... */}

      {/* /services/electric -> redirect to /create-job */}
      <Route
        path="/services/electric"
        element={<Navigate to="/create-job" replace />}
      />

      {/* Usta Routes */}
      <Route
        path="/professional"
        element={
          <ProtectedRoute roleRequired="professional">
            <ProfessionalDashboard />
          </ProtectedRoute>
        }
      />

      {/* Ortak Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <HelpPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <AboutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-jobs"
        element={
          <ProtectedRoute>
            <MyJobsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:jobId"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/job/:id"
        element={
          <ProtectedRoute>
            <JobDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rate/:id"
        element={
          <ProtectedRoute>
            <RateJobPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-job"
        element={
          <ProtectedRoute roleRequired="customer">
            <CreateJobPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professional-profile/:id"
        element={
          <ProtectedRoute>
            <ProfessionalProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Finansal Routes - Usta & Müşteri */}
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/withdraw"
        element={
          <ProtectedRoute roleRequired="professional">
            <WithdrawPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/withdrawals"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminWithdrawalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminJobsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminComplaintsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminMessagesPage />
          </ProtectedRoute>
        }
      />

      {/* Live Tracking Route */}
      <Route
        path="/track/:id"
        element={
          <ProtectedRoute>
            <LiveTrackingPage />
          </ProtectedRoute>
        }
      />

      {/* Cancel Job Route */}
      <Route
        path="/cancel-job/:id"
        element={
          <ProtectedRoute>
            <CancelJobPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
