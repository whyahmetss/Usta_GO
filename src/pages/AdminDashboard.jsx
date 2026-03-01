import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { LogOut, Users, Briefcase, DollarSign, TrendingUp } from 'lucide-react'
import Logo from '../components/Logo'

function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeJobs: 0,
    totalRevenue: 0,
    totalJobs: 0
  })
  const [savedUsers, setSavedUsers] = useState([])
  const [allJobs, setAllJobs] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [allComplaints, setAllComplaints] = useState([])

  // Load dashboard data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch users, jobs and complaints in parallel
        const [usersResponse, jobsResponse, complaintsResponse] = await Promise.allSettled([
          fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
          fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=500`),
          fetchAPI(API_ENDPOINTS.COMPLAINTS.LIST),
        ])

        // Users
        const usersData = usersResponse.status === 'fulfilled' && Array.isArray(usersResponse.value?.data)
          ? usersResponse.value.data : []
        setSavedUsers(usersData)

        // Complaints
        const complaintsData = complaintsResponse.status === 'fulfilled' && Array.isArray(complaintsResponse.value?.data)
          ? complaintsResponse.value.data : []
        setAllComplaints(complaintsData)

        // Jobs
        const jobsRaw = jobsResponse.status === 'fulfilled' && Array.isArray(jobsResponse.value?.data)
          ? jobsResponse.value.data : []
        const mappedJobs = mapJobsFromBackend(jobsRaw).map(job => ({
          ...job,
          location: typeof job.location === 'string'
            ? { address: job.location }
            : (job.location || { address: 'Adres belirtilmedi' }),
        }))
        setAllJobs(mappedJobs)
        setRecentJobs([...mappedJobs]
          .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
          .slice(0, 5))

        // Revenue = sum of budget for all completed/rated jobs
        const totalRevenue = mappedJobs
          .filter(j => j.status === 'completed' || j.status === 'rated')
          .reduce((sum, j) => sum + (Number(j.budget) || Number(j.price) || 0), 0)

        const activeJobsCount = mappedJobs.filter(
          j => j.status !== 'completed' && j.status !== 'cancelled' && j.status !== 'rated'
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

  const handleLogout = () => { logout(); navigate('/') }

  const pendingWithdrawals = allJobs.filter(j => j.withdrawalRequest?.status === 'pending').length
  const openComplaints = allComplaints.filter(c => c.status === 'open').length

  const statsList = [
    { label: 'Toplam Kullanici', value: stats.totalUsers.toString(), icon: Users, color: 'blue' },
    { label: 'Aktif Isler', value: stats.activeJobs.toString(), icon: Briefcase, color: 'green' },
    { label: 'Toplam Gelir', value: `${stats.totalRevenue.toLocaleString('tr-TR')} TL`, icon: DollarSign, color: 'purple' },
    { label: 'Toplam Is', value: stats.totalJobs.toString(), icon: TrendingUp, color: 'orange' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Admin paneli yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Yenile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Paneli</h1>
              <p className="text-sm text-gray-500">Hoş geldin, {user?.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition">
            <LogOut size={18} /> Çıkış
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {statsList.map((stat, idx) => {
            const Icon = stat.icon
            const colorMap = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              orange: 'bg-orange-100 text-orange-600'
            }
            const textColorMap = {
              blue: 'text-blue-600',
              green: 'text-green-600',
              purple: 'text-purple-600',
              orange: 'text-orange-600'
            }
            return (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 ${colorMap[stat.color]} rounded-xl flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>
                  <div className={`text-3xl font-black ${textColorMap[stat.color]}`}>{stat.value}</div>
                </div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div onClick={() => navigate('/admin/users')} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4"><span className="text-3xl">👥</span></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Kullanıcı Yönetimi</h3>
            <p className="text-gray-600 text-sm">Müşteri ve Usta hesaplarını yönet</p>
          </div>
          <div onClick={() => navigate('/admin/jobs')} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4"><span className="text-3xl">📋</span></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">İş Yönetimi</h3>
            <p className="text-gray-600 text-sm">Tüm işleri görüntüle ve yönet</p>
          </div>
          <div onClick={() => navigate('/admin/withdrawals')} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4"><span className="text-3xl">💰</span></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Para Çekme Talepleri</h3>
            <p className="text-gray-600 text-sm">Usta ödemelerini onayla</p>
            {pendingWithdrawals > 0 && (
              <div className="mt-3">
                <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">{pendingWithdrawals} Bekliyor</span>
              </div>
            )}
          </div>
          <div onClick={() => navigate('/admin/complaints')} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4"><span className="text-3xl">🚨</span></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Şikayet Yönetimi</h3>
            <p className="text-gray-600 text-sm">Müşteri şikayetlerini yönet</p>
            {openComplaints > 0 && (
              <div className="mt-3">
                <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">{openComplaints} Açık</span>
              </div>
            )}
          </div>
          <div onClick={() => navigate('/admin/messages')} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4"><span className="text-3xl">📢</span></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Mesaj Sistemi</h3>
            <p className="text-gray-600 text-sm">Toplu mesaj gönder</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Son İşler</h3>
          {recentJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Henüz iş yok</p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map(job => (
                <div key={job.id} className={`flex items-center gap-4 p-4 rounded-xl ${
                  job.status === 'completed' || job.status === 'rated' ? 'bg-green-50' :
                  job.status === 'cancelled' ? 'bg-red-50' :
                  job.status === 'in_progress' ? 'bg-purple-50' :
                  job.status === 'accepted' ? 'bg-blue-50' : 'bg-yellow-50'
                }`}>
                  <span className="text-2xl">
                    {job.status === 'completed' || job.status === 'rated' ? '✅' :
                     job.status === 'cancelled' ? '❌' :
                     job.status === 'in_progress' ? '🔧' :
                     job.status === 'accepted' ? '👍' : '⏳'}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-600">{job.customer.name} - {job.location.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-600">{job.price} TL</p>
                    <span className={`text-xs font-bold ${
                      job.status === 'pending' ? 'text-yellow-600' :
                      job.status === 'accepted' ? 'text-blue-600' :
                      job.status === 'in_progress' ? 'text-purple-600' :
                      job.status === 'cancelled' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {job.status === 'pending' ? 'Bekliyor' :
                       job.status === 'accepted' ? 'Kabul Edildi' :
                       job.status === 'in_progress' ? 'Devam Ediyor' :
                       job.status === 'cancelled' ? 'İptal' :
                       job.status === 'rated' ? 'Değerlendirildi' : 'Tamamlandı'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Değerlendirmeler */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">⭐ Tüm Değerlendirmeler</h3>
          {allJobs.filter(j => j.rating).length === 0 ? (
            <p className="text-gray-500 text-center py-6">Henüz değerlendirme yok</p>
          ) : (
            <div className="space-y-3">
              {allJobs.filter(j => j.rating).slice(0, 10).map(job => (
                <div key={job.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{job.customer.name} → {job.professional?.name || 'Usta'}</p>
                      <p className="text-sm text-gray-600">{job.title}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < (job.rating || 0) ? '⭐' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                  {job.ratingReview && (
                    <p className="text-sm text-gray-700 bg-white p-2 rounded">"{job.ratingReview}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{new Date(job.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Şikayetler */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🚨 Tüm Şikayetler</h3>
          {allComplaints.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Henüz şikayet yok</p>
          ) : (
            <div className="space-y-3">
              {allComplaints.map(complaint => (
                <div key={complaint.id} className={`p-4 rounded-xl border-2 ${
                  complaint.status === 'resolved' ? 'bg-green-50 border-green-300' :
                  complaint.status === 'rejected' ? 'bg-red-50 border-red-300' :
                  'bg-orange-50 border-orange-300'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{complaint.customerName}</p>
                      <p className="text-sm text-gray-600">{complaint.jobTitle} - Neden: {complaint.reason}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      complaint.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {complaint.status === 'open' ? 'Açık' : complaint.status === 'resolved' ? 'Çözüldü' : 'Reddedildi'}
                    </span>
                  </div>
                  {complaint.details && (
                    <p className="text-sm text-gray-700 bg-white p-2 rounded mb-2">{complaint.details}</p>
                  )}
                  <div className="flex gap-2">
                    {complaint.status === 'open' && (
                      <>
                        <button
                          onClick={async () => {
                            await fetchAPI(API_ENDPOINTS.COMPLAINTS.RESOLVE(complaint.id), { method: 'PUT' })
                            setAllComplaints(prev => prev.map(c => c.id === complaint.id ? { ...c, status: 'resolved' } : c))
                          }}
                          className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >Çöz</button>
                        <button
                          onClick={async () => {
                            await fetchAPI(API_ENDPOINTS.COMPLAINTS.REJECT(complaint.id), { method: 'PUT' })
                            setAllComplaints(prev => prev.map(c => c.id === complaint.id ? { ...c, status: 'rejected' } : c))
                          }}
                          className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >Reddet</button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{new Date(complaint.filedAt).toLocaleDateString('tr-TR')}</p>
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
