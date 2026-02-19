import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, Users, Briefcase, DollarSign, TrendingUp } from 'lucide-react'

function AdminDashboard() {
  const { user, logout, withdrawals, transactions } = useAuth()
  const navigate = useNavigate()
  const [savedUsers, setSavedUsers] = useState(() => JSON.parse(localStorage.getItem('users') || '[]'))
  const [allJobs, setAllJobs] = useState(() => JSON.parse(localStorage.getItem('jobs') || '[]'))

  // Poll localStorage for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const jobs = JSON.parse(localStorage.getItem('jobs') || '[]')
      setSavedUsers(users)
      setAllJobs(jobs)
    }, 500) // Check every 500ms for faster updates
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  const totalUsers = savedUsers.length
  const activeJobs = allJobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled' && j.status !== 'rated').length
  const totalRevenue = transactions.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0)
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length

  const stats = [
    { label: 'Toplam Kullanici', value: totalUsers.toString(), icon: Users, color: 'blue' },
    { label: 'Aktif Isler', value: activeJobs.toString(), icon: Briefcase, color: 'green' },
    { label: 'Toplam Gelir', value: `${totalRevenue.toLocaleString('tr-TR')} TL`, icon: DollarSign, color: 'purple' },
    { label: 'Toplam Is', value: allJobs.length.toString(), icon: TrendingUp, color: 'orange' },
  ]

  const recentJobs = [...allJobs].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Paneli</h1>
              <p className="text-sm text-gray-500">Hos geldin, {user?.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition">
            <LogOut size={18} /> Cikis
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon size={24} className={`text-${stat.color}-600`} />
                  </div>
                  <div className={`text-3xl font-black text-${stat.color}-600`}>{stat.value}</div>
                </div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div onClick={() => navigate('/admin/users')} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4"><span className="text-3xl">👥</span></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Kullanici Yonetimi</h3>
            <p className="text-gray-600 text-sm">Musteri ve usta hesaplarini yonet</p>
          </div>
          <div onClick={() => navigate('/admin/jobs')} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4"><span className="text-3xl">📋</span></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Is Yonetimi</h3>
            <p className="text-gray-600 text-sm">Tum isleri goruntule ve yonet</p>
          </div>
          <div onClick={() => navigate('/admin/withdrawals')} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4"><span className="text-3xl">💰</span></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Para Cekme Talepleri</h3>
            <p className="text-gray-600 text-sm">Usta odemelerini onayla</p>
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
            {allJobs.filter(j => j.complaint?.status === 'open').length > 0 && (
              <div className="mt-3">
                <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">{allJobs.filter(j => j.complaint?.status === 'open').length} Açık</span>
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">Son Isler</h3>
          {recentJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Henuz is yok</p>
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
                       job.status === 'cancelled' ? 'Iptal' :
                       job.status === 'rated' ? 'Degerlendirildi' : 'Tamamlandi'}
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
                        <span key={i} className={i < (job.rating?.customerRating || job.rating?.professionalRating || 0) ? '⭐' : '☆'} />
                      ))}
                    </div>
                  </div>
                  {job.rating?.review && (
                    <p className="text-sm text-gray-700 bg-white p-2 rounded">"{job.rating.review}"</p>
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
          {allJobs.filter(j => j.complaint).length === 0 ? (
            <p className="text-gray-500 text-center py-6">Henüz şikayet yok</p>
          ) : (
            <div className="space-y-3">
              {allJobs.filter(j => j.complaint).map(job => (
                <div key={job.id} className={`p-4 rounded-xl border-2 ${
                  job.complaint?.status === 'resolved' ? 'bg-green-50 border-green-300' :
                  job.complaint?.status === 'rejected' ? 'bg-red-50 border-red-300' :
                  'bg-orange-50 border-orange-300'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{job.customer.name}</p>
                      <p className="text-sm text-gray-600">{job.title} - Neden: {job.complaint?.reason}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      job.complaint?.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      job.complaint?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {job.complaint?.status === 'open' ? 'Açık' : job.complaint?.status === 'resolved' ? 'Çözüldü' : 'Reddedildi'}
                    </span>
                  </div>
                  {job.complaint?.details && (
                    <p className="text-sm text-gray-700 bg-white p-2 rounded mb-2">{job.complaint.details}</p>
                  )}
                  <div className="flex gap-2">
                    {job.complaint?.status === 'open' && (
                      <>
                        <button className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Çöz</button>
                        <button className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reddet</button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{new Date(job.complaint?.filedAt).toLocaleDateString('tr-TR')}</p>
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
