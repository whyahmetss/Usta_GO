import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { MapPin, ClipboardList } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

function MyJobsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userJobs, setUserJobs] = useState([])

  const loadUserJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchAPI(API_ENDPOINTS.JOBS.MY_JOBS)
      const rawData = response?.data || response || []
      if (Array.isArray(rawData)) {
        setUserJobs(mapJobsFromBackend(rawData))
      }
    } catch (err) {
      console.error('Load jobs error:', err)
      setError('İşler yüklenirken bir sorun oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadUserJobs()
  }, [user])

  const activeJobs = userJobs.filter(j =>
    ['pending', 'accepted', 'in_progress'].includes(j.status?.toLowerCase())
  )
  const completedJobs = userJobs.filter(j =>
    ['completed', 'rated'].includes(j.status?.toLowerCase())
  )

  const displayJobs = activeTab === 'active' ? activeJobs : completedJobs

  const tabs = [
    { key: 'active', label: 'Aktif', count: activeJobs.length },
    { key: 'completed', label: 'Tamamlanan', count: completedJobs.length },
  ]

  return (
    <div>
      <PageHeader
        title="İşlerim"
        onBack={false}
      />

      {/* Tabs */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          </div>
        ) : displayJobs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Henüz iş bulunmuyor" description="Yeni bir iş oluşturmak için ana sayfaya gidin." />
        ) : (
          <div className="space-y-3">
            {displayJobs.map(job => (
              <div
                key={job.id}
                onClick={() => navigate(`/job/${job.id}`)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card cursor-pointer hover:shadow-card-hover active:scale-[0.99] transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1 mr-2">{job.title}</h3>
                  <StatusBadge status={job.status} />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin size={12} />
                  {job.location || job.address || 'Adres belirtilmedi'}
                </p>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{job.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-base font-bold text-primary-600">{job.price || job.budget} TL</span>
                  <span className="text-[11px] text-gray-400">{new Date(job.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyJobsPage
