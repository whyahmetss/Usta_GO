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
import { ThemeProvider } from './context/ThemeContext'
import PageErrorBoundary from './components/PageErrorBoundary'
import AuthPage from './pages/AuthPage'
import {
  LayoutDashboard, Users, Briefcase, MessageSquare, AlertCircle,
  Wallet, Tag, DollarSign, Award, Clock, Megaphone, ShieldCheck,
  Headphones, LogOut, Menu, X, Building2,
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
const AdminHavalePage         = lazy(() => import('./pages/AdminHavalePage'))

/* ── Lazy support sayfaları ── */
const SupportDashboard = lazy(() => import('./pages/SupportDashboard'))
const SupportChatPage  = lazy(() => import('./pages/SupportChatPage'))
const SupportGuidePage = lazy(() => import('./pages/SupportGuidePage'))

/* ── Sidebar nav items (grouped) ── */
const ADMIN_NAV = [
  { group: 'GENEL' },
  { to: '/admin',                   icon: LayoutDashboard, label: 'Dashboard'         },
  { to: '/admin/users',             icon: Users,           label: 'Kullanıcılar'      },
  { to: '/admin/jobs',              icon: Briefcase,       label: 'İşler'             },
  { to: '/admin/messages',          icon: MessageSquare,   label: 'Mesajlar'          },
  { group: 'FİNANS' },
  { to: '/admin/finance',           icon: DollarSign,      label: 'Muhasebe'          },
  { to: '/admin/withdrawals',       icon: Wallet,          label: 'Para Çekme'        },
  { to: '/admin/havale',            icon: Building2,       label: 'Havale Talepleri'  },
  { to: '/admin/pricing',           icon: DollarSign,      label: 'Fiyatlandırma'     },
  { group: 'İŞLEMLER' },
  { to: '/admin/complaints',        icon: AlertCircle,     label: 'Şikayetler'        },
  { to: '/admin/verification',      icon: ShieldCheck,     label: 'Doğrulama'         },
  { to: '/admin/pending-ustas',     icon: Clock,           label: 'Bekleyen Ustalar'  },
  { to: '/admin/certificates',      icon: Award,           label: 'Sertifikalar'      },
  { group: 'SİSTEM' },
  { to: '/admin/campaigns',         icon: Megaphone,       label: 'Kampanyalar'       },
  { to: '/admin/coupons',           icon: Tag,             label: 'Kuponlar'          },
  { to: '/admin/promotions',        icon: Tag,             label: 'Promosyonlar'      },
  { to: '/admin/support-monitor',   icon: Headphones,      label: 'Destek Monitörü'   },
]

const SUPPORT_NAV = [
  { to: '/support', icon: Headphones, label: 'Destek Paneli' },
]

/* ── Page loader ── */
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500 font-medium">Yükleniyor...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center p-8 max-w-sm">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={36} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Erişim Reddedildi</h2>
        <p className="text-zinc-400 text-sm mb-8">
          Bu panel yalnızca <strong className="text-white">Admin</strong> ve <strong className="text-white">Destek</strong> personeline açıktır.
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-64
          bg-zinc-900 border-r border-white/[0.06]
          flex flex-col
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <div>
            <p className="font-black text-lg text-white tracking-tight">Usta Go</p>
            <p className="text-[11px] text-zinc-500 font-medium">
              {role === 'support' ? 'Destek Paneli' : 'Yönetim Paneli'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items with groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          {navItems.map((item, idx) => {
            if (item.group) {
              return (
                <p key={`g-${idx}`} className={`text-[10px] font-semibold tracking-widest uppercase text-zinc-500 px-3 ${idx > 0 ? 'mt-5' : ''} mb-2`}>
                  {item.group}
                </p>
              )
            }
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin' || item.to === '/support'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.8} />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={16} />
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
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-white/[0.06]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] transition"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-white text-sm">Usta Go Yönetim</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
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
        <Route path="/admin/havale" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminHavalePage /></AdminLayout>
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
        <Route path="/support/guide" element={
          <AdminRoute roleRequired="support">
            <AdminLayout role="support"><SupportGuidePage /></AdminLayout>
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
