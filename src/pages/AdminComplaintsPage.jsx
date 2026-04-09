import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import {
  CheckCircle2, XCircle, AlertCircle, Loader, User, Zap,
  Star, Trash2, RefreshCw, MessageSquare,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}
      style={{ animation: 'slideDown .25s ease' }}>
      {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      {toast.msg}
    </div>
  )
}

// ──────────────────────────────────────────
// Şikayetler Tab
// ──────────────────────────────────────────
function ComplaintsTab() {
  const [complaints, setComplaints] = useState([])
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAPI('/complaints', { method: 'GET' })
      setComplaints(Array.isArray(res) ? res : res.data || [])
    } catch (e) { showToast('Yüklenemedi: ' + e.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAction = async (complaint, action) => {
    setActioning(complaint.id)
    try {
      await fetchAPI(`/complaints/${complaint.id}/${action}`, { method: 'PUT' })
      setComplaints(prev => prev.map(c => c.id === complaint.id
        ? { ...c, status: action === 'resolve' ? 'resolved' : 'rejected' } : c))
      showToast(action === 'resolve' ? 'Şikayet çözüldü' : 'Şikayet reddedildi', action === 'resolve' ? 'success' : 'error')
    } catch (e) { showToast('İşlem başarısız: ' + e.message, 'error') }
    finally { setActioning(null) }
  }

  const filters = [
    { id: 'open', label: 'Açık' },
    { id: 'resolved', label: 'Çözüldü' },
    { id: 'rejected', label: 'Reddedildi' },
    { id: 'all', label: 'Tümü' },
  ]
  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter)

  return (
    <div>
      <Toast toast={toast} />

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">{complaints.length} şikayet</p>
        <button onClick={load} disabled={loading} className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center">
          <RefreshCw size={14} className={`text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${filter === f.id ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'}`}>
            {f.label}
            {f.id !== 'all' && ` (${complaints.filter(c => c.status === f.id).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16"><Loader size={28} className="text-blue-500 animate-spin mb-3" /><p className="text-sm text-zinc-500">Yükleniyor...</p></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Gösterilecek şikayet yok" description="Bu kategoride şikayet bulunmuyor." />
      ) : (
        <div className="space-y-3">
          {filtered.map((c, idx) => (
            <div key={c.id || idx} className={`bg-zinc-900 rounded-2xl border overflow-hidden ${
              c.status === 'open' ? 'border-amber-500/20' :
              c.status === 'resolved' ? 'border-emerald-500/20' :
              'border-rose-500/20'
            }`}>
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-bold text-white">{c.jobTitle || 'İş'}</p>
                    {c.filedAt && <p className="text-[11px] text-zinc-600 mt-0.5">{new Date(c.filedAt).toLocaleString('tr-TR')}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    c.status === 'open' ? 'bg-amber-500/15 text-amber-400' :
                    c.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-rose-500/15 text-rose-400'
                  }`}>
                    {c.status === 'open' ? 'Açık' : c.status === 'resolved' ? 'Çözüldü' : 'Reddedildi'}
                  </span>
                </div>

                {/* Reason */}
                <div className="bg-rose-500/10 rounded-xl p-3 mb-3">
                  <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">Şikayet Nedeni</p>
                  <p className="text-xs font-semibold text-rose-300">{c.reason}</p>
                </div>

                {c.details && (
                  <p className="text-xs text-zinc-400 bg-white/[0.04] p-3 rounded-xl mb-3">{c.details}</p>
                )}

                {/* People */}
                <div className="space-y-2">
                  {/* Şikayet Eden */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-red-500/[0.06] border border-red-500/15 rounded-xl">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{c.filedByName || '—'}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{c.filedByEmail}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">Şikayet Eden</span>
                  </div>
                  {/* Müşteri */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-blue-500/[0.06] border border-blue-500/15 rounded-xl">
                    <User size={14} className="text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{c.customerName || '—'}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{c.customerEmail}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">Müşteri</span>
                  </div>
                  {/* Usta */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl">
                    <Zap size={14} className="text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{c.professionalName || '—'}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{c.professionalEmail}</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">Usta</span>
                  </div>
                </div>
              </div>

              {c.status === 'open' && (
                <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-1">
                  <button onClick={() => handleAction(c, 'resolve')} disabled={actioning === c.id}
                    className="py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition">
                    {actioning === c.id ? <Loader size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Çözüldü
                  </button>
                  <button onClick={() => handleAction(c, 'reject')} disabled={actioning === c.id}
                    className="py-2.5 bg-rose-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition">
                    <XCircle size={13} /> Reddet
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Değerlendirmeler Tab
// ──────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState('all') // 'all' | '1' | '2' | '3' | '4' | '5'
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAPI(API_ENDPOINTS.REVIEWS.ADMIN_ALL)
      setReviews(Array.isArray(res) ? res : res.data || [])
    } catch (e) { showToast('Yüklenemedi: ' + e.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('Bu değerlendirmeyi silmek istediğinizden emin misiniz?')) return
    setDeletingId(id)
    try {
      await fetchAPI(API_ENDPOINTS.REVIEWS.ADMIN_DELETE(id), { method: 'DELETE' })
      setReviews(prev => prev.filter(r => r.id !== id))
      showToast('Değerlendirme silindi')
    } catch (e) { showToast('Silinemedi: ' + e.message, 'error') }
    finally { setDeletingId(null) }
  }

  const filtered = ratingFilter === 'all' ? reviews : reviews.filter(r => r.rating === Number(ratingFilter))

  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'

  return (
    <div>
      <Toast toast={toast} />

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-amber-500/10 rounded-2xl p-3 text-center border border-white/[0.06]">
            <p className="text-xl font-black text-amber-400">{avg}</p>
            <p className="text-[10px] text-amber-400/70 mt-0.5">Ortalama</p>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-3 text-center border border-white/[0.06]">
            <p className="text-xl font-black text-blue-400">{reviews.length}</p>
            <p className="text-[10px] text-blue-400/70 mt-0.5">Toplam</p>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl p-3 text-center border border-white/[0.06]">
            <p className="text-xl font-black text-emerald-400">{reviews.filter(r => r.rating >= 4).length}</p>
            <p className="text-[10px] text-emerald-400/70 mt-0.5">4+ Puan</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5 flex-wrap">
          {['all', '5', '4', '3', '2', '1'].map(v => (
            <button key={v} onClick={() => setRatingFilter(v)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${ratingFilter === v ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'}`}>
              {v === 'all' ? 'Tümü' : `${'★'.repeat(Number(v))}`}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading} className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          <RefreshCw size={14} className={`text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16"><Loader size={28} className="text-blue-500 animate-spin mb-3" /><p className="text-sm text-zinc-500">Yükleniyor...</p></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Star} title="Değerlendirme bulunamadı" description="Henüz değerlendirme yapılmamış." />
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
              {/* Stars + date */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={s <= r.rating ? 'text-amber-400' : 'text-zinc-700'} fill={s <= r.rating ? 'currentColor' : 'none'} />
                  ))}
                  <span className="ml-1.5 text-xs font-bold text-amber-500">{r.rating}.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-zinc-600">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</p>
                  <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id}
                    className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition disabled:opacity-50">
                    {deletingId === r.id ? <Loader size={11} className="animate-spin" /> : <Trash2 size={11} />}
                  </button>
                </div>
              </div>

              {/* Job */}
              {r.job && (
                <p className="text-xs font-semibold text-zinc-300 mb-2">📋 {r.job.title}</p>
              )}

              {/* Comment */}
              {r.comment && (
                <p className="text-xs text-zinc-400 bg-white/[0.04] rounded-xl p-2.5 mb-3 italic">"{r.comment}"</p>
              )}

              {/* People */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <User size={12} className="text-blue-400 flex-shrink-0" />
                  <p className="text-[11px] text-zinc-400 truncate">{r.customer?.name || '—'}</p>
                </div>
                <span className="text-zinc-700">→</span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <Zap size={12} className="text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] text-zinc-400 truncate">{r.usta?.name || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────
function AdminComplaintsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('complaints') // 'complaints' | 'reviews'

  return (
    <div className="min-h-screen">
      <PageHeader title="Şikayet & Değerlendirme" onBack={() => navigate('/admin')} />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Tab toggle */}
        <div className="flex gap-2">
          <button onClick={() => setTab('complaints')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold transition ${tab === 'complaints' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:border-white/[0.1]'}`}>
            <AlertCircle size={14} /> Şikayetler
          </button>
          <button onClick={() => setTab('reviews')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold transition ${tab === 'reviews' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:border-white/[0.1]'}`}>
            <Star size={14} /> Değerlendirmeler
          </button>
        </div>

        {tab === 'complaints' && <ComplaintsTab />}
        {tab === 'reviews' && <ReviewsTab />}
      </div>
    </div>
  )
}

export default AdminComplaintsPage
