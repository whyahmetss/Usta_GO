import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Check, X, FileText, User } from 'lucide-react'

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
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Onay Bekleyen Ustalar</h1>
            <p className="text-sm text-gray-500">Kayıt olan ustaları onaylayın veya reddedin</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">{error}</div>
        )}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <User size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Onay bekleyen usta yok</p>
            <p className="text-gray-400 text-sm mt-1">Yeni usta kayıtları burada listelenir</p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl p-5 shadow border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    {u.phone && <p className="text-sm text-gray-500">{u.phone}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</p>
                    {u.certificates?.length > 0 && (
                      <a href={u.certificates[0].fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 font-medium">
                        <FileText size={14} /> Sertifika görüntüle
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApprove(u.id)} className="p-2.5 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition">
                      <Check size={20} />
                    </button>
                    <button onClick={() => handleReject(u.id)} className="p-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition">
                      <X size={20} />
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

export default AdminPendingUstasPage
