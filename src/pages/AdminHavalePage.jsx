import { useState, useEffect } from 'react'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { CheckCircle, XCircle, Clock, Building2, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { SkeletonList } from '../components/SkeletonLoader'

const DURUM_LABELS = { BEKLIYOR: 'Bekliyor', ONAYLANDI: 'Onaylandı', REDDEDILDI: 'Reddedildi' }
const DURUM_COLORS = {
  BEKLIYOR:    'bg-amber-500/10 text-amber-400',
  ONAYLANDI:   'bg-emerald-500/10 text-emerald-400',
  REDDEDILDI:  'bg-rose-500/10 text-rose-400',
}

function AdminHavalePage() {
  const [talepler, setTalepler]   = useState([])
  const [filter, setFilter]       = useState('BEKLIYOR')
  const [loading, setLoading]     = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError]         = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchAPI(API_ENDPOINTS.WALLET.HAVALE_ADMIN_TALEPLER)
      setTalepler(Array.isArray(res?.data) ? res.data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, id: null })
  const [reddetNot, setReddetNot] = useState('')

  const openOnayla = (id) => setConfirmDialog({ open: true, type: 'onayla', id })
  const openReddet = (id) => { setReddetNot(''); setConfirmDialog({ open: true, type: 'reddet', id }) }
  const closeDialog = () => setConfirmDialog({ open: false, type: null, id: null })

  const handleOnayla = async () => {
    const id = confirmDialog.id
    try {
      setProcessingId(id)
      await fetchAPI(API_ENDPOINTS.WALLET.HAVALE_ADMIN_ONAYLA(id), { method: 'PATCH', body: {} })
      setTalepler(prev => prev.map(t => t.id === id ? { ...t, durum: 'ONAYLANDI' } : t))
      closeDialog()
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReddet = async () => {
    const id = confirmDialog.id
    try {
      setProcessingId(id)
      await fetchAPI(API_ENDPOINTS.WALLET.HAVALE_ADMIN_REDDET(id), { method: 'PATCH', body: { not: reddetNot } })
      setTalepler(prev => prev.map(t => t.id === id ? { ...t, durum: 'REDDEDILDI' } : t))
      closeDialog()
    } catch (e) {
      setError(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = talepler.filter(t => t.durum === filter)
  const counts = {
    BEKLIYOR:   talepler.filter(t => t.durum === 'BEKLIYOR').length,
    ONAYLANDI:  talepler.filter(t => t.durum === 'ONAYLANDI').length,
    REDDEDILDI: talepler.filter(t => t.durum === 'REDDEDILDI').length,
  }

  return (
    <div>
      <PageHeader
        title="Havale Talepleri"
        rightAction={
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06]">
            <RefreshCw size={16} className={`text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Filtre */}
        <div className="flex gap-2">
          {['BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI'].map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                filter === d
                  ? d === 'BEKLIYOR' ? 'bg-amber-500 text-white'
                    : d === 'ONAYLANDI' ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                  : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {DURUM_LABELS[d]} {counts[d] > 0 && `(${counts[d]})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-sm text-rose-400">
            {error}
          </div>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Building2} title="Talep yok" description={`${DURUM_LABELS[filter]} havale talebi bulunmuyor`} />
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <Card key={t.id} padding="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Kullanıcı */}
                    <p className="font-semibold text-white text-sm truncate">
                      {t.user?.name || 'Bilinmiyor'}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{t.user?.email}</p>
                    {t.user?.phone && <p className="text-xs text-zinc-500">{t.user.phone}</p>}

                    {/* Tutar + Ref kodu */}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-lg font-black text-white">
                        {Number(t.tutar).toLocaleString('tr-TR')} TL
                      </span>
                      <span className="font-mono text-xs font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-lg">
                        {t.referansKodu}
                      </span>
                    </div>

                    {/* Tarih */}
                    <p className="text-[11px] text-zinc-600 mt-1">
                      {new Date(t.createdAt).toLocaleString('tr-TR')}
                    </p>

                    {/* Admin notu */}
                    {t.adminNot && (
                      <p className="text-xs text-zinc-500 mt-1 italic">Not: {t.adminNot}</p>
                    )}
                  </div>

                  {/* Durum badge */}
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${DURUM_COLORS[t.durum]}`}>
                    {DURUM_LABELS[t.durum]}
                  </span>
                </div>

                {/* Aksiyon butonları — sadece BEKLIYOR'da */}
                {t.durum === 'BEKLIYOR' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                    <button
                      onClick={() => openOnayla(t.id)}
                      disabled={processingId === t.id}
                      className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      {processingId === t.id
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><CheckCircle size={15} /> Onayla</>
                      }
                    </button>
                    <button
                      onClick={() => openReddet(t.id)}
                      disabled={processingId === t.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-transparent border border-rose-500/30 text-rose-400 rounded-xl font-semibold text-xs disabled:opacity-50 active:scale-[0.98] transition hover:bg-rose-500/10"
                    >
                      <XCircle size={13} /> Reddet
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Onay Dialogu */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'onayla'}
        onClose={closeDialog}
        onConfirm={handleOnayla}
        title="Havale Onaylansın mı?"
        description="Bu islemi onayladiginizda kullanicinin bakiyesine tutar eklenecektir. Bu islem geri alinamaz."
        confirmLabel="Evet, Onayla"
        variant="success"
        loading={!!processingId}
      />

      {/* Red Dialogu */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'reddet'}
        onClose={closeDialog}
        onConfirm={handleReddet}
        title="Havale Reddedilsin mi?"
        description="Bu talep reddedilecek ve kullaniciya bildirilecektir."
        confirmLabel="Evet, Reddet"
        variant="danger"
        loading={!!processingId}
      >
        <input
          value={reddetNot}
          onChange={e => setReddetNot(e.target.value)}
          placeholder="Red nedeni (istege bagli)"
          className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none mt-2"
          aria-label="Red nedeni"
        />
      </ConfirmDialog>
    </div>
  )
}

export default AdminHavalePage
