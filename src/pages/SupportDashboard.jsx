import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import {
  MessageCircle, UserCheck, UserX, Phone, Loader, Users,
  FileText, ExternalLink, RefreshCw, AlertCircle, CheckCircle2,
  Clock, ChevronDown, ChevronUp, Headphones,
} from 'lucide-react'

const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_WHATSAPP || ''
const WHATSAPP_URL = SUPPORT_PHONE
  ? `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}`
  : null

const DOC_LABELS = {
  kimlikOn: 'Kimlik Ön',
  kimlikArka: 'Kimlik Arka',
  meslek: 'Mesleki Sertifika',
  adres: 'İkametgah',
  adliSicil: 'Adli Sicil',
  vergi: 'Vergi Levhası',
  profil: 'Profil Fotoğrafı',
}

function UstaCard({ u, onApprove, onReject, actioning }) {
  const [open, setOpen] = useState(false)
  const busy = actioning === u.id

  return (
    <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] overflow-hidden shadow-sm">
      {/* Header */}
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
          <span className="text-[10px] text-slate-400">
            {new Date(u.createdAt).toLocaleDateString('tr-TR')}
          </span>
          <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Documents (expandable) */}
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
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Belge yüklenmemiş</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 p-4 pt-2 border-t border-slate-100 dark:border-white/5">
        <button
          onClick={() => onApprove(u.id)}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-[0.97] transition disabled:opacity-50"
        >
          {busy ? <Loader size={14} className="animate-spin" /> : <UserCheck size={15} />}
          Onayla
        </button>
        <button
          onClick={() => onReject(u.id)}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm active:scale-[0.97] transition disabled:opacity-50"
        >
          <UserX size={15} />
          Reddet
        </button>
      </div>
    </div>
  )
}

export default function SupportDashboard() {
  const navigate = useNavigate()
  const [ustas, setUstas] = useState([])
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
      const r = await fetchAPI('/support/pending-ustas')
      setUstas(Array.isArray(r?.data) ? r.data : [])
    } catch (e) {
      showToast('Veriler yüklenemedi: ' + e.message, 'error')
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
      await fetchAPI(`/support/users/${userId}/approve-usta`, { method: 'PATCH' })
      showToast('Usta başarıyla onaylandı')
      await load(true)
    } catch (e) {
      showToast(e.message || 'Onaylama başarısız', 'error')
    } finally {
      setActioning(null)
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Bu ustayı reddetmek istediğinize emin misiniz?\nHesabı reddedilecek.')) return
    setActioning(userId)
    try {
      await fetchAPI(`/support/users/${userId}/reject-usta`, { method: 'PATCH' })
      showToast('Usta reddedildi', 'error')
      await load(true)
    } catch (e) {
      showToast(e.message || 'Red işlemi başarısız', 'error')
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a1628]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold transition-all ${
          toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
        }`} style={{ animation: 'slideDown .25s ease' }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-10 pb-6 px-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Headphones size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">Müşteri Hizmetleri</h1>
                <p className="text-xs text-blue-100">Destek Paneli</p>
              </div>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
            >
              <RefreshCw size={16} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{ustas.length}</p>
              <p className="text-xs text-blue-100 mt-0.5">Bekleyen Başvuru</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center">
              <Clock size={20} className="text-white mx-auto mb-1" />
              <p className="text-xs text-blue-100">Aktif Destek</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* WhatsApp / Destek hattı */}
        {WHATSAPP_URL && (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 dark:text-white text-sm">WhatsApp Destek</p>
              <p className="text-xs text-slate-500">Müşterilerle direkt iletişim</p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition"
            >
              <Phone size={15} /> Aç
            </a>
          </div>
        )}

        {/* Bekleyen Ustalar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users size={15} /> Onay Bekleyen Ustalar
            </h2>
            {ustas.length > 0 && (
              <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full">
                {ustas.length} bekliyor
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-16">
              <Loader size={28} className="text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Yükleniyor...</p>
            </div>
          ) : ustas.length === 0 ? (
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-8 text-center shadow-sm">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Bekleyen başvuru yok</p>
              <p className="text-xs text-slate-400 mt-1">Yeni usta başvuruları burada görünür</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ustas.map(u => (
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
    </div>
  )
}
