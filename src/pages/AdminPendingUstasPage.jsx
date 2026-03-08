import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { Check, X, FileText, Loader, HardHat, Zap } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

function AdminPendingUstasPage() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetchAPI(API_ENDPOINTS.ADMIN.PENDING_USTAS)
      setList(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (userId) => {
    if (!confirm('Bu ustayı onaylamak istediğinize emin misiniz?')) return
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.APPROVE_USTA(userId), { method: 'PATCH' })
      load()
    } catch (err) {
      alert('Hata: ' + (err.message || 'Onaylama başarısız'))
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Bu ustayı reddetmek istediğinize emin misiniz? Hesabı kapatılacaktır.')) return
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.REJECT_USTA(userId), { method: 'PATCH' })
      load()
    } catch (err) {
      alert('Hata: ' + (err.message || 'Red başarısız'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Onay Bekleyen Ustalar"
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
            <p className="text-xs text-gray-500">Ustalar yükleniyor...</p>
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={HardHat}
            title="Onay bekleyen usta yok"
            description="Yeni usta kayıtları burada listelenir."
          />
        ) : (
          <div className="space-y-3">
            {list.map((u) => (
              <Card key={u.id}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Zap size={18} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    {u.phone && <p className="text-xs text-gray-500">{u.phone}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                    {u.certificates?.length > 0 && (
                      <a
                        href={u.certificates[0].fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 font-medium"
                      >
                        <FileText size={13} /> Sertifika görüntüle
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(u.id)}
                    className="py-2.5 bg-emerald-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                  >
                    <Check size={14} /> Onayla
                  </button>
                  <button
                    onClick={() => handleReject(u.id)}
                    className="py-2.5 bg-rose-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
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

export default AdminPendingUstasPage
