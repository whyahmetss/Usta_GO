import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchAPI } from '../utils/api'
import { ArrowLeft, X, ZoomIn, AlertCircle, Loader } from 'lucide-react'

function AdminJobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : ''
      const res = await fetchAPI(`/jobs${params}`, {
        method: 'GET'
      })
      setJobs(Array.isArray(res) ? res : res.data || [])
    } catch (err) {
      setError(err.message)
      setJobs([])
    } finally {
      setLoading(false)
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
                      <p className="text-sm text-gray-600 mb-3">{job.location?.address || 'Adres'}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg font-bold text-sm ${statusColors[job.status]}`}>
                      {statusLabels[job.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Fiyat</p>
                      <p className="text-2xl font-black text-gray-900">{job.price} TL</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Kategori</p>
                      <p className="text-lg font-bold text-gray-900">{job.category || '-'}</p>
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
                          <p className="text-sm text-gray-600">{job.customer?.phone}</p>
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
                            <p className="text-sm text-gray-600">{job.professional?.phone}</p>
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
                        <p className="text-sm font-bold text-gray-900 mb-3">BAŞLANGIC FOTOĞRAFLARI ({job.beforePhotos.length})</p>
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
                        <p className="text-sm font-bold text-gray-900 mb-3">BITIS FOTOĞRAFLARI ({job.afterPhotos.length})</p>
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
