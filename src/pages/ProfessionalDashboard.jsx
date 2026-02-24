import { useState, useEffect } from 'react'
import { Bell, Menu, Home, Briefcase, MessageSquare, User, DollarSign, Star, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { useNavigate } from 'react-router-dom'
import HamburgerMenu from '../components/HamburgerMenu.jsx'
import Logo from '../components/Logo'

function ProfessionalDashboard() {
  const { user, getUnreadNotificationCount, getUnreadMessageCount } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allJobs, setAllJobs] = useState([])
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0)
  const [balance, setBalance] = useState(0)

  const unreadNotifs = getUnreadNotificationCount()
  const unreadMessages = getUnreadMessageCount()

  // Load professional dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const jobsResponse = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
        if (jobsResponse.data && Array.isArray(jobsResponse.data)) {
          setAllJobs(jobsResponse.data)
        }

        // Load wallet data
        const walletResponse = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (walletResponse.data) {
          setThisMonthEarnings(walletResponse.data.thisMonthEarnings || 0)
          setBalance(walletResponse.data.balance || 0)
        }
      } catch (err) {
        console.error('Load dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'professional') {
      loadDashboardData()
    }
  }, [user])

  const jobRequests = allJobs.filter(j => j.status === 'pending')
  const myCompletedJobs = allJobs.filter(j => j.professional?.id === user?.id && (j.status === 'completed' || j.status === 'rated'))
  const myActiveJobs = allJobs.filter(j => j.professional?.id === user?.id && (j.status === 'accepted' || j.status === 'in_progress'))

  const avgRating = myCompletedJobs.length > 0
    ? (myCompletedJobs.reduce((sum, j) => sum + (j.rating?.customerRating || 0), 0) / myCompletedJobs.filter(j => j.rating?.customerRating).length || 0).toFixed(1)
    : '0.0'

  const stats = [
    { label: 'Bu Ay Kazanc', value: `${thisMonthEarnings.toLocaleString('tr-TR')} TL`, icon: DollarSign, color: 'green', link: '/wallet' },
    { label: 'Tamamlanan Is', value: myCompletedJobs.length.toString(), icon: Briefcase, color: 'blue' },
    { label: 'Ortalama Puan', value: avgRating, icon: Star, color: 'yellow' },
    { label: 'Aktif Is', value: myActiveJobs.length.toString(), icon: TrendingUp, color: 'purple' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 pb-24">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 pb-6 pt-4 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h1 className="text-2xl font-black text-white">Usta Paneli</h1>
              <p className="text-white/70 text-xs">Hoş geldin, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/notifications')} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center relative">
              <Bell size={20} className="text-white" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            <button onClick={() => setShowMenu(true)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Menu size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} onClick={() => stat.link && navigate(stat.link)}
                className={`bg-white/20 backdrop-blur rounded-2xl p-4 ${stat.link ? 'cursor-pointer hover:bg-white/30 transition' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="text-2xl font-black text-white">{stat.value}</span>
                </div>
                <p className="text-white/80 text-xs font-medium">{stat.label}</p>
                {stat.link && <p className="text-white/90 text-xs font-semibold mt-1">Cuzdani Gor</p>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Yeni İş Talepleri</h2>
          <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">{jobRequests.length} Yeni</span>
        </div>
        {jobRequests.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl shadow-lg">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-600 font-semibold">Yeni iş talebi yok</p>
            <p className="text-gray-400 text-sm mt-1">Müşteriler iş olusturduğunda burada görünür</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobRequests.map(job => (
              <div key={job.id} onClick={() => navigate(`/job/${job.id}`)}
                className="bg-white rounded-2xl p-5 shadow-lg border-l-4 border-green-500 cursor-pointer hover:shadow-xl transition">
                {job.urgent && (
                  <div className="inline-block px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold mb-3">Acil</div>
                )}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{job.location.address}</p>
                  <p className="text-sm text-gray-700">{job.description}</p>
                </div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div><p className="text-xs text-gray-500">Müşteri</p><p className="text-sm font-bold text-gray-900">{job.customer.name}</p></div>
                  <div><p className="text-xs text-gray-500">Tarih</p><p className="text-sm font-bold text-gray-900">{new Date(job.date).toLocaleDateString('tr-TR')}</p></div>
                  <div><p className="text-xs text-gray-500">Ücret</p><p className="text-lg font-black text-green-600">{job.price} TL</p></div>
                </div>
                <div className="text-center text-sm text-blue-600 font-semibold">Detaylar Görüntüle</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {myCompletedJobs.length > 0 && (
        <div className="px-4 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Son Tamamlanan İşler</h2>
          <div className="space-y-2">
            {myCompletedJobs.slice(0, 3).map(job => (
              <div key={job.id} onClick={() => navigate(`/job/${job.id}`)} className="bg-white rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-lg transition">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><span className="text-2xl">✅</span></div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-600">{job.location.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-600">{job.price} TL</p>
                  {job.rating?.customerRating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-bold">{job.rating.customerRating}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 shadow-xl z-50">
        <div className="flex items-center justify-around">
          <button onClick={() => navigate('/professional')} className="flex flex-col items-center gap-1 text-green-600">
            <Home size={24} /><span className="text-xs font-semibold">Ana Sayfa</span>
          </button>
          <button onClick={() => navigate('/my-jobs')} className="flex flex-col items-center gap-1 text-gray-400">
            <Briefcase size={24} /><span className="text-xs font-semibold">İşlerim</span>
          </button>
          <button onClick={() => navigate('/messages')} className="flex flex-col items-center gap-1 relative text-gray-400">
            <MessageSquare size={24} /><span className="text-xs font-semibold">Mesajlar</span>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-gray-400">
            <User size={24} /><span className="text-xs font-semibold">Profil</span>
          </button>
        </div>
      </div>
      <HamburgerMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  )
}

export default ProfessionalDashboard
