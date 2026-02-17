import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Star } from 'lucide-react'

function MyJobsPage() {
  const { user, jobs } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')

  const userJobs = user?.role === 'customer'
    ? jobs.filter(j => j.customer.id === user.id)
    : jobs.filter(j => j.professional?.id === user?.id)

  const activeJobs = userJobs.filter(j => ['pending', 'accepted', 'in_progress'].includes(j.status))
  const completedJobs = userJobs.filter(j => ['completed', 'rated'].includes(j.status))
  const cancelledJobs = userJobs.filter(j => j.status === 'cancelled')

  const displayJobs = activeTab === 'active' ? activeJobs : activeTab === 'completed' ? completedJobs : cancelledJobs

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Bekliyor', color: 'bg-yellow-100 text-yellow-600' },
      accepted: { text: 'Kabul Edildi', color: 'bg-blue-100 text-blue-600' },
      in_progress: { text: 'Devam Ediyor', color: 'bg-purple-100 text-purple-600' },
      completed: { text: 'Tamamlandi', color: 'bg-green-100 text-green-600' },
      rated: { text: 'Degerlendirildi', color: 'bg-emerald-100 text-emerald-600' },
      cancelled: { text: 'Iptal Edildi', color: 'bg-red-100 text-red-600' }
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
            <h1 className="text-2xl font-black text-white">Islerim</h1>
            <p className="text-white/70 text-sm">{activeJobs.length} aktif, {completedJobs.length} tamamlanmis</p>
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
          {cancelledJobs.length > 0 && (
            <button onClick={() => setActiveTab('cancelled')}
              className={`flex-1 py-3 rounded-xl font-bold transition ${activeTab === 'cancelled' ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>
              Iptal ({cancelledJobs.length})
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {displayJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 font-semibold">
              {activeTab === 'active' ? 'Henuz aktif is yok' : activeTab === 'completed' ? 'Henuz tamamlanan is yok' : 'Iptal edilen is yok'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayJobs.map(job => {
              const statusBadge = getStatusBadge(job.status)
              return (
                <div key={job.id} onClick={() => navigate(`/job/${job.id}`)}
                  className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{job.location.address}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>{statusBadge.text}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{job.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm">
                      {user?.role === 'customer' && job.professional && (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{job.professional.avatar}</span>
                          <span className="font-semibold">{job.professional.name}</span>
                        </div>
                      )}
                      {user?.role === 'professional' && (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{job.customer.avatar}</span>
                          <span className="font-semibold">{job.customer.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-black text-green-600">{job.price} TL</div>
                  </div>
                  {(job.status === 'rated') && job.rating && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-xl flex items-center gap-2">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold text-gray-900">
                        {job.rating.customerRating || job.rating.professionalRating}/5
                      </span>
                    </div>
                  )}
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
