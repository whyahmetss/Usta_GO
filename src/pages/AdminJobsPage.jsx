import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, LogOut, Trash2 } from 'lucide-react'

function AdminJobsPage() {
  const { logout, jobs } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDeleteJob = (jobId) => {
    if (window.confirm('Bu işi silmek istediğinize emin misiniz?')) {
      const updatedJobs = jobs.filter(j => j.id !== jobId)
      localStorage.setItem('jobs', JSON.stringify(updatedJobs))
      window.location.reload()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-600'
      case 'accepted':
        return 'bg-blue-100 text-blue-600'
      case 'in_progress':
        return 'bg-purple-100 text-purple-600'
      case 'completed':
        return 'bg-green-100 text-green-600'
      case 'cancelled':
        return 'bg-red-100 text-red-600'
      case 'rated':
        return 'bg-green-100 text-green-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor'
      case 'accepted':
        return 'Kabul Edildi'
      case 'in_progress':
        return 'Devam Ediyor'
      case 'completed':
        return 'Tamamlandı'
      case 'cancelled':
        return 'İptal'
      case 'rated':
        return 'Değerlendirildi'
      default:
        return 'Bilinmiyor'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="w-10 h-10 hover:bg-gray-100 rounded-lg flex items-center justify-center transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">İş Yönetimi</h1>
              <p className="text-sm text-gray-500">Toplam {jobs.length} iş</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
          >
            <LogOut size={18} /> Çıkış
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {jobs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-600 font-semibold">Henüz iş yok</p>
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    job.status === 'completed' || job.status === 'rated'
                      ? 'bg-green-50 border-green-200'
                      : job.status === 'cancelled'
                      ? 'bg-red-50 border-red-200'
                      : job.status === 'in_progress'
                      ? 'bg-purple-50 border-purple-200'
                      : job.status === 'accepted'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <span className="text-2xl">
                    {job.status === 'completed' || job.status === 'rated'
                      ? '✅'
                      : job.status === 'cancelled'
                      ? '❌'
                      : job.status === 'in_progress'
                      ? '🔧'
                      : job.status === 'accepted'
                      ? '👍'
                      : '⏳'}
                  </span>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">
                          Müşteri: {job.customer.name}
                          {job.professional && ` → Usta: ${job.professional.name}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{job.location.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">{job.price} TL</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${getStatusColor(job.status)}`}>
                          {getStatusLabel(job.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold text-sm"
                  >
                    <Trash2 size={14} /> Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminJobsPage
