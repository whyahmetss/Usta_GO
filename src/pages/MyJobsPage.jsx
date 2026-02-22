import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Star, MapPin, Clock } from 'lucide-react'

function MyJobsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userJobs, setUserJobs] = useState([])

  useEffect(() => {
    const loadUserJobs = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
        
        // Backend'den gelen veriyi işle
        const allJobs = response.data || response || []
        
        if (Array.isArray(allJobs)) {
          // Filtreleme mantığını esnetiyoruz: customer.id veya customerId kontrolü
          const filtered = user?.role === 'customer'
            ? allJobs.filter(j => (j.customer?.id === user.id || j.customerId === user.id || j.userId === user.id))
            : allJobs.filter(j => (j.professional?.id === user?.id || j.professionalId === user?.id))
          
          setUserJobs(filtered)
        }
      } catch (err) {
        console.error('Load jobs error:', err)
        setError('İşler yüklenirken bir sorun oluştu.')
      } finally {
        setLoading(false)
      }
    }

    if (user) loadUserJobs()
  }, [user])

  const activeJobs = userJobs.filter(j => ['pending', 'accepted', 'in_progress'].includes(j.status?.toLowerCase()))
  const completedJobs = userJobs.filter(j => ['completed', 'rated'].includes(j.status?.toLowerCase()))
  const cancelledJobs = userJobs.filter(j => j.status?.toLowerCase() === 'cancelled')

  const displayJobs = activeTab === 'active' ? activeJobs : activeTab === 'completed' ? completedJobs : cancelledJobs

  const getStatusBadge = (status = 'pending') => {
    const s = status.toLowerCase()
    const badges = {
      pending: { text: 'Teklif Bekliyor', color: 'bg-yellow-100 text-yellow-600' },
      accepted: { text: 'Usta Kabul Etti', color: 'bg-blue-100 text-blue-600' },
      in_progress: { text: 'Usta Yolda', color: 'bg-purple-100 text-purple-600' },
      completed: { text: 'Tamamlandı', color: 'bg-green-100 text-green-600' },
      rated: { text: 'Puanlandı', color: 'bg-emerald-100 text-emerald-600' },
      cancelled: { text: 'İptal Edildi', color: 'bg-red-100 text-red-600' }
    }
    return badges[s] || { text: s, color: 'bg-gray-100 text-gray-600' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">İş Taleplerim</h1>
            <p className="text-white/70 text-sm">{activeJobs.length} aktif işin var</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['active', 'completed'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl font-bold transition ${activeTab === tab ? 'bg-white text-blue-600 shadow-lg' : 'bg-white/10 text-white'}`}>
              {tab === 'active' ? `Aktif (${activeJobs.length})` : `Tamamlanan (${completedJobs.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Yükleniyor...</p>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 font-bold">Burada henüz bir şey yok.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayJobs.map(job => {
              const statusBadge = getStatusBadge(job.status)
              return (
                <div key={job.id || job._id} onClick={() => navigate(`/job/${job.id || job._id}`)}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer">
                  
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusBadge.color}`}>
                      {statusBadge.text}
                    </span>
                    <div className="text-lg font-black text-blue-600">{job.budget || job.price} TL</div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1">{job.title}</h3>
                  
                  <div className="flex flex-col gap-1 mb-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <MapPin size={14} /> 
                      <span className="line-clamp-1">{typeof job.location === 'object' ? job.location.address : job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Clock size={14} />
                      {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50 p-3 rounded-xl mb-4 italic">
                    "{job.description}"
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {job.professional?.name?.[0] || job.category?.[0] || 'E'}
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {job.professional?.name || 'Usta Bekleniyor'}
                        </span>
                     </div>
                     <div className="text-blue-500 font-bold text-xs">Detaylar &gt;</div>
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
