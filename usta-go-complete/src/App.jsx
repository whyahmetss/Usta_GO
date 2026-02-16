import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import ElectricServicesPage from './pages/ElectricServicesPage'
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
import ProfessionalProfilePage from './pages/ProfessionalProfilePage'
import CancelJobPage from './pages/CancelJobPage'

// Protected Route wrapper
function ProtectedRoute({ children, roleRequired = null }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" />
  }

  if (roleRequired && user.role !== roleRequired) {
    // Kullanıcıyı kendi paneline yönlendir
    if (user.role === 'admin') return <Navigate to="/admin" />
    if (user.role === 'professional') return <Navigate to="/professional" />
    return <Navigate to="/home" />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" /> :
            user.role === 'professional' ? <Navigate to="/professional" /> :
            <Navigate to="/home" />
          ) : (
            <AuthPage />
          )
        } 
      />
      
      {/* Müşteri Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute roleRequired="customer">
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/electric"
        element={
          <ProtectedRoute roleRequired="customer">
            <ElectricServicesPage />
          </ProtectedRoute>
        }
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

      {/* Ortak Routes (Müşteri & Usta) */}
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

      {/* Usta Routes - Finansal */}
      <Route
        path="/wallet"
        element={
          <ProtectedRoute roleRequired="professional">
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

      {/* Cancel Job Route */}
      <Route
        path="/cancel-job/:id"
        element={
          <ProtectedRoute>
            <CancelJobPage />
          </ProtectedRoute>
        }
      />

      {/* 404 - Ana sayfaya yönlendir */}
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
