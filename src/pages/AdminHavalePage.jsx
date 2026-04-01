import { useState, useEffect } from 'react'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { CheckCircle, XCircle, Clock, Building2, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

const DURUM_LABELS = { BEKLIYOR: 'Bekliyor', ONAYLANDI: 'Onaylandı', REDDEDILDI: 'Reddedildi' }
const DURUM_COLORS = {
  BEKLIYOR:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ONAYLANDI:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REDDEDILDI:  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
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

  const handleOnayla = async (id) => {
    if (!window.confirm('Bu havale talebini onaylıyor musunuz? Kullanıcının bakiyesine eklenecek.')) return
    try {
      setProcessingId(id)
      await fetchAPI(API_ENDPOINTS.WALLET.HAVALE_ADMIN_ONAYLA(id), { method: 'PATCH', body: {} })
      setTalepler(prev => prev.map(t => t.id === id ? { ...t, durum: 'ONAYLANDI' } : t))
    } catch (e) {
      alert('Hata: ' + e.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReddet = async (id) => {
    const not = window.prompt('Red nedeni (isteğe bağlı):') ?? null
    if (not === null) return // iptal
    try {
      setProcessingId(id)
      await fetchAPI(API_ENDPOINTS.WALLET.HAVALE_ADMIN_REDDET(id), { method: 'PATCH', body: { not } })
      setTalepler(prev => prev.map(t => t.id === id ? { ...t, durum: 'REDDEDILDI' } : t))
    } catch (e) {
      alert('Hata: ' + e.message)
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
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
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
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}
            >
              {DURUM_LABELS[d]} {counts[d] > 0 && `(${counts[d]})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Building2} title="Talep yok" description={`${DURUM_LABELS[filter]} havale talebi bulunmuyor`} />
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <Card key={t.id} padding="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Kullanıcı */}
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {t.user?.name || 'Bilinmiyor'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{t.user?.email}</p>
                    {t.user?.phone && <p className="text-xs text-gray-400">{t.user.phone}</p>}

                    {/* Tutar + Ref kodu */}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-lg font-black text-gray-900 dark:text-white">
                        {Number(t.tutar).toLocaleString('tr-TR')} TL
                      </span>
                      <span className="font-mono text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg">
                        {t.referansKodu}
                      </span>
                    </div>

                    {/* Tarih */}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(t.createdAt).toLocaleString('tr-TR')}
                    </p>

                    {/* Admin notu */}
                    {t.adminNot && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Not: {t.adminNot}</p>
                    )}
                  </div>

                  {/* Durum badge */}
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${DURUM_COLORS[t.durum]}`}>
                    {DURUM_LABELS[t.durum]}
                  </span>
                </div>

                {/* Aksiyon butonları — sadece BEKLIYOR'da */}
                {t.durum === 'BEKLIYOR' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleOnayla(t.id)}
                      disabled={processingId === t.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      {processingId === t.id
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><CheckCircle size={15} /> Onayla</>
                      }
                    </button>
                    <button
                      onClick={() => handleReddet(t.id)}
                      disabled={processingId === t.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition"
                    >
                      <XCircle size={15} /> Reddet
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

export default AdminHavalePage
