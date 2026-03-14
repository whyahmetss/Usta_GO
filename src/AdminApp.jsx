/**
 * AdminApp — Usta Go Yönetim Paneli
 *
 * Bu dosya SADECE admin-panel build'ına girer.
 * Müşteri / Usta mobil bundle'ıyla HİÇBİR ilişkisi yoktur.
 * Aynı backend API'sini kullanır (config.js → API_URL).
 */

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import PageErrorBoundary from './components/PageErrorBoundary'
import AuthPage from './pages/AuthPage'
import {
  LayoutDashboard, Users, Briefcase, MessageSquare, AlertCircle,
  Wallet, Tag, DollarSign, Award, Clock, Megaphone, ShieldCheck,
  Headphones, LogOut, Sun, Moon, Menu, X,
} from 'lucide-react'
import { useState } from 'react'

/* ── Lazy admin sayfaları ── */
const AdminDashboard          = lazy(() => import('./pages/AdminDashboard'))
const AdminWithdrawalsPage    = lazy(() => import('./pages/AdminWithdrawalsPage'))
const AdminUsersPage          = lazy(() => import('./pages/AdminUsersPage'))
const AdminJobsPage           = lazy(() => import('./pages/AdminJobsPage'))
const AdminComplaintsPage     = lazy(() => import('./pages/AdminComplaintsPage'))
const AdminMessagesPage       = lazy(() => import('./pages/AdminMessagesPage'))
const AdminCouponsPage        = lazy(() => import('./pages/AdminCouponsPage'))
const AdminPricingPage        = lazy(() => import('./pages/AdminPricingPage'))
const AdminCertificatesPage   = lazy(() => import('./pages/AdminCertificatesPage'))
const AdminPendingUstasPage   = lazy(() => import('./pages/AdminPendingUstasPage'))
const AdminCampaignsPage      = lazy(() => import('./pages/AdminCampaignsPage'))
const AdminFinancePage        = lazy(() => import('./pages/AdminFinancePage'))
const AdminPromotionsPage     = lazy(() => import('./pages/AdminPromotionsPage'))
const AdminVerificationPage   = lazy(() => import('./pages/AdminVerificationPage'))
const AdminSupportMonitorPage = lazy(() => import('./pages/AdminSupportMonitorPage'))

/* ── Lazy support sayfaları ── */
const SupportDashboard = lazy(() => import('./pages/SupportDashboard'))
const SupportChatPage  = lazy(() => import('./pages/SupportChatPage'))

/* ── Sidebar nav items ── */
const ADMIN_NAV = [
  { to: '/admin',                   icon: LayoutDashboard, label: 'Dashboard'         },
  { to: '/admin/users',             icon: Users,           label: 'Kullanıcılar'      },
  { to: '/admin/jobs',              icon: Briefcase,       label: 'İşler'             },
  { to: '/admin/complaints',        icon: AlertCircle,     label: 'Şikayetler'        },
  { to: '/admin/messages',          icon: MessageSquare,   label: 'Mesajlar'          },
  { to: '/admin/withdrawals',       icon: Wallet,          label: 'Para Çekme'        },
  { to: '/admin/coupons',           icon: Tag,             label: 'Kuponlar'          },
  { to: '/admin/pricing',           icon: DollarSign,      label: 'Fiyatlandırma'     },
  { to: '/admin/certificates',      icon: Award,           label: 'Sertifikalar'      },
  { to: '/admin/pending-ustas',     icon: Clock,           label: 'Bekleyen Ustalar'  },
  { to: '/admin/campaigns',         icon: Megaphone,       label: 'Kampanyalar'       },
  { to: '/admin/finance',           icon: DollarSign,      label: 'Finans'            },
  { to: '/admin/promotions',        icon: Tag,             label: 'Promosyonlar'      },
  { to: '/admin/verification',      icon: ShieldCheck,     label: 'Doğrulama'         },
  { to: '/admin/support-monitor',   icon: Headphones,      label: 'Destek Monitörü'   },
]

const SUPPORT_NAV = [
  { to: '/support', icon: Headphones, label: 'Destek Paneli' },
]

/* ── Page loader ── */
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0d0d0d]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Yükleniyor...</p>
      </div>
    </div>
  )
}

/* ── Unauthorized ── */
function Unauthorized() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d0d0d]">
      <div className="text-center p-8 max-w-sm">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={36} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Erişim Reddedildi</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          Bu panel yalnızca <strong>Admin</strong> ve <strong>Destek</strong> personeline açıktır.
        </p>
        <button
          onClick={handleLogout}
          className="px-8 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition active:scale-95"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}

/* ── AdminSidebar ── */
function AdminSidebar({ open, onClose, role }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const navItems = role === 'support' ? SUPPORT_NAV : ADMIN_NAV

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-64
          bg-white dark:bg-[#0d1b2e] border-r border-gray-200 dark:border-white/[0.07]
          flex flex-col shadow-xl
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200 dark:border-white/[0.07]">
          <div>
            <p className="font-black text-lg text-gray-900 dark:text-white">Usta Go</p>
            <p className="text-xs text-gray-400 font-medium">
              {role === 'support' ? 'Destek Paneli' : 'Yönetim Paneli'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin' || to === '/support'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-200 dark:border-white/[0.07] space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? 'Açık Tema' : 'Koyu Tema'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  )
}

/* ── AdminLayout wrapper ── */
function AdminLayout({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0d0d0d] overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#0d1b2e] border-b border-gray-200 dark:border-white/[0.07]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-gray-900 dark:text-white text-sm">Usta Go Yönetim</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

/* ── Route guard ── */
function AdminRoute({ children, roleRequired }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  if (!user) return <Navigate to="/" replace />

  const role = user.role?.toLowerCase()

  /* Müşteri veya usta bu panele giremez */
  if (role !== 'admin' && role !== 'support') {
    return <Unauthorized />
  }

  if (roleRequired && role !== roleRequired) {
    if (role === 'admin') return <Navigate to="/admin" replace />
    if (role === 'support') return <Navigate to="/support" replace />
  }

  return children
}

/* ── Routes ── */
function AdminAppRoutes() {
  const { user } = useAuth()

  const role = user?.role?.toLowerCase()
  const isAdmin   = role === 'admin'
  const isSupport = role === 'support'

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Giriş: oturum yoksa AuthPage, varsa yönlendir */}
        <Route
          path="/"
          element={
            !user ? <AuthPage /> :
            isAdmin   ? <Navigate to="/admin" replace /> :
            isSupport ? <Navigate to="/support" replace /> :
            <Unauthorized />
          }
        />

        {/* ── Admin sayfaları ── */}
        <Route path="/admin" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminDashboard /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/withdrawals" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminWithdrawalsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminUsersPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/jobs" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminJobsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/complaints" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminComplaintsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/messages" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin">
              <PageErrorBoundary><AdminMessagesPage /></PageErrorBoundary>
            </AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/coupons" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminCouponsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/pricing" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminPricingPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/certificates" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminCertificatesPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/pending-ustas" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminPendingUstasPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/campaigns" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminCampaignsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/finance" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminFinancePage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/promotions" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminPromotionsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/verification" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminVerificationPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/support-monitor" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminSupportMonitorPage /></AdminLayout>
          </AdminRoute>
        } />

        {/* ── Destek personeli sayfaları ── */}
        <Route path="/support" element={
          <AdminRoute roleRequired="support">
            <AdminLayout role="support"><SupportDashboard /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/support/chat/:userId" element={
          <AdminRoute roleRequired="support">
            <AdminLayout role="support"><SupportChatPage /></AdminLayout>
          </AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

/* ── Root ── */
export default function AdminApp() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AdminAppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
