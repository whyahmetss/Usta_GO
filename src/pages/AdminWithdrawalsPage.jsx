import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'

function AdminWithdrawalsPage() {
  const navigate = useNavigate()
  const [withdrawals, setWithdrawals] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch withdrawal transactions from wallet endpoint
      const res = await fetchAPI('/wallet/transactions', {
        method: 'GET'
      })
      const transactions = Array.isArray(res) ? res : res.data || []
      // Filter for withdrawal requests
      setWithdrawals(transactions.filter(t => t.type === 'withdrawal'))
    } catch (err) {
      setError(err.message)
      setWithdrawals([])
    } finally {
      setLoading(false)
    }
  }

  const filteredWithdrawals = withdrawals.filter(w => w.status === filter)

  const handleApprove = async (id) => {
    if (window.confirm('Bu çekim talebini onaylamak istediğinize emin misiniz?')) {
      try {
        setProcessingId(id)
        setError(null)
        // TODO: Use PATCH /api/wallet/withdraw/:id/approve when endpoint is available
        await fetchAPI(`/wallet/withdraw/${id}/approve`, {
          method: 'PATCH',
          body: {}
        })
        setWithdrawals(prev =>
          prev.map(w => w.id === id ? { ...w, status: 'approved' } : w)
        )
        alert('Çekim talebi onaylandı!')
      } catch (err) {
        setError(err.message)
      } finally {
        setProcessingId(null)
      }
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Red nedeni (opsiyonel):')
    if (reason !== null) {
      try {
        setProcessingId(id)
        setError(null)
        // TODO: Use PATCH /api/wallet/withdraw/:id/reject when endpoint is available
        await fetchAPI(`/wallet/withdraw/${id}/reject`, {
          method: 'PATCH',
          body: { rejectionReason: reason || 'Belirtilmedi' }
        })
        setWithdrawals(prev =>
          prev.map(w => w.id === id ? { ...w, status: 'rejected', rejectionReason: reason } : w)
        )
        alert('Çekim talebi reddedildi!')
      } catch (err) {
        setError(err.message)
      } finally {
        setProcessingId(null)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Para Cekme Talepleri</h1>
              <p className="text-xs text-gray-500">Usta odemelerini yonetin</p>
            </div>
          </div>
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
            {['pending', 'approved', 'rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>
                {f === 'pending' ? `Bekleyen (${withdrawals.filter(w => w.status === 'pending').length})` : f === 'approved' ? 'Onaylanan' : 'Reddedilen'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700">Hata</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader size={40} className="mx-auto mb-3 text-blue-600 animate-spin" />
            <p className="text-gray-600 font-semibold">Çekim talepleri yükleniyor...</p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{filter === 'pending' ? '⏳' : filter === 'approved' ? '✅' : '❌'}</div>
            <p className="text-gray-600 font-semibold">
              {filter === 'pending' ? 'Bekleyen talep yok' : filter === 'approved' ? 'Onaylanan talep yok' : 'Reddedilen talep yok'}
            </p>
          </div>
        ) : (
          filteredWithdrawals.map(w => (
            <div key={w.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">{w.professional?.avatar || '⚡'}</div>
                  <div>
                    <p className="font-bold text-gray-900">{w.professional?.name || w.userId || 'Usta'}</p>
                    <p className="text-xs text-gray-500">{new Date(w.requestDate || w.createdAt).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-600">{(w.amount || 0).toLocaleString('tr-TR')} TL</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mt-1 ${
                    w.status === 'pending' ? 'bg-orange-100 text-orange-700' : w.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{w.status === 'pending' ? 'Bekliyor' : w.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {w.bankName && <div className="flex justify-between text-sm"><span className="text-gray-600">Banka:</span><span className="font-semibold text-gray-900">{w.bankName}</span></div>}
                {w.iban && <div className="flex justify-between text-sm"><span className="text-gray-600">IBAN:</span><span className="font-mono text-xs text-gray-900">{w.iban}</span></div>}
                {w.accountHolder && <div className="flex justify-between text-sm"><span className="text-gray-600">Hesap Sahibi:</span><span className="font-semibold text-gray-900">{w.accountHolder}</span></div>}
              </div>
              {w.status === 'pending' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleReject(w.id)}
                    disabled={processingId === w.id}
                    className="py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={18} /> {processingId === w.id ? 'İşleniyor' : 'Reddet'}
                  </button>
                  <button
                    onClick={() => handleApprove(w.id)}
                    disabled={processingId === w.id}
                    className="py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={18} /> {processingId === w.id ? 'İşleniyor' : 'Onayla'}
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm">
                    {w.status === 'approved' ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                    <span className="text-gray-700">{w.processedDate && new Date(w.processedDate).toLocaleString('tr-TR')} tarihinde işlendi</span>
                  </div>
                  {w.rejectionReason && <p className="text-xs text-red-600 mt-2">Red nedeni: {w.rejectionReason}</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminWithdrawalsPage
