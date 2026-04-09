import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertCircle,
  MessageSquare,
  Coins,
  Award,
  ClipboardList,
  Star,
  Inbox,
  Megaphone,
  BarChart2,
  Headphones,
} from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeJobs: 0,
    totalRevenue: 0,
    totalJobs: 0,
    activeUstas: 0,
  })
  const [savedUsers, setSavedUsers] = useState([])
  const [allJobs, setAllJobs] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [allComplaints, setAllComplaints] = useState([])
  const [complaintFilter, setComplaintFilter] = useState('all')

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [usersResponse, jobsResponse, complaintsResponse] = await Promise.allSettled([
          fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
          fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=500`),
          fetchAPI(API_ENDPOINTS.COMPLAINTS.LIST),
        ])

        const usersData =
          usersResponse.status === 'fulfilled' && Array.isArray(usersResponse.value?.data)
            ? usersResponse.value.data
            : []
        setSavedUsers(usersData)

        const complaintsData =
          complaintsResponse.status === 'fulfilled' &&
          Array.isArray(complaintsResponse.value?.data)
            ? complaintsResponse.value.data
            : []
        setAllComplaints(complaintsData)

        const jobsRaw =
          jobsResponse.status === 'fulfilled' && Array.isArray(jobsResponse.value?.data)
            ? jobsResponse.value.data
            : []
        const mappedJobs = mapJobsFromBackend(jobsRaw).map((job) => ({
          ...job,
          location:
            typeof job.location === 'string'
              ? { address: job.location }
              : (job.location || { address: 'Adres belirtilmedi' }),
        }))
        setAllJobs(mappedJobs)
        setRecentJobs(
          [...mappedJobs]
            .sort(
              (a, b) =>
                new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
            )
            .slice(0, 5)
        )

        const totalRevenue = mappedJobs
          .filter((j) => j.status === 'completed' || j.status === 'rated')
          .reduce((sum, j) => sum + (Number(j.budget) || Number(j.price) || 0), 0)

        const activeJobsCount = mappedJobs.filter(
          (j) =>
            j.status !== 'completed' &&
            j.status !== 'cancelled' &&
            j.status !== 'rated'
        ).length

        const activeUstaCount = usersData.filter(
          (u) => (u.role === 'USTA' || u.role === 'professional') && u.status === 'ACTIVE' && u.isActive !== false
        ).length

        setStats({
          totalUsers: usersData.length,
          activeJobs: activeJobsCount,
          totalRevenue,
          totalJobs: jobsRaw.length,
          activeUstas: activeUstaCount,
        })
      } catch (err) {
        console.error('Load dashboard error:', err)
        setError(err.message || 'Veri yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const pendingWithdrawals = allJobs.filter(
    (j) => j.withdrawalRequest?.status === 'pending'
  ).length
  const openComplaints = allComplaints.filter((c) => c.status === 'open').length
  const pendingUstas = savedUsers.filter(
    (u) => u.role === 'USTA' && u.status === 'PENDING_APPROVAL'
  ).length

  const statsList = [
    {
      label: 'Toplam Kullanıcı',
      value: stats.totalUsers.toString(),
      icon: Users,
      iconColor: 'text-blue-400',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Aktif İşler',
      value: stats.activeJobs.toString(),
      icon: Briefcase,
      iconColor: 'text-emerald-400',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'Toplam Gelir',
      value: `${stats.totalRevenue.toLocaleString('tr-TR')} TL`,
      icon: DollarSign,
      iconColor: 'text-amber-400',
      trend: '+18%',
      trendUp: true,
    },
    {
      label: 'Toplam İş',
      value: stats.totalJobs.toString(),
      icon: TrendingUp,
      iconColor: 'text-violet-400',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Aktif Usta',
      value: stats.activeUstas.toString(),
      icon: UserCheck,
      iconColor: 'text-teal-400',
      trend: '+3%',
      trendUp: true,
    },
  ]

  const managementItems = [
    {
      path: '/admin/users',
      icon: Users,
      title: 'Kullanıcı Yönetimi',
      desc: 'Müşteri ve Usta hesaplarını yönet',
      color: 'primary',
    },
    {
      path: '/admin/verification',
      icon: UserCheck,
      title: 'Onay & Sertifika',
      desc: 'Usta/Müşteri onay ve tüm belgeler',
      color: 'amber',
      badge: pendingUstas > 0 ? `${pendingUstas} Bekliyor` : null,
    },
    {
      path: '/admin/jobs',
      icon: Briefcase,
      title: 'İş Yönetimi',
      desc: 'Tüm işleri görüntüle ve yönet',
      color: 'emerald',
    },
    {
      path: '/admin/finance',
      icon: BarChart2,
      title: 'Muhasebe',
      desc: 'Ciro, komisyon, çekim talepleri ve işlem geçmişi',
      color: 'emerald',
    },
    {
      path: '/admin/complaints',
      icon: AlertCircle,
      title: 'Şikayetler ve Değerlendirmeler',
      desc: 'Müşteri şikayetleri ve kullanıcı değerlendirmeleri',
      color: 'rose',
      badge: openComplaints > 0 ? `${openComplaints} Açık` : null,
    },
    {
      path: '/admin/messages',
      icon: MessageSquare,
      title: 'Mesaj Sistemi',
      desc: 'Toplu mesaj gönder',
      color: 'violet',
    },
    {
      path: '/admin/promotions',
      icon: Megaphone,
      title: 'Kampanya & Kuponlar',
      desc: 'Kampanya, kupon ve davet bonusu yönet',
      color: 'rose',
    },
    {
      path: '/admin/pricing',
      icon: Coins,
      title: 'Fiyat Listesi',
      desc: 'Hizmet bazlı temel ücretleri yönet',
      color: 'violet',
    },
    {
      path: '/admin/support-monitor',
      icon: Headphones,
      title: 'Canlı Destek Takibi',
      desc: 'Temsilci performansı, oturumlar ve puanlar',
      color: 'teal',
    },
  ]

  const colorMap = {
    primary: 'bg-blue-500/10 text-blue-400',
    accent: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    violet: 'bg-violet-500/10 text-violet-400',
    teal: 'bg-teal-500/10 text-teal-400',
  }

  // Mini sparkline SVG
  const Sparkline = ({ color = '#3b82f6' }) => (
    <svg width="64" height="28" viewBox="0 0 64 28" fill="none" className="opacity-40">
      <polyline points="0,22 8,18 16,20 24,12 32,14 40,8 48,10 56,4 64,6" stroke={color} strokeWidth="1.5" fill="none" />
      <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
      <polygon points="0,22 8,18 16,20 24,12 32,14 40,8 48,10 56,4 64,6 64,28 0,28" fill={`url(#sg-${color.replace('#','')})`} />
    </svg>
  )

  const sparkColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-500">Admin paneli yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-rose-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold active:scale-[0.98] transition"
          >
            Yenile
          </button>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Hoş geldin, {user?.name}</p>
        </div>

        <div className="max-w-6xl mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statsList.map((stat, idx) => {
              const StatIcon = stat.icon
              return (
                <div
                  key={idx}
                  className="bg-zinc-900 rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.1] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.06]`}>
                      <StatIcon size={16} className={stat.iconColor} strokeWidth={1.8} />
                    </div>
                    <Sparkline color={sparkColors[idx % sparkColors.length]} />
                  </div>
                  <p className="text-2xl font-bold text-white tracking-tight leading-none">{stat.value}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px] text-zinc-500 font-medium">{stat.label}</p>
                    {stat.trend && (
                      <span className={`text-[10px] font-semibold ${stat.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Management Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {managementItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className="bg-zinc-900 rounded-2xl p-4 border border-white/[0.06] hover:border-white/[0.12] hover:bg-zinc-800/80 transition-all text-left active:scale-[0.98]"
                >
                  <div className="flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          colorMap[item.color] || colorMap.primary
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[13px] font-semibold text-white mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-snug">{item.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Recent Jobs */}
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 mb-6">
            <h2 className="text-[15px] font-semibold text-white mb-4">
              Son İşler
            </h2>
            {recentJobs.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Henüz iş yok"
                description="Yeni işler burada görünecek"
              />
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {job.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {job.customer?.name} — {job.location?.address}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-semibold text-emerald-400">
                        {job.price ?? job.budget} TL
                      </p>
                      <StatusBadge status={job.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ratings */}
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 mb-6">
            <h2 className="text-[15px] font-semibold text-white mb-4">
              Tüm Değerlendirmeler
            </h2>
            {allJobs.filter((j) => j.rating).length === 0 ? (
              <EmptyState
                icon={Star}
                title="Henüz değerlendirme yok"
                description="Müşteri değerlendirmeleri burada görünecek"
              />
            ) : (
              <div className="space-y-2">
                {allJobs
                  .filter((j) => j.rating)
                  .slice(0, 10)
                  .map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-200 truncate">
                            {job.customer?.name} → {job.professional?.name || 'Usta'}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {job.title}
                          </p>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < (job.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
                          ))}
                        </div>
                      </div>
                      {job.ratingReview && (
                        <p className="text-xs text-zinc-400 bg-white/[0.04] p-2 rounded-lg">
                          "{job.ratingReview}"
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-600 mt-2 font-medium">
                        {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Complaints */}
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-white">
                Tüm Şikayetler
              </h2>
              <div className="flex gap-1.5">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'open', label: 'Bekleyen' },
                  { key: 'resolved', label: 'Çözüldü' },
                  { key: 'rejected', label: 'Reddedildi' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setComplaintFilter(tab.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition ${
                      complaintFilter === tab.key
                        ? 'bg-white/[0.1] text-white'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {allComplaints.filter(
              (c) => complaintFilter === 'all' || c.status === complaintFilter
            ).length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Bu kategoride şikayet yok"
                description="Şikayetler filtreye göre listelenecek"
              />
            ) : (
              <div className="space-y-2">
                {allComplaints
                  .filter(
                    (c) =>
                      complaintFilter === 'all' || c.status === complaintFilter
                  )
                  .map((complaint) => (
                    <div
                      key={complaint.id}
                      className={`p-3 rounded-xl border ${
                        complaint.status === 'resolved'
                          ? 'bg-emerald-500/[0.05] border-emerald-500/10'
                          : complaint.status === 'rejected'
                          ? 'bg-rose-500/[0.05] border-rose-500/10'
                          : 'bg-amber-500/[0.05] border-amber-500/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-200">
                            {complaint.customerName}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {complaint.jobTitle} — {complaint.reason}
                          </p>
                        </div>
                        <StatusBadge
                          status={
                            complaint.status === 'open'
                              ? 'pending'
                              : complaint.status
                          }
                          label={
                            complaint.status === 'open'
                              ? 'Bekliyor'
                              : undefined
                          }
                          size="sm"
                        />
                      </div>
                      {complaint.details && (
                        <p className="text-xs text-zinc-400 bg-white/[0.04] p-2 rounded-lg">
                          {complaint.details}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-600 mt-2">
                        {new Date(complaint.filedAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}

export default AdminDashboard
