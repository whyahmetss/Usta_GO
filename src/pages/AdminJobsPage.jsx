import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { X, ZoomIn, Loader, Trash2, MapPin, Calendar, Tag, AlertTriangle, ClipboardList, User, Zap } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

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
      const phoneMap = {}
      usersRaw.forEach(u => {
        const uid = u.id || u._id
        if (uid) phoneMap[String(uid)] = u.phone || u.phoneNumber || u.tel || ''
      })
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
      await fetchAPI(API_ENDPOINTS.ADMIN.DELETE_JOB(jobId), { method: 'DELETE' })
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (err) {
      alert('Silme başarısız: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
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

  const filteredJobs = filterStatus === 'all'
    ? jobs
    : jobs.filter(j => j.status === filterStatus)

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="İş Yönetimi"
        onBack={() => navigate('/admin')}
      />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-xs text-gray-500 font-medium px-1">Toplam {jobs.length} iş</p>

        {error && (
          <Card className="!border-amber-200 !bg-amber-50">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              disabled={loading}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.97] ${
                filterStatus === status
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600'
              } ${loading ? 'opacity-50' : ''}`}
            >
              {statusLabels[status]}
              {status !== 'all' && ` (${jobs.filter(j => j.status === status).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size={32} className="text-primary-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">İşler yükleniyor...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Bu durumda iş yok"
            description="Farklı bir filtre deneyin."
          />
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <Card key={job.id}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{job.location || job.address || 'Adres belirtilmedi'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={job.status} />
                    <button
                      onClick={() => deleteJob(job.id)}
                      disabled={deletingId === job.id}
                      className="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center transition-colors"
                    >
                      {deletingId === job.id
                        ? <Loader size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-gray-500">Fiyat</p>
                    <p className="text-sm font-bold text-gray-900">{job.budget || job.price || 0} TL</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-gray-500">Kategori</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">{job.category || 'Elektrikçi'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-gray-500">Tarih</p>
                    <p className="text-xs font-semibold text-gray-900">{new Date(job.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>

                {job.urgent && (
                  <div className="mb-3 px-2.5 py-1 bg-rose-50 rounded-lg inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                    <span className="text-[11px] font-medium text-rose-700">Acil</span>
                  </div>
                )}

                {/* Description */}
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl mb-3">{job.description}</p>

                {/* Customer & Professional */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 p-2.5 bg-primary-50/50 rounded-xl">
                    <div className="text-lg">{job.customer?.avatar || <User size={18} className="text-gray-400" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{job.customer?.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{job.customer?.email}</p>
                      {job.customer?.phone && <p className="text-[11px] text-gray-500">{job.customer.phone}</p>}
                    </div>
                    <span className="text-[10px] font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">Müşteri</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 bg-accent-50/50 rounded-xl">
                    <div className="text-lg">{job.professional?.avatar || <Zap size={18} className="text-amber-500" />}</div>
                    <div className="flex-1 min-w-0">
                      {job.professional ? (
                        <>
                          <p className="text-xs font-semibold text-gray-900">{job.professional?.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{job.professional?.email}</p>
                          {job.professional?.phone && <p className="text-[11px] text-gray-500">{job.professional.phone}</p>}
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Henüz kabul edilmedi</p>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-accent-600 bg-accent-100 px-2 py-0.5 rounded-full">Usta</span>
                  </div>
                </div>

                {/* Photos */}
                {(job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    {job.beforePhotos?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Başlangıç ({job.beforePhotos.length})</p>
                        <div className="grid grid-cols-4 gap-2">
                          {job.beforePhotos.map((photo, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImage(photo)}
                              className="relative group rounded-xl overflow-hidden aspect-square"
                            >
                              <img src={photo} alt={`Before ${idx}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {job.afterPhotos?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Bitiş ({job.afterPhotos.length})</p>
                        <div className="grid grid-cols-4 gap-2">
                          {job.afterPhotos.map((photo, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImage(photo)}
                              className="relative group rounded-xl overflow-hidden aspect-square"
                            >
                              <img src={photo} alt={`After ${idx}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-sm w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
            >
              <X size={18} className="text-white" />
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminJobsPage
