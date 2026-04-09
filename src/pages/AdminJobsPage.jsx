import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { X, ZoomIn, Loader, Trash2, MapPin, Calendar, Tag, AlertTriangle, ClipboardList, User, Zap } from 'lucide-react'
import PageHeader from '../components/PageHeader'
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

  const statuses = ['all', 'pending', 'accepted', 'in_progress', 'pending_approval', 'completed', 'cancelled']
  const statusLabels = {
    all: 'Tümü',
    pending: 'Beklemede',
    accepted: 'Kabul Edildi',
    in_progress: 'Yapılıyor',
    pending_approval: 'Onay Bekliyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi'
  }

  const filteredJobs = filterStatus === 'all'
    ? jobs
    : jobs.filter(j => j.status === filterStatus)

  return (
    <div className="min-h-screen">
      <PageHeader title="İş Yönetimi" onBack={() => navigate('/admin')} />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <p className="text-xs text-zinc-500 font-medium px-1">Toplam {jobs.length} iş</p>

        {error && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-300">{error}</p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-0 flex-wrap sm:flex-nowrap">
            {statuses.map(status => {
              const count = status === 'all' ? jobs.length : jobs.filter(j => j.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
                  } ${loading ? 'opacity-50' : ''}`}
                >
                  {statusLabels[status]}
                  <span className={`text-[10px] font-bold ${filterStatus === status ? 'opacity-70' : 'text-zinc-600'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size={32} className="text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-zinc-500">İşler yükleniyor...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Bu durumda iş yok" description="Farklı bir filtre deneyin." />
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 p-4 pb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{job.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={11} className="text-zinc-600 flex-shrink-0" />
                      <span className="text-xs text-zinc-500 truncate">{job.location || job.address || 'Adres belirtilmedi'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={job.status} />
                    <button
                      onClick={() => deleteJob(job.id)}
                      disabled={deletingId === job.id}
                      className="w-8 h-8 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center transition-colors"
                    >
                      {deletingId === job.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 px-4 mb-3">
                  {[
                    { label: 'Fiyat', value: `${job.budget || job.price || 0} TL` },
                    { label: 'Kategori', value: job.category || '—' },
                    { label: 'Tarih', value: new Date(job.createdAt).toLocaleDateString('tr-TR') },
                  ].map(s => (
                    <div key={s.label} className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-zinc-500">{s.label}</p>
                      <p className="text-xs font-bold text-white truncate mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>

                {job.urgent && (
                  <div className="mx-4 mb-3 px-3 py-1.5 bg-rose-500/10 rounded-xl inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    <span className="text-[11px] font-semibold text-rose-400">Acil</span>
                  </div>
                )}

                {/* Description */}
                {job.description && (
                  <p className="text-xs text-zinc-400 bg-white/[0.04] mx-4 p-3 rounded-xl mb-3">{job.description}</p>
                )}

                {/* Customer & Professional */}
                <div className="space-y-2 px-4 pb-4">
                  <div className="flex items-center gap-2.5 p-3 bg-blue-500/[0.06] border border-blue-500/15 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <User size={15} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{job.customer?.name || '—'}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{job.customer?.email}</p>
                      {job.customer?.phone && <p className="text-[11px] text-zinc-500">{job.customer.phone}</p>}
                    </div>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/15 px-2 py-1 rounded-full flex-shrink-0">Müşteri</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <Zap size={15} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {job.professional ? (
                        <>
                          <p className="text-xs font-semibold text-white">{job.professional.name}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{job.professional.email}</p>
                          {job.professional.phone && <p className="text-[11px] text-zinc-500">{job.professional.phone}</p>}
                        </>
                      ) : (
                        <p className="text-xs text-zinc-600 italic">Henüz kabul edilmedi</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-1 rounded-full flex-shrink-0">Usta</span>
                  </div>
                </div>

                {/* Photos */}
                {(job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-3">
                    {job.beforePhotos?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase mb-2">Başlangıç ({job.beforePhotos.length})</p>
                        <div className="grid grid-cols-4 gap-2">
                          {job.beforePhotos.map((photo, idx) => (
                            <button key={idx} onClick={() => setSelectedImage(photo)} className="relative group rounded-xl overflow-hidden aspect-square">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
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
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase mb-2">Bitiş ({job.afterPhotos.length})</p>
                        <div className="grid grid-cols-4 gap-2">
                          {job.afterPhotos.map((photo, idx) => (
                            <button key={idx} onClick={() => setSelectedImage(photo)} className="relative group rounded-xl overflow-hidden aspect-square">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-sm w-full">
            <button onClick={() => setSelectedImage(null)} className="absolute -top-12 right-0 w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <X size={18} className="text-white" />
            </button>
            <img src={selectedImage} alt="Preview" className="w-full max-h-[80vh] object-contain rounded-2xl" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminJobsPage
