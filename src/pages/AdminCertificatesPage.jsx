import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { Check, X, ExternalLink, Loader, FileText } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

function AdminCertificatesPage() {
  const navigate = useNavigate()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionId, setActionId] = useState(null)

  const loadCertificates = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchAPI(API_ENDPOINTS.CERTIFICATES.ADMIN_LIST)
      setCertificates(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Sertifikalar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCertificates() }, [])

  const handleStatus = async (id, status) => {
    setActionId(id)
    try {
      await fetchAPI(API_ENDPOINTS.CERTIFICATES.ADMIN_UPDATE(id), {
        method: 'PATCH',
        body: { status },
      })
      loadCertificates()
    } catch (err) {
      alert(err.message || 'İşlem başarısız')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Sertifika Onayları"
        onBack={() => navigate('/admin')}
      />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {error && (
          <Card className="!bg-rose-50 !border-rose-200">
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <Loader size={28} className="text-primary-500 animate-spin mb-3" />
            <p className="text-xs text-gray-500">Sertifikalar yükleniyor...</p>
          </div>
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Bekleyen sertifika yok"
            description="Usta sertifika yüklediğinde burada görünür."
          />
        ) : (
          <div className="space-y-3">
            {certificates.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{c.user?.name || 'Usta'}</p>
                    <p className="text-xs text-gray-500 truncate">{c.user?.email}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(c.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <a
                    href={c.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-primary-50 text-primary-600 rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                  >
                    <ExternalLink size={13} /> Görüntüle
                  </a>
                  <button
                    onClick={() => handleStatus(c.id, 'APPROVED')}
                    disabled={actionId === c.id}
                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <Check size={14} /> Onayla
                  </button>
                  <button
                    onClick={() => handleStatus(c.id, 'REJECTED')}
                    disabled={actionId === c.id}
                    className="flex-1 py-2.5 bg-rose-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <X size={14} /> Reddet
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCertificatesPage
