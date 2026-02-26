import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Star, RotateCcw } from 'lucide-react'

function MyJobsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [userJobs, setUserJobs] = useState([])
  const [lastRefreshTime, setLastRefreshTime] = useState(null)
  const [pullRefresh, setPullRefresh] = useState(0)
  const touchStartY = useRef(0)

  const loadUserJobs = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true)
      setIsRefreshing(true)
      setError(null)
      const response = await fetchAPI(API_ENDPOINTS.JOBS.LIST)

      // Veriyi güvenli bir şekilde alalım
      const rawData = response?.data || response || []

      if (Array.isArray(rawData)) {
        const filtered = rawData.filter(j => {
          // JSON'da hem customerId hem de customer.id var
          const dbId = String(j.customerId || j.customer?.id || "").trim();
          const userId = String(user?.id || "").trim();
          return dbId === userId;
        });
        setUserJobs(filtered)
      }

      setLastRefreshTime(new Date())
    } catch (err) {
      console.error('Load jobs error:', err)
      setError('İşler yüklenirken bir sorun oluştu.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      setPullRefresh(0)
    }
  }

  // Auto-refresh her 30 saniyede bir
  useEffect(() => {
    if (user) loadUserJobs()

    const interval = setInterval(() => {
      loadUserJobs(true)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user])

  // Pull-to-refresh işleme
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    if (!isRefreshing) {
      const currentY = e.touches[0].clientY
      const diff = currentY - touchStartY.current
      if (diff > 0 && diff < 150) {
        setPullRefresh(Math.min(diff / 50, 1))
      }
    }
  }

  const handleTouchEnd = (e) => {
    if (pullRefresh > 0.7 && !isRefreshing) {
      loadUserJobs(true)
    } else {
      setPullRefresh(0)
    }
  }

  const formatRefreshTime = () => {
    if (!lastRefreshTime) return 'Henüz yenilenmedi'

    const now = new Date()
    const diff = Math.floor((now - lastRefreshTime) / 1000) // saniye cinsinden

    if (diff < 60) return `${diff}s önce`
    if (diff < 3600) return `${Math.floor(diff / 60)}m önce`
    return lastRefreshTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

 // MyJobsPage.jsx içinde bu satırları güncelle:
const activeJobs = userJobs.filter(j => 
  ['pending', 'accepted', 'in_progress', 'PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status)
)
const completedJobs = userJobs.filter(j => 
  ['completed', 'rated', 'COMPLETED', 'RATED'].includes(j.status)
)
const cancelledJobs = userJobs.filter(j => 
  ['cancelled', 'CANCELLED'].includes(j.status)
)

  const displayJobs = activeTab === 'active' ? activeJobs : activeTab === 'completed' ? completedJobs : cancelledJobs

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Bekliyor', color: 'bg-yellow-100 text-yellow-600' },
      accepted: { text: 'Kabul Edildi', color: 'bg-blue-100 text-blue-600' },
      in_progress: { text: 'Devam Ediyor', color: 'bg-purple-100 text-purple-600' },
      completed: { text: 'Tamamlandı', color: 'bg-green-100 text-green-600' },
      rated: { text: 'Değerlendirildi', color: 'bg-emerald-100 text-emerald-600' },
      cancelled: { text: 'İptal Edildi', color: 'bg-red-100 text-red-600' }
    }
    return badges[status] || { text: status, color: 'bg-gray-100 text-gray-600' }
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullRefresh > 0 && (
        <div
          className="fixed top-0 left-0 right-0 bg-blue-500/20 backdrop-blur z-40 transition-all"
          style={{ height: `${pullRefresh * 100}px` }}
        >
          <div className="flex items-center justify-center h-full">
            <RotateCcw
              size={24}
              className="text-blue-600 animate-spin"
              style={{ opacity: pullRefresh }}
            />
          </div>
        </div>
      )}

      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">İşlerim</h1>
            <p className="text-white/70 text-sm">{activeJobs.length} aktif, {completedJobs.length} tamamlanmış</p>
            <p className="text-white/60 text-xs mt-1">Son yenileme: {formatRefreshTime()}</p>
          </div>
          <button
            onClick={() => loadUserJobs(true)}
            disabled={isRefreshing}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center hover:bg-white/30 transition disabled:opacity-50"
          >
            <RotateCcw size={20} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl font-bold transition ${activeTab === 'active' ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>
            Aktif ({activeJobs.length})
          </button>
          <button onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 rounded-xl font-bold transition ${activeTab === 'completed' ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>
            Tamamlanan ({completedJobs.length})
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {loading && userJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 font-semibold">Henüz iş bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayJobs.map(job => {
              const statusBadge = getStatusBadge(job.status)
              return (
                <div key={job.id} onClick={() => navigate(`/job/${job.id}`)}
                  className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{job.title}</h3>
                      {/* DÜZELTME: location.address yerine location veya address kullanıyoruz */}
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                         {job.location || job.address || 'Adres belirtilmedi'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${statusBadge.color}`}>{statusBadge.text}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="text-xl font-black text-blue-600">{job.price || job.budget} TL</div>
                    <div className="text-xs font-bold text-gray-400">{new Date(job.createdAt).toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyJobsPage
