import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Settings, DollarSign, Star, TrendingUp, Briefcase, MapPin, ClipboardList, CheckCircle, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { useNavigate } from 'react-router-dom'
import { connectSocket } from '../utils/socket'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

function ProfessionalDashboard() {
  const { user, getUnreadNotificationCount } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [allJobs, setAllJobs] = useState([])
  const [ownJobs, setOwnJobs] = useState([])
  const [newJobFlash, setNewJobFlash] = useState(null) // { title, id }
  const flashTimer = useRef(null)

  const unreadNotifs = getUnreadNotificationCount()

  const greeting = (() => {
    const h = parseInt(new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false }).format(new Date()), 10)
    if (h >= 5 && h < 12) return 'Günaydın'
    if (h >= 12 && h < 18) return 'Tünaydın'
    if (h >= 18 && h < 22) return 'İyi Akşamlar'
    return 'İyi Geceler'
  })()

  const normalizeJob = (job) => ({
    ...job,
    location: typeof job.location === 'string' ? { address: job.location } : (job.location || { address: 'Adres belirtilmedi' })
  })

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const isPendingApproval = user?.status === 'PENDING_APPROVAL'
      const [pendingResponse, myJobsResponse] = await Promise.all([
        isPendingApproval ? Promise.resolve({ data: [] }) : fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?status=PENDING&limit=50`),
        fetchAPI(`${API_ENDPOINTS.JOBS.MY_JOBS}?limit=500`),
      ])

      // MY_JOBS: sadece bu ustanın işleri (istatistikler için)
      const myRaw = Array.isArray(myJobsResponse?.data) ? myJobsResponse.data : []
      const myMapped = mapJobsFromBackend(myRaw).map(normalizeJob)
      setOwnJobs(myMapped)

      // Bekleyen genel işler + kendi işleri (iş talepleri için)
      const pendingRaw = Array.isArray(pendingResponse?.data) ? pendingResponse.data : []
      const uniqueMap = new Map()
      myRaw.forEach(j => uniqueMap.set(j.id, j))
      pendingRaw.forEach(j => { if (!uniqueMap.has(j.id)) uniqueMap.set(j.id, j) })
      const allMapped = mapJobsFromBackend(Array.from(uniqueMap.values())).map(normalizeJob)
      setAllJobs(allMapped)
    } catch (err) { console.error('Load dashboard error:', err) }
    finally { setLoading(false) }
  }, [user?.id, user?.status])

  useEffect(() => {
    if (user?.role === 'professional') loadDashboardData()
  }, [user?.role, loadDashboardData])

  useEffect(() => {
    if (user?.role !== 'professional') return
    const onVisible = () => loadDashboardData()
    window.addEventListener('focus', onVisible)
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') onVisible() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user?.role, loadDashboardData])

  useEffect(() => {
    if (user?.role !== 'professional') return
    const socket = connectSocket(user?.id)

    const addJob = (rawJob) => {
      if (!rawJob?.id) return
      const mapped = mapJobsFromBackend([rawJob])[0]
      const normalized = normalizeJob(mapped)
      setAllJobs(prev => {
        if (prev.some(j => j.id === normalized.id)) return prev
        return [normalized, ...prev]
      })
      // Bildirim flash göster
      clearTimeout(flashTimer.current)
      setNewJobFlash({ title: rawJob.title || 'Yeni İş', id: rawJob.id })
      flashTimer.current = setTimeout(() => setNewJobFlash(null), 6000)
    }

    const handleNewJob = async (jobData) => {
      // Önce socket datasını direkt kullan (hız için)
      if (jobData?.title) {
        addJob(jobData)
        return
      }
      // Sadece id geldiyse fetch et
      try {
        const response = await fetchAPI(API_ENDPOINTS.JOBS.GET(jobData.id))
        if (response?.data) addJob(response.data)
      } catch (err) {
        // Fetch başarısız olursa tüm listeyi yenile
        loadDashboardData()
      }
    }

    const handleConnect = () => loadDashboardData()
    socket.on('new_job_available', handleNewJob)
    socket.on('connect', handleConnect)
    return () => {
      socket.off('new_job_available', handleNewJob)
      socket.off('connect', handleConnect)
      clearTimeout(flashTimer.current)
    }
  }, [user?.id, user?.role, loadDashboardData])

  // Bekleyen genel işler (iş talepleri listesi) - kendi kabul etmedikleri
  const jobRequests = allJobs.filter(j => j.status === 'pending')
  // İstatistikler için sadece kendi işleri kullan (MY_JOBS endpoint zaten filtreli döner)
  const myCompletedJobs = ownJobs.filter(j => j.status === 'completed' || j.status === 'rated')
  const myActiveJobs = ownJobs.filter(j => j.status === 'accepted' || j.status === 'in_progress')

  const now = new Date()
  const thisMonthEarnings = myCompletedJobs
    .filter(j => { const d = j.completedAt ? new Date(j.completedAt) : null; return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    .reduce((sum, j) => sum + (Number(j.price) || Number(j.budget) || 0), 0)

  const ratedJobs = myCompletedJobs.filter(j => j.rating)
  const avgRating = ratedJobs.length > 0 ? (ratedJobs.reduce((sum, j) => sum + (Number(j.rating) || 0), 0) / ratedJobs.length).toFixed(1) : '0.0'

  const isPendingApproval = user?.status === 'PENDING_APPROVAL'

  return (
    <div>
      {/* Yeni iş flash bildirimi */}
      {newJobFlash && (
        <div
          onClick={() => { navigate(`/job/${newJobFlash.id}`); setNewJobFlash(null) }}
          className="fixed top-4 left-4 right-4 z-[9999] cursor-pointer"
          style={{ animation: 'slideDown 0.35s ease' }}
        >
          <div className="bg-primary-500 text-white rounded-2xl px-4 py-3.5 shadow-2xl flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Yeni İş Talebi!</p>
              <p className="text-[12px] text-white/80 truncate">{newJobFlash.title}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setNewJobFlash(null) }}
              className="text-white/60 hover:text-white text-lg leading-none px-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isPendingApproval && (
        <div className="bg-amber-50 dark:bg-[#1F1F1F] border-b border-amber-200/60 dark:border-[#2A2A2A] px-4 py-3 text-center text-sm font-medium text-amber-700 dark:text-amber-400">
          ⏳ Hesabınız admin onayı bekliyor. Onaylandıktan sonra iş alabileceksiniz.
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium leading-none mb-0.5">{greeting}</p>
              <h1 className="text-[15px] font-semibold text-gray-900 leading-tight">{user?.name || 'Usta'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/notifications')} className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center relative transition-colors hover:bg-gray-100">
              <Bell size={18} className="text-gray-600" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center transition-colors hover:bg-gray-100">
              <Settings size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={DollarSign} label="Bu Ay Kazanç" value={`${thisMonthEarnings.toLocaleString('tr-TR')} TL`} color="emerald" onClick={() => navigate('/wallet')} />
          <StatCard icon={Briefcase} label="Tamamlanan İş" value={myCompletedJobs.length} color="primary" />
          <StatCard icon={Star} label="Ortalama Puan" value={avgRating} color="amber" />
          <StatCard icon={TrendingUp} label="Aktif İş" value={myActiveJobs.length} color="violet" />
        </div>
      </div>

      {/* Job Requests */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Yeni İş Talepleri</h2>
          {jobRequests.length > 0 && (
            <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[11px] font-semibold">{jobRequests.length} Yeni</span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          </div>
        ) : jobRequests.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Yeni iş talebi yok" description="Müşteriler iş oluşturduğunda burada görünür" />
        ) : (
          <div className="space-y-3">
            {jobRequests.map(job => (
              <Card key={job.id} onClick={() => navigate(`/job/${job.id}`)}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1 mr-2">{job.title}</h3>
                  {job.urgent && <StatusBadge status="urgent" />}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1.5">
                  <MapPin size={12} /> {job.location?.address || 'Adres belirtilmedi'}
                </p>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{job.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Müşteri:</span>
                    <span className="text-xs font-medium text-gray-700">{job.customer?.name}</span>
                  </div>
                  <span className="text-base font-bold text-emerald-600">{job.price} TL</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Completed Jobs */}
        {myCompletedJobs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Son Tamamlanan İşler</h2>
            <div className="space-y-2">
              {myCompletedJobs.slice(0, 3).map(job => (
                <Card key={job.id} onClick={() => navigate(`/job/${job.id}`)} className="flex items-center gap-3 !p-3.5">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0"><CheckCircle size={20} className="text-emerald-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{job.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">{job.location?.address}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-emerald-600 text-sm">{job.price} TL</p>
                    {job.rating && (
                      <div className="flex items-center gap-0.5 justify-end">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-medium text-gray-500">{job.rating}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfessionalDashboard
