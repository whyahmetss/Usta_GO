import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import {
  Check, X, FileText, Loader, ExternalLink, RefreshCw,
  ChevronDown, ChevronUp, Users, CheckCircle2, AlertCircle,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'

const DOC_LABELS = {
  kimlikOn: 'Kimlik Ön',
  kimlikArka: 'Kimlik Arka',
  meslek: 'Mesleki Sertifika',
  adres: 'İkametgah',
  adliSicil: 'Adli Sicil Kaydı',
  vergi: 'Vergi Levhası',
  profil: 'Profil Fotoğrafı',
}

function UstaCard({ u, onApprove, onReject, actioning }) {
  const [open, setOpen] = useState(false)
  const busy = actioning === u.id

  return (
    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-white font-black text-lg">
          {u.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-white text-sm">{u.name}</p>
          <p className="text-xs text-slate-500 truncate">{u.email}</p>
          {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] text-slate-400">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</span>
          <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-3 border-t border-slate-100 dark:border-white/5 pt-3">
          {u.certificates?.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Belgeler ({u.certificates.length})</p>
              {u.certificates.map(cert => (
                <a
                  key={cert.id}
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition group"
                >
                  <FileText size={14} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                  <span className="text-[12px] text-slate-600 dark:text-slate-300 flex-1 truncate">
                    {cert.label || DOC_LABELS[cert.docType] || cert.docType || 'Belge'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    cert.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                    cert.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {cert.status === 'APPROVED' ? 'Onaylı' : cert.status === 'REJECTED' ? 'Reddedildi' : 'Bekliyor'}
                  </span>
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Belge yüklenmemiş</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 p-4 pt-2 border-t border-slate-100 dark:border-white/5">
        <button
          onClick={() => onApprove(u.id)}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-[0.97] transition disabled:opacity-50"
        >
          {busy ? <Loader size={14} className="animate-spin" /> : <Check size={15} />}
          Onayla
        </button>
        <button
          onClick={() => onReject(u.id)}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm active:scale-[0.97] transition disabled:opacity-50"
        >
          <X size={15} />
          Reddet
        </button>
      </div>
    </div>
  )
}

export default function AdminPendingUstasPage() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actioning, setActioning] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetchAPI(API_ENDPOINTS.ADMIN.PENDING_USTAS)
      setList(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      showToast('Yüklenemedi: ' + err.message, 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (userId) => {
    if (!confirm('Bu ustayı onaylamak istediğinize emin misiniz?')) return
    setActioning(userId)
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.APPROVE_USTA(userId), { method: 'PATCH' })
      showToast('Usta onaylandı')
      await load(true)
    } catch (err) {
      showToast('Hata: ' + (err.message || 'Onaylama başarısız'), 'error')
    } finally {
      setActioning(null)
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Bu ustayı reddetmek istediğinize emin misiniz?')) return
    setActioning(userId)
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.REJECT_USTA(userId), { method: 'PATCH' })
      showToast('Usta reddedildi', 'error')
      await load(true)
    } catch (err) {
      showToast('Hata: ' + (err.message || 'Red başarısız'), 'error')
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0d]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold ${
          toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
        }`} style={{ animation: 'slideDown .25s ease' }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      <PageHeader
        title="Onay Bekleyen Ustalar"
        onBack={() => navigate('/admin')}
        rightAction={
          <button onClick={() => load(true)} disabled={refreshing} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <RefreshCw size={16} className={`text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Stats banner */}
        {!loading && (
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-md shadow-amber-500/20">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-black text-white">{list.length}</p>
              <p className="text-xs text-amber-100">Onay Bekleyen Başvuru</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader size={28} className="text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Yükleniyor...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-10 text-center shadow-sm">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
            <p className="font-bold text-slate-600 dark:text-slate-300">Bekleyen başvuru yok</p>
            <p className="text-xs text-slate-400 mt-1">Yeni usta kayıtları burada görünecek</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(u => (
              <UstaCard
                key={u.id}
                u={u}
                onApprove={handleApprove}
                onReject={handleReject}
                actioning={actioning}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
