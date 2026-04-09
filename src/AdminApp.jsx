/**
 * AdminApp — Usta Go Yönetim Paneli
 *
 * Bu dosya SADECE admin-panel build'ına girer.
 * Müşteri / Usta mobil bundle'ıyla HİÇBİR ilişkisi yoktur.
 * Aynı backend API'sini kullanır (config.js → API_URL).
 */

import { lazy, Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PageErrorBoundary from './components/PageErrorBoundary'
import AuthPage from './pages/AuthPage'
import {
  LayoutDashboard, Users, Briefcase, MessageSquare, AlertCircle,
  Wallet, Tag, DollarSign, Award, Clock, ShieldCheck,
  Headphones, LogOut, Menu, X, Building2,
  BarChart2, FileText, Shield, MapPin, Scale, Percent, Zap, Crown,
  BookOpen, Bell, Settings,
  ShieldAlert, Heart, Trophy, Brain,
  Search, ChevronDown, ChevronRight, Pin, Command, Star,
  Ticket, BookOpen as BookOpenIcon, Activity, Webhook, Layers, StickyNote, MessageCircle,
} from 'lucide-react'

/* ── Lazy admin sayfaları ── */
const AdminDashboard          = lazy(() => import('./pages/AdminDashboard'))
const AdminWithdrawalsPage    = lazy(() => import('./pages/AdminWithdrawalsPage'))
const AdminUsersPage          = lazy(() => import('./pages/AdminUsersPage'))
const AdminJobsPage           = lazy(() => import('./pages/AdminJobsPage'))
const AdminComplaintsPage     = lazy(() => import('./pages/AdminComplaintsPage'))
const AdminMessagesPage       = lazy(() => import('./pages/AdminMessagesPage'))
const AdminPricingPage        = lazy(() => import('./pages/AdminPricingPage'))
const AdminCertificatesPage   = lazy(() => import('./pages/AdminCertificatesPage'))
const AdminPendingUstasPage   = lazy(() => import('./pages/AdminPendingUstasPage'))
const AdminFinancePage        = lazy(() => import('./pages/AdminFinancePage'))
const AdminPromotionsPage     = lazy(() => import('./pages/AdminPromotionsPage'))
const AdminVerificationPage   = lazy(() => import('./pages/AdminVerificationPage'))
const AdminSupportMonitorPage = lazy(() => import('./pages/AdminSupportMonitorPage'))
const AdminHavalePage         = lazy(() => import('./pages/AdminHavalePage'))
const AdminAnalyticsPage      = lazy(() => import('./pages/AdminAnalyticsPage'))
const AdminUstaDetailPage     = lazy(() => import('./pages/AdminUstaDetailPage'))
const AdminReportsPage        = lazy(() => import('./pages/AdminReportsPage'))
const AdminAuditLogPage       = lazy(() => import('./pages/AdminAuditLogPage'))
const AdminRegionsPage        = lazy(() => import('./pages/AdminRegionsPage'))
const AdminDisputesPage       = lazy(() => import('./pages/AdminDisputesPage'))
const AdminCommissionPage     = lazy(() => import('./pages/AdminCommissionPage'))
const AdminAutomationPage     = lazy(() => import('./pages/AdminAutomationPage'))
const AdminUstaLevelsPage     = lazy(() => import('./pages/AdminUstaLevelsPage'))
const AdminCMSPage            = lazy(() => import('./pages/AdminCMSPage'))
const AdminNotificationHubPage = lazy(() => import('./pages/AdminNotificationHubPage'))
const AdminSystemConfigPage   = lazy(() => import('./pages/AdminSystemConfigPage'))
const AdminFraudPage          = lazy(() => import('./pages/AdminFraudPage'))
const AdminCRMPage            = lazy(() => import('./pages/AdminCRMPage'))
const AdminGamificationPage   = lazy(() => import('./pages/AdminGamificationPage'))
const AdminAICommandPage      = lazy(() => import('./pages/AdminAICommandPage'))
const AdminTicketsPage        = lazy(() => import('./pages/AdminTicketsPage'))
const AdminChangelogPage      = lazy(() => import('./pages/AdminChangelogPage'))
const AdminStatusPage         = lazy(() => import('./pages/AdminStatusPage'))
const AdminWebhookLogPage     = lazy(() => import('./pages/AdminWebhookLogPage'))
const AdminBulkOpsPage        = lazy(() => import('./pages/AdminBulkOpsPage'))
const AdminNotesPage          = lazy(() => import('./pages/AdminNotesPage'))
const AdminCannedResponsesPage = lazy(() => import('./pages/AdminCannedResponsesPage'))
const NotFoundPage             = lazy(() => import('./pages/NotFoundPage'))

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
  { to: '/admin/promotions',        icon: Tag,             label: 'Promosyonlar'      },
  { to: '/admin/support-monitor',   icon: Headphones,      label: 'Destek Monitörü'   },
  { group: 'ANALİTİK' },
  { to: '/admin/analytics',         icon: BarChart2,       label: 'Analitik'          },
  { to: '/admin/reports',           icon: FileText,        label: 'Raporlar'          },
  { to: '/admin/audit-log',         icon: Shield,          label: 'Denetim Logu'      },
  { group: 'ÖLÇEKLENME' },
  { to: '/admin/regions',           icon: MapPin,          label: 'Bölgeler'          },
  { to: '/admin/disputes',          icon: Scale,           label: 'Arabuluculuk'      },
  { to: '/admin/commission',        icon: Percent,         label: 'Komisyon'          },
  { to: '/admin/automation',        icon: Zap,             label: 'Otomasyon'         },
  { to: '/admin/usta-levels',       icon: Crown,           label: 'Usta Seviyeleri'   },
  { group: 'PLATFORM' },
  { to: '/admin/cms',                icon: BookOpen,        label: 'İçerik (CMS)'       },
  { to: '/admin/notifications',      icon: Bell,            label: 'Bildirim Merkezi'  },
  { to: '/admin/system-config',      icon: Settings,        label: 'Sistem Ayarları'   },
  { group: 'OPERASYON' },
  { to: '/admin/tickets',            icon: Ticket,          label: 'Ic Gorevler'       },
  { to: '/admin/notes',              icon: StickyNote,      label: 'Admin Notlari'     },
  { to: '/admin/canned-responses',   icon: MessageCircle,   label: 'Hazir Yanitlar'    },
  { to: '/admin/bulk-ops',           icon: Layers,          label: 'Toplu Islem'       },
  { group: 'ALTYAPI' },
  { to: '/admin/changelog',          icon: BookOpen,        label: 'Changelog'         },
  { to: '/admin/status',             icon: Activity,        label: 'Sistem Durumu'     },
  { to: '/admin/webhook-log',        icon: Webhook,         label: 'Event Log'         },
  { group: 'SÜPER ADMİN' },
  { to: '/admin/fraud',              icon: ShieldAlert,     label: 'Fraud & Risk'      },
  { to: '/admin/crm',               icon: Heart,           label: 'Müşteri CRM'       },
  { to: '/admin/gamification',       icon: Trophy,          label: 'Gamification'      },
  { to: '/admin/ai-command',         icon: Brain,           label: 'AI Komut'          },
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

/* ── Global Search Modal (Cmd+K) ── */
function GlobalSearchModal({ open, onClose, navItems, role }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose('toggle') }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const links = navItems.filter(i => i.to)
  const results = query.length > 0
    ? links.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.to.includes(query.toLowerCase()))
    : links

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose} role="dialog" aria-modal="true" aria-label="Global arama">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search size={16} className="text-zinc-500 flex-shrink-0" aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Sayfa ara... (Cmd+K)"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none" aria-label="Sayfa ara" role="searchbox" />
          <kbd className="hidden sm:inline text-[10px] text-zinc-600 font-mono border border-white/[0.06] rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-6">Sonuc bulunamadi</p>
          ) : results.map(item => {
            const Icon = item.icon
            return (
              <button key={item.to} onClick={() => { navigate(item.to); onClose() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/[0.06] transition">
                <Icon size={15} className="text-zinc-500 flex-shrink-0" />
                <span className="text-xs font-medium text-zinc-300">{item.label}</span>
                <span className="ml-auto text-[10px] text-zinc-700 font-mono">{item.to}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── AdminSidebar ── */
function AdminSidebar({ open, onClose, role }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navItems = role === 'support' ? SUPPORT_NAV : ADMIN_NAV
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_sidebar_collapsed') || '{}') } catch { return {} }
  })
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_sidebar_favorites') || '[]') } catch { return [] }
  })

  const handleLogout = () => { logout(); navigate('/') }

  const toggleGroup = (group) => {
    const next = { ...collapsedGroups, [group]: !collapsedGroups[group] }
    setCollapsedGroups(next)
    localStorage.setItem('usta_sidebar_collapsed', JSON.stringify(next))
  }

  const toggleFavorite = (to) => {
    const next = favorites.includes(to) ? favorites.filter(f => f !== to) : [...favorites, to]
    setFavorites(next)
    localStorage.setItem('usta_sidebar_favorites', JSON.stringify(next))
  }

  const filteredNav = useMemo(() => {
    if (!sidebarSearch) return navItems
    return navItems.filter(item => item.group || (item.label && item.label.toLowerCase().includes(sidebarSearch.toLowerCase())))
  }, [navItems, sidebarSearch])

  const favoriteItems = navItems.filter(i => i.to && favorites.includes(i.to))

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full z-40 w-64 bg-zinc-900 border-r border-white/[0.06] flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`} role="navigation" aria-label="Ana navigasyon">
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <p className="font-black text-lg text-white tracking-tight">Usta Go</p>
            <p className="text-[11px] text-zinc-500 font-medium">{role === 'support' ? 'Destek Paneli' : 'Yonetim Paneli'}</p>
          </div>
          <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] transition"><X size={18} /></button>
        </div>

        {/* Sidebar search */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} placeholder="Menu ara..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.04] rounded-lg text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/[0.1]" aria-label="Menude ara" />
          </div>
        </div>

        {/* Favorites */}
        {favoriteItems.length > 0 && !sidebarSearch && (
          <div className="px-3 pt-2 pb-1">
            <p className="text-[9px] font-semibold tracking-widest uppercase text-amber-500/70 px-3 mb-1">FAVORILER</p>
            {favoriteItems.map(item => {
              const Icon = item.icon
              return (
                <NavLink key={`fav-${item.to}`} to={item.to} end={item.to === '/admin' || item.to === '/support'} onClick={onClose}
                  className={({ isActive }) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    isActive ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                  }`}>
                  <Icon size={14} strokeWidth={1.8} />
                  <span className="flex-1 truncate">{item.label}</span>
                  <Star size={10} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                </NavLink>
              )
            })}
          </div>
        )}

        {/* Nav items with collapsible groups */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          {(() => {
            let currentGroup = null
            return filteredNav.map((item, idx) => {
              if (item.group) {
                currentGroup = item.group
                if (sidebarSearch) return null
                const isCollapsed = collapsedGroups[item.group]
                return (
                  <button key={`g-${idx}`} onClick={() => toggleGroup(item.group)}
                    className={`w-full flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-zinc-500 px-3 ${idx > 0 ? 'mt-4' : ''} mb-1 hover:text-zinc-400 transition`}>
                    {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                    {item.group}
                  </button>
                )
              }
              if (!sidebarSearch && currentGroup && collapsedGroups[currentGroup]) return null
              const Icon = item.icon
              const isActive = location.pathname === item.to || (item.to !== '/admin' && item.to !== '/support' && location.pathname.startsWith(item.to))
              return (
                <div key={item.to} className="group relative flex items-center">
                  <NavLink to={item.to} end={item.to === '/admin' || item.to === '/support'} onClick={onClose}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                      isActive ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}>
                    <Icon size={15} strokeWidth={1.8} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </NavLink>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.to) }}
                    className={`absolute right-1 w-6 h-6 rounded flex items-center justify-center transition ${
                      favorites.includes(item.to) ? 'text-amber-400 opacity-100' : 'text-zinc-700 opacity-0 group-hover:opacity-100'
                    }`}>
                    <Star size={9} fill={favorites.includes(item.to) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              )
            })
          })()}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition">
            <LogOut size={16} /> Cikis Yap
          </button>
        </div>
      </aside>
    </>
  )
}

/* ── Breadcrumb ── */
function Breadcrumb({ navItems }) {
  const location = useLocation()
  const current = navItems.find(i => i.to && (location.pathname === i.to || (i.to !== '/admin' && i.to !== '/support' && location.pathname.startsWith(i.to))))
  if (!current || current.to === '/admin' || current.to === '/support') return null
  return (
    <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-600 px-6 pt-4 pb-0">
      <span className="hover:text-zinc-400 cursor-default">Dashboard</span>
      <ChevronRight size={10} />
      <span className="text-zinc-400 font-medium">{current.label}</span>
    </div>
  )
}

/* ── AdminLayout wrapper ── */
function AdminLayout({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navItems = role === 'support' ? SUPPORT_NAV : ADMIN_NAV

  const handleSearchToggle = useCallback((action) => {
    if (action === 'toggle') setSearchOpen(p => !p)
    else setSearchOpen(false)
  }, [])

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />
      <GlobalSearchModal open={searchOpen} onClose={handleSearchToggle} navItems={navItems} role={role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 backdrop-blur border-b border-white/[0.06]">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] transition">
            <Menu size={20} />
          </button>
          <span className="lg:hidden font-semibold text-white text-sm">Usta Go</span>

          {/* Desktop search trigger */}
          <button onClick={() => setSearchOpen(true)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg hover:border-white/[0.1] transition flex-1 max-w-xs">
            <Search size={13} className="text-zinc-600" />
            <span className="text-[11px] text-zinc-600 flex-1 text-left">Ara...</span>
            <kbd className="text-[9px] text-zinc-700 font-mono border border-white/[0.06] rounded px-1 py-0.5">⌘K</kbd>
          </button>

          <div className="flex-1" />

          {/* Mobile search */}
          <button onClick={() => setSearchOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] transition">
            <Search size={18} />
          </button>

          {/* Notification bell */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] transition">
            <Bell size={18} />
          </button>
        </div>

        {/* Breadcrumb */}
        <Breadcrumb navItems={navItems} />

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
        <Route path="/admin/analytics" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminAnalyticsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/users/:id" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminUstaDetailPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/reports" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminReportsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/audit-log" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminAuditLogPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/regions" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminRegionsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/disputes" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminDisputesPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/commission" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminCommissionPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/automation" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminAutomationPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/usta-levels" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminUstaLevelsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/cms" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminCMSPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/notifications" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminNotificationHubPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/system-config" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminSystemConfigPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/fraud" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminFraudPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/crm" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminCRMPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/gamification" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminGamificationPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/ai-command" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminAICommandPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/tickets" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminTicketsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/changelog" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminChangelogPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/status" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminStatusPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/webhook-log" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminWebhookLogPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/bulk-ops" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminBulkOpsPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/notes" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminNotesPage /></AdminLayout>
          </AdminRoute>
        } />
        <Route path="/admin/canned-responses" element={
          <AdminRoute roleRequired="admin">
            <AdminLayout role="admin"><AdminCannedResponsesPage /></AdminLayout>
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

        <Route path="*" element={<NotFoundPage />} />
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
