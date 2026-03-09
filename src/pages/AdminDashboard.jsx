import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import {
  LogOut,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  UserCheck,
  Wallet,
  AlertCircle,
  MessageSquare,
  Ticket,
  Coins,
  Award,
  ClipboardList,
  Star,
  Inbox,
  Megaphone,
} from 'lucide-react'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeJobs: 0,
    totalRevenue: 0,
    totalJobs: 0,
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

        setStats({
          totalUsers: usersData.length,
          activeJobs: activeJobsCount,
          totalRevenue,
          totalJobs: jobsRaw.length,
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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

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
      color: 'primary',
    },
    {
      label: 'Aktif İşler',
      value: stats.activeJobs.toString(),
      icon: Briefcase,
      color: 'emerald',
    },
    {
      label: 'Toplam Gelir',
      value: `${stats.totalRevenue.toLocaleString('tr-TR')} TL`,
      icon: DollarSign,
      color: 'accent',
    },
    {
      label: 'Toplam İş',
      value: stats.totalJobs.toString(),
      icon: TrendingUp,
      color: 'violet',
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
      path: '/admin/pending-ustas',
      icon: UserCheck,
      title: 'Onay Bekleyen Ustalar',
      desc: 'Yeni usta kayıtlarını onayla',
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
      path: '/admin/withdrawals',
      icon: Wallet,
      title: 'Para Çekme Talepleri',
      desc: 'Usta ödemelerini onayla',
      color: 'amber',
      badge: pendingWithdrawals > 0 ? `${pendingWithdrawals} Bekliyor` : null,
    },
    {
      path: '/admin/complaints',
      icon: AlertCircle,
      title: 'Şikayet Yönetimi',
      desc: 'Müşteri şikayetlerini yönet',
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
      path: '/admin/coupons',
      icon: Ticket,
      title: 'Kupon Yönetimi',
      desc: 'Kupon oluştur ve yönet',
      color: 'accent',
    },
    {
      path: '/admin/pricing',
      icon: Coins,
      title: 'AI Fiyat Listesi',
      desc: 'Hizmet bazlı temel ücretleri yönet',
      color: 'violet',
    },
    {
      path: '/admin/certificates',
      icon: Award,
      title: 'Sertifika Onayları',
      desc: 'Usta sertifikalarını onayla',
      color: 'amber',
    },
    {
      path: '/admin/campaigns',
      icon: Megaphone,
      title: 'Kampanyalar',
      desc: 'Ana sayfa etkinlik ve kampanya yönet',
      color: 'rose',
    },
  ]

  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  if (loading) {
    return (
      <Layout hideNav>
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0F172A]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Admin paneli yükleniyor...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout hideNav>
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0F172A]">
          <div className="text-center">
            <p className="text-sm text-rose-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded-2xl font-semibold active:scale-[0.98] transition"
            >
              Yenile
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0F172A]">
        <PageHeader
          title="Admin Paneli"
          onBack={false}
          rightAction={
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-[0.98] transition"
            >
              <LogOut size={18} /> Çıkış
            </button>
          }
        />

        <div className="max-w-2xl mx-auto px-4 pb-8">
          <p className="text-sm text-gray-500 -mt-2 mb-6">
            Hoş geldin, {user?.name}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {statsList.map((stat, idx) => {
              const palettes = [
                { from: '#2563EB', to: '#1D4ED8' }, // mavi — toplam kullanıcı
                { from: '#8B5CF6', to: '#7C3AED' }, // mor — aktif işler
                { from: '#22C55E', to: '#16A34A' }, // yeşil — gelir
                { from: '#F59E0B', to: '#D97706' }, // turuncu — toplam iş
              ]
              const p = palettes[idx % palettes.length]
              const StatIcon = stat.icon
              return (
                <div
                  key={idx}
                  className="rounded-2xl p-4 text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)` }}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <StatIcon size={18} className="text-white" />
                  </div>
                  <p className="text-xl font-bold leading-tight">{stat.value}</p>
                  <p className="text-[11px] mt-0.5 text-white/75 font-medium">{stat.label}</p>
                </div>
              )
            })}
          </div>

          {/* Management Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {managementItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <Card
                  key={idx}
                  onClick={() => navigate(item.path)}
                  padding="p-4"
                >
                  <div className="flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          colorMap[item.color] || colorMap.primary
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-snug">{item.desc}</p>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Recent Jobs */}
          <Card padding="p-4" className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Son İşler
            </h2>
            {recentJobs.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Henüz iş yok"
                description="Yeni işler burada görünecek"
              />
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {job.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {job.customer?.name} — {job.location?.address}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-semibold text-emerald-600">
                        {job.price ?? job.budget} TL
                      </p>
                      <StatusBadge status={job.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Ratings */}
          <Card padding="p-4" className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Tüm Değerlendirmeler
            </h2>
            {allJobs.filter((j) => j.rating).length === 0 ? (
              <EmptyState
                icon={Star}
                title="Henüz değerlendirme yok"
                description="Müşteri değerlendirmeleri burada görünecek"
              />
            ) : (
              <div className="space-y-3">
                {allJobs
                  .filter((j) => j.rating)
                  .slice(0, 10)
                  .map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-xl bg-primary-50/50 border border-gray-100"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {job.customer?.name} → {job.professional?.name || 'Usta'}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {job.title}
                          </p>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < (job.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                          ))}
                        </div>
                      </div>
                      {job.ratingReview && (
                        <p className="text-xs text-gray-700 bg-white/60 p-2 rounded-lg">
                          "{job.ratingReview}"
                        </p>
                      )}
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Complaints */}
          <Card padding="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Tüm Şikayetler
              </h2>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'open', label: 'Bekleyen' },
                  { key: 'resolved', label: 'Çözüldü' },
                  { key: 'rejected', label: 'Reddedildi' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setComplaintFilter(tab.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                      complaintFilter === tab.key
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <div className="space-y-3">
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
                          ? 'bg-emerald-50/50 border-emerald-100'
                          : complaint.status === 'rejected'
                          ? 'bg-rose-50/50 border-rose-100'
                          : 'bg-amber-50/50 border-amber-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {complaint.customerName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
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
                        <p className="text-xs text-gray-700 bg-white/60 p-2 rounded-lg">
                          {complaint.details}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-500 mt-2">
                        {new Date(complaint.filedAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default AdminDashboard
