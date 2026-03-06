import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Check, X, FileText } from 'lucide-react'

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
      <div className="bg-white border-b px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sertifika Onayları</h1>
          <p className="text-sm text-gray-500">Usta sertifikalarını incele</p>
        </div>
      </div>

      <div className="px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 mb-4">{error}</div>
        )}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Bekleyen sertifika yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{c.user?.name || 'Usta'}</p>
                    <p className="text-sm text-gray-500">{c.user?.email}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(c.createdAt).toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold">
                      Görüntüle
                    </a>
                    <button
                      onClick={() => handleStatus(c.id, 'APPROVED')}
                      disabled={actionId === c.id}
                      className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 disabled:opacity-50"
                      title="Onayla"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleStatus(c.id, 'REJECTED')}
                      disabled={actionId === c.id}
                      className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 disabled:opacity-50"
                      title="Reddet"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCertificatesPage
