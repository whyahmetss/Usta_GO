import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, X, ZoomIn, AlertCircle, Loader, Trash2 } from 'lucide-react'

function AdminJobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])


  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobsRes, usersRes] = await Promise.all([
        fetchAPI('/jobs', { method: 'GET' }),
        fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS, { method: 'GET' }).catch(() => ({ data: [] })),
      ]);
      const raw = Array.isArray(jobsRes) ? jobsRes : jobsRes.data || []
      const usersRaw = Array.isArray(usersRes) ? usersRes : usersRes.data || []
      // Build a phone lookup map keyed by user id (handle both id and _id)
      const phoneMap = {}
      usersRaw.forEach(u => {
        const uid = u.id || u._id
        if (uid) phoneMap[String(uid)] = u.phone || u.phoneNumber || u.tel || ''
      })
      // Map jobs and inject phone into nested customer/professional
      const mapped = mapJobsFromBackend(raw).map(job => ({
        ...job,
        customer: job.customer ? {
          ...job.customer,
          phone: job.customer.phone || job.customer.phoneNumber ||
            phoneMap[String(job.customer.id || job.customer._id)] || ''
        } : job.customer,
        professional: job.professional ? {
          ...job.professional,
          phone: job.professional.phone || job.professional.phoneNumber ||
            phoneMap[String(job.professional.id || job.professional._id)] || ''
        } : job.professional,
      }))
      setJobs(mapped);
    } catch (err) {
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm('Bu işi silmek istediğinizden emin misiniz?')) return
    try {
      setDeletingId(jobId)
      await fetchAPI(API_ENDPOINTS.JOBS.DELETE(jobId), { method: 'DELETE' })
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (err) {
      alert('Silme başarısız: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    // Refetch when filter changes
    if (!loading) {
      const timer = setTimeout(() => fetchJobs(), 300)
      return () => clearTimeout(timer)
    }
  }, [filterStatus])

  const statuses = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled']
  const statusLabels = {
    all: 'Tümü',
    pending: 'Beklemede',
    accepted: 'Kabul Edildi',
    in_progress: 'Yapılıyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi'
  }
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }

// After mapJobsFromBackend, statuses are lowercase; filterStatus is also lowercase
const filteredJobs = filterStatus === 'all'
  ? jobs
  : jobs.filter(j => j.status === filterStatus)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">İş Yönetimi</h1>
            <p className="text-sm text-gray-500">Toplam {jobs.length} iş</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-yellow-700">Uyarı</p>
              <p className="text-sm text-yellow-600">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {statusLabels[status]}
              {status !== 'all' && ` (${jobs.filter(j => j.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Loader size={40} className="mx-auto mb-3 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-semibold">İşler yükleniyor...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg">Bu durumdaki iş yok</p>
          </div>
        ) : (
          <>
            {filteredJobs.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Toplam {filteredJobs.length} iş gösteriliyor
              </p>
            )}
            <div className="space-y-4">
              {filteredJobs.map(job => (
              <div key={job.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                {/* Job Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{job.location || job.address || 'Adres belirtilmedi'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-2 rounded-lg font-bold text-sm ${statusColors[job.status]}`}>
                        {statusLabels[job.status]}
                      </span>
                      <button
                        onClick={() => deleteJob(job.id)}
                        disabled={deletingId === job.id}
                        className="w-9 h-9 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition"
                        title="İşi Sil"
                      >
                        {deletingId === job.id
                          ? <Loader size={16} className="animate-spin" />
                          : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                 <div className="grid grid-cols-4 gap-4 mb-4">
  <div>
    <p className="text-xs text-gray-600 mb-1">Fiyat</p>
    {/* Backend verisinde 'budget' olduğu için onu çekiyoruz */}
    <p className="text-2xl font-black text-gray-900">{job.budget || job.price || 0} TL</p>
  </div>
  <div>
    <p className="text-xs text-gray-600 mb-1">Kategori</p>
    {/* Kategori kaymasını engellemek için job.category kullanıyoruz */}
    <p className="text-lg font-bold text-gray-900">{job.category || 'Elektrikçi'}</p>
  </div>
  <div>
    <p className="text-xs text-gray-600 mb-1">Tarih</p>
    <p className="text-sm font-bold text-gray-900">
      {new Date(job.createdAt).toLocaleDateString('tr-TR')}
    </p>
  </div>
  <div>
    <p className="text-xs text-gray-600 mb-1">Aciliyet</p>
    <p className="text-lg font-bold">{job.urgent ? '🔴 Acil' : '🟢 Normal'}</p>
  </div>
</div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {job.description}
                  </p>
                </div>

                {/* Customer & Professional Info */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Customer */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2 font-bold">MÜŞTERİ BİLGİLERİ</p>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{job.customer?.avatar || '👤'}</div>
                        <div>
                          <p className="font-bold text-gray-900">{job.customer?.name}</p>
                          <p className="text-sm text-gray-600">{job.customer?.email}</p>
                          {job.customer?.phone && <p className="text-sm text-gray-600">{job.customer.phone}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Professional */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2 font-bold">USTA BİLGİLERİ</p>
                      {job.professional ? (
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{job.professional?.avatar || '⚡'}</div>
                          <div>
                            <p className="font-bold text-gray-900">{job.professional?.name}</p>
                            <p className="text-sm text-gray-600">{job.professional?.email}</p>
                            {job.professional?.phone && <p className="text-sm text-gray-600">{job.professional.phone}</p>}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Henüz kabul edilmedi</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photos */}
                {(job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
                  <div className="px-6 py-4">
                    {/* Before Photos */}
                    {job.beforePhotos?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-900 mb-3">BAŞLANGIÇ FOTOĞRAFLARI ({job.beforePhotos.length})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {job.beforePhotos.map((photo, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImage(photo)}
                              className="relative group rounded-lg overflow-hidden"
                            >
                              <img
                                src={photo}
                                alt={`Before ${idx}`}
                                className="w-full h-24 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* After Photos */}
                    {job.afterPhotos?.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-3">BİTİŞ FOTOĞRAFLARI ({job.afterPhotos.length})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {job.afterPhotos.map((photo, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImage(photo)}
                              className="relative group rounded-lg overflow-hidden"
                            >
                              <img
                                src={photo}
                                alt={`After ${idx}`}
                                className="w-full h-24 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 -right-10 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
            >
              <X size={20} className="text-gray-900" />
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminJobsPage
