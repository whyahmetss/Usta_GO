import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

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
      const res = await fetchAPI('/wallet/admin/withdrawals', { method: 'GET' })
      const transactions = Array.isArray(res) ? res : res.data || []
      setWithdrawals(transactions)
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

  const filterOptions = [
    { id: 'pending', label: 'Bekleyen' },
    { id: 'approved', label: 'Onaylanan' },
    { id: 'rejected', label: 'Reddedilen' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Para Çekme Talepleri"
        onBack={() => navigate(-1)}
      />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                filter === f.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {f.label}
              {f.id === 'pending' && ` (${withdrawals.filter(w => w.status === 'pending').length})`}
            </button>
          ))}
        </div>

        {error && (
          <Card className="!bg-rose-50 !border-rose-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-rose-700">Hata</p>
                <p className="text-[11px] text-rose-600">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <Loader size={28} className="text-primary-500 animate-spin mb-3" />
            <p className="text-xs text-gray-500">Çekim talepleri yükleniyor...</p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <EmptyState
            icon={filter === 'pending' ? '⏳' : filter === 'approved' ? '✅' : '❌'}
            title={filter === 'pending' ? 'Bekleyen talep yok' : filter === 'approved' ? 'Onaylanan talep yok' : 'Reddedilen talep yok'}
            description="Bu kategoride çekim talebi bulunmuyor."
          />
        ) : (
          <div className="space-y-3">
            {filteredWithdrawals.map(w => (
              <Card key={w.id}>
                {/* User & Amount */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {w.professional?.avatar || '⚡'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{w.professional?.name || w.userId || 'Usta'}</p>
                      <p className="text-[11px] text-gray-500">
                        {new Date(w.requestDate || w.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-600">{(w.amount || 0).toLocaleString('tr-TR')} TL</p>
                    <StatusBadge status={w.status} />
                  </div>
                </div>

                {/* Bank details */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 mb-3">
                  {w.bankName && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Banka</span>
                      <span className="font-semibold text-gray-900">{w.bankName}</span>
                    </div>
                  )}
                  {w.iban && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">IBAN</span>
                      <span className="font-mono text-[11px] text-gray-900">{w.iban}</span>
                    </div>
                  )}
                  {w.accountHolder && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Hesap Sahibi</span>
                      <span className="font-semibold text-gray-900">{w.accountHolder}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {w.status === 'pending' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleReject(w.id)}
                      disabled={processingId === w.id}
                      className="py-2.5 bg-rose-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={14} /> {processingId === w.id ? 'İşleniyor' : 'Reddet'}
                    </button>
                    <button
                      onClick={() => handleApprove(w.id)}
                      disabled={processingId === w.id}
                      className="py-2.5 bg-emerald-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={14} /> {processingId === w.id ? 'İşleniyor' : 'Onayla'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs">
                      {w.status === 'approved'
                        ? <CheckCircle size={14} className="text-emerald-500" />
                        : <XCircle size={14} className="text-rose-500" />}
                      <span className="text-gray-600">
                        {w.processedDate && new Date(w.processedDate).toLocaleString('tr-TR')} tarihinde işlendi
                      </span>
                    </div>
                    {w.rejectionReason && (
                      <p className="text-[11px] text-rose-600 mt-1.5">Red nedeni: {w.rejectionReason}</p>
                    )}
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

export default AdminWithdrawalsPage
