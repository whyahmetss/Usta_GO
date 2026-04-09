import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { CheckCircle, XCircle, AlertCircle, Loader, Clock, Zap } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { SkeletonList } from '../components/SkeletonLoader'

function AdminWithdrawalsPage() {
  const navigate = useNavigate()
  const [withdrawals, setWithdrawals] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, id: null })
  const [rejectReason, setRejectReason] = useState('')

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

  const openApprove = (id) => setConfirmDialog({ open: true, type: 'approve', id })
  const openReject = (id) => { setRejectReason(''); setConfirmDialog({ open: true, type: 'reject', id }) }
  const closeDialog = () => setConfirmDialog({ open: false, type: null, id: null })

  const handleApprove = async () => {
    const id = confirmDialog.id
    try {
      setProcessingId(id)
      setError(null)
      await fetchAPI(`/wallet/withdraw/${id}/approve`, { method: 'PATCH', body: {} })
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' } : w))
      closeDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    const id = confirmDialog.id
    try {
      setProcessingId(id)
      setError(null)
      await fetchAPI(`/wallet/withdraw/${id}/reject`, { method: 'PATCH', body: { rejectionReason: rejectReason || 'Belirtilmedi' } })
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected', rejectionReason: rejectReason } : w))
      closeDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const filterOptions = [
    { id: 'pending', label: 'Bekleyen' },
    { id: 'approved', label: 'Onaylanan' },
    { id: 'rejected', label: 'Reddedilen' },
  ]

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Para Çekme Talepleri"
        onBack={() => navigate(-1)}
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Filter tabs */}
        <div className="flex bg-white/[0.04] rounded-xl p-1 gap-1">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] ${
                filter === f.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label}
              {f.id === 'pending' && ` (${withdrawals.filter(w => w.status === 'pending').length})`}
            </button>
          ))}
        </div>

        {error && (
          <Card className="!bg-rose-500/10 !border-rose-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-rose-400">Hata</p>
                <p className="text-[11px] text-rose-300">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : filteredWithdrawals.length === 0 ? (
          <EmptyState
            icon={filter === 'pending' ? Clock : filter === 'approved' ? CheckCircle : XCircle}
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
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {w.professional?.avatar || <Zap size={18} className="text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{w.professional?.name || w.userId || 'Usta'}</p>
                      <p className="text-[11px] text-zinc-500">
                        {new Date(w.requestDate || w.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-400">{(w.amount || 0).toLocaleString('tr-TR')} TL</p>
                    <StatusBadge status={w.status} />
                  </div>
                </div>

                {/* Bank details */}
                <div className="bg-white/[0.04] rounded-xl p-3 space-y-1.5 mb-3">
                  {w.bankName && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Banka</span>
                      <span className="font-semibold text-white">{w.bankName}</span>
                    </div>
                  )}
                  {w.iban && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">IBAN</span>
                      <span className="font-mono text-[11px] text-white">{w.iban}</span>
                    </div>
                  )}
                  {w.accountHolder && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Hesap Sahibi</span>
                      <span className="font-semibold text-white">{w.accountHolder}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {w.status === 'pending' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openReject(w.id)}
                      disabled={processingId === w.id}
                      className="py-2.5 bg-rose-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={14} /> {processingId === w.id ? 'İşleniyor' : 'Reddet'}
                    </button>
                    <button
                      onClick={() => openApprove(w.id)}
                      disabled={processingId === w.id}
                      className="py-2.5 bg-emerald-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={14} /> {processingId === w.id ? 'İşleniyor' : 'Onayla'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/[0.04] rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs">
                      {w.status === 'approved'
                        ? <CheckCircle size={14} className="text-emerald-400" />
                        : <XCircle size={14} className="text-rose-400" />}
                      <span className="text-zinc-400">
                        {w.processedDate && new Date(w.processedDate).toLocaleString('tr-TR')} tarihinde işlendi
                      </span>
                    </div>
                    {w.rejectionReason && (
                      <p className="text-[11px] text-rose-400 mt-1.5">Red nedeni: {w.rejectionReason}</p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'approve'}
        onClose={closeDialog}
        onConfirm={handleApprove}
        title="Cekim Onaylansin mi?"
        description="Bu islemi onayladiginizda ustanin hesabina odeme yapilacaktir. Bu islem geri alinamaz."
        confirmLabel="Evet, Onayla"
        variant="success"
        loading={!!processingId}
      />

      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'reject'}
        onClose={closeDialog}
        onConfirm={handleReject}
        title="Cekim Reddedilsin mi?"
        description="Bu talep reddedilecek ve ustaya bildirilecektir."
        confirmLabel="Evet, Reddet"
        variant="danger"
        loading={!!processingId}
      >
        <input
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder="Red nedeni (opsiyonel)"
          className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none mt-2"
          aria-label="Red nedeni"
        />
      </ConfirmDialog>
    </div>
  )
}

export default AdminWithdrawalsPage
