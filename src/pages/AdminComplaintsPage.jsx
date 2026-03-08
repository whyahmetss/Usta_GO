import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchAPI } from '../utils/api'
import { CheckCircle, XCircle, AlertCircle, Loader, User, Zap } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

function AdminComplaintsPage() {
  const navigate = useNavigate()
  const [allComplaints, setAllComplaints] = useState([])
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchAPI('/complaints', { method: 'GET' })
      const data = Array.isArray(res) ? res : res.data || []
      setAllComplaints(data)
    } catch (err) {
      console.warn('Complaints API error, falling back to jobs data:', err)
      try {
        const jobsRes = await fetchAPI('/jobs', { method: 'GET' })
        const jobs = Array.isArray(jobsRes) ? jobsRes : jobsRes.data || []
        const complaints = jobs
          .filter(j => j.complaint)
          .map(job => ({
            ...job.complaint,
            jobId: job.id,
            jobTitle: job.title,
            customerName: job.customer?.name || '-',
            customerEmail: job.customer?.email || '-',
            customerPhone: job.customer?.phone || '-',
            professionalName: job.professional?.name || 'Usta',
            professionalEmail: job.professional?.email || '-',
            professionalPhone: job.professional?.phone || '-',
          }))
        setAllComplaints(complaints)
      } catch (fallbackErr) {
        setError('Şikayetler yüklenemedi: ' + (err.message || 'Bilinmeyen hata'))
        setAllComplaints([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResolveComplaint = async (complaintId, jobId) => {
    try {
      await fetchAPI(`/complaints/${complaintId || jobId}/resolve`, {
        method: 'PUT',
        body: { status: 'resolved' }
      })
    } catch (err) {
      console.warn('API resolve failed, applying local update:', err)
    }
    setAllComplaints(prev =>
      prev.map(c => (c.id === complaintId || c.jobId === jobId) ? { ...c, status: 'resolved' } : c)
    )
    alert('Şikayet çözüldü!')
  }

  const handleRejectComplaint = async (complaintId, jobId) => {
    try {
      await fetchAPI(`/complaints/${complaintId || jobId}/reject`, {
        method: 'PUT',
        body: { status: 'rejected' }
      })
    } catch (err) {
      console.warn('API reject failed, applying local update:', err)
    }
    setAllComplaints(prev =>
      prev.map(c => (c.id === complaintId || c.jobId === jobId) ? { ...c, status: 'rejected' } : c)
    )
    alert('Şikayet reddedildi!')
  }

  const filtered = filter === 'all'
    ? allComplaints
    : allComplaints.filter(c => c.status === filter)

  const statusMap = {
    open: 'pending',
    resolved: 'resolved',
    rejected: 'rejected',
  }

  const filterOptions = [
    { id: 'open', label: 'Açık' },
    { id: 'resolved', label: 'Çözüldü' },
    { id: 'rejected', label: 'Reddedildi' },
    { id: 'all', label: 'Tümü' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Şikayet Yönetimi"
        onBack={() => navigate('/admin')}
      />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-xs text-gray-500 font-medium px-1">Toplam {allComplaints.length} şikayet</p>

        {error && (
          <Card className="!border-amber-200 !bg-amber-50">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.97] ${
                filter === f.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {f.label}
              {f.id !== 'all' && ` (${allComplaints.filter(c => c.status === f.id).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size={32} className="text-primary-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">Şikayetler yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Gösterilecek şikayet yok"
            description="Bu kategoride şikayet bulunmuyor."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((complaint, idx) => (
              <Card key={complaint.id || idx}>
                {/* Status & date header */}
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge
                    status={statusMap[complaint.status] || complaint.status}
                    label={complaint.status === 'open' ? 'Açık' : undefined}
                  />
                  {complaint.filedAt && (
                    <p className="text-[11px] text-gray-400">
                      {new Date(complaint.filedAt).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>

                {/* Job title */}
                <p className="text-sm font-semibold text-gray-900 mb-2">{complaint.jobTitle}</p>

                {/* Reason */}
                <div className="bg-rose-50 rounded-xl p-3 mb-3">
                  <p className="text-[11px] text-rose-500 font-medium mb-0.5">Şikayet Nedeni</p>
                  <p className="text-xs text-rose-700 font-semibold">{complaint.reason}</p>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl mb-3">
                  {complaint.details || 'Detaylı açıklama yok'}
                </p>

                {/* Customer & Professional */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2.5 p-2.5 bg-primary-50/50 rounded-xl">
                    <User size={18} className="text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{complaint.customerName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{complaint.customerEmail}</p>
                      {complaint.customerPhone && complaint.customerPhone !== '-' && (
                        <p className="text-[11px] text-gray-500">{complaint.customerPhone}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">Müşteri</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 bg-accent-50/50 rounded-xl">
                    <Zap size={18} className="text-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{complaint.professionalName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{complaint.professionalEmail}</p>
                      {complaint.professionalPhone && complaint.professionalPhone !== '-' && (
                        <p className="text-[11px] text-gray-500">{complaint.professionalPhone}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-accent-600 bg-accent-100 px-2 py-0.5 rounded-full">Usta</span>
                  </div>
                </div>

                {/* Actions */}
                {complaint.status === 'open' && (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleResolveComplaint(complaint.id, complaint.jobId)}
                      className="py-2.5 bg-emerald-500 text-white rounded-2xl font-semibold text-xs hover:bg-emerald-600 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <CheckCircle size={14} /> Çözüldü
                    </button>
                    <button
                      onClick={() => handleRejectComplaint(complaint.id, complaint.jobId)}
                      className="py-2.5 bg-rose-500 text-white rounded-2xl font-semibold text-xs hover:bg-rose-600 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <XCircle size={14} /> Reddet
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminComplaintsPage
