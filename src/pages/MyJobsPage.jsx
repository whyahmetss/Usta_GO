import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, Star } from 'lucide-react'

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

        // Get raw data from response
        const rawData = response?.data || response || []

        if (Array.isArray(rawData)) {
          // Map jobs from backend format to frontend format
          const mappedJobs = mapJobsFromBackend(rawData)

          // Filter jobs based on user role
          let filtered
          if (user?.role === 'professional') {
            // For professionals: show jobs they're assigned to (professional?.id matches user.id)
            filtered = mappedJobs.filter(j => {
              const profId = String(j.professionalId || j.professional?.id || j.usta?.id || "").trim()
              const userId = String(user?.id || "").trim()
              return profId === userId
            })
          } else {
            // For customers: show jobs they created (customer?.id matches user.id)
            filtered = mappedJobs.filter(j => {
              const custId = String(j.customerId || j.customer?.id || "").trim()
              const userId = String(user?.id || "").trim()
              return custId === userId
            })
          }

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

  // Filter jobs by status (after mapping, all statuses are lowercase)
  const activeJobs = userJobs.filter(j =>
    ['pending', 'accepted', 'in_progress'].includes(j.status?.toLowerCase())
  )
  const completedJobs = userJobs.filter(j =>
    ['completed', 'rated'].includes(j.status?.toLowerCase())
  )
  const cancelledJobs = userJobs.filter(j =>
    ['cancelled'].includes(j.status?.toLowerCase())
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
    <div className="min-h-screen bg-gray-50">
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">İşlerim</h1>
            <p className="text-white/70 text-sm">{activeJobs.length} aktif, {completedJobs.length} tamamlanmış</p>
          </div>
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
        {loading ? (
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
