import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import {
  Check, X, FileText, Loader, ExternalLink, RefreshCw,
  ChevronDown, ChevronUp, Users, CheckCircle2, AlertCircle, ShieldCheck, User,
} from 'lucide-react'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

const DOC_LABELS = {
  kimlikOn: 'Kimlik Ön Yüz',
  kimlikArka: 'Kimlik Arka Yüz',
  meslek: 'Mesleki Sertifika',
  adres: 'İkametgah Belgesi',
  adliSicil: 'Adli Sicil Kaydı',
  vergi: 'Vergi Levhası',
  profil: 'Profil Fotoğrafı',
  ikamet: 'İkametgah / Sicil Kaydı',
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold ${
        toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
      }`}
      style={{ animation: 'slideDown .25s ease' }}
    >
      {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      {toast.msg}
    </div>
  )
}

// ---------- Usta Approval Tab ----------
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
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Belgeler ({u.certificates.length})
              </p>
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

function UstaApprovalTab() {
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
    } catch (err) { showToast('Yüklenemedi: ' + err.message, 'error') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (userId) => {
    if (!confirm('Bu ustayı onaylamak istediğinize emin misiniz?')) return
    setActioning(userId)
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.APPROVE_USTA(userId), { method: 'PATCH' })
      showToast('Usta onaylandı')
      await load(true)
    } catch (err) { showToast('Hata: ' + (err.message || 'Onaylama başarısız'), 'error') }
    finally { setActioning(null) }
  }

  const handleReject = async (userId) => {
    if (!confirm('Bu ustayı reddetmek istediğinize emin misiniz?')) return
    setActioning(userId)
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.REJECT_USTA(userId), { method: 'PATCH' })
      showToast('Usta reddedildi', 'error')
      await load(true)
    } catch (err) { showToast('Hata: ' + (err.message || 'Red başarısız'), 'error') }
    finally { setActioning(null) }
  }

  return (
    <div>
      <Toast toast={toast} />

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Onay bekleyen usta başvuruları</p>
        <button onClick={() => load(true)} disabled={refreshing} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
          <RefreshCw size={14} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!loading && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-md shadow-amber-500/20">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{list.length}</p>
            <p className="text-xs text-amber-100">Onay Bekleyen Usta Başvurusu</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16"><Loader size={28} className="text-blue-500 animate-spin mb-3" /><p className="text-sm text-slate-400">Yükleniyor...</p></div>
      ) : list.length === 0 ? (
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-10 text-center shadow-sm">
          <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-slate-600 dark:text-slate-300">Bekleyen başvuru yok</p>
          <p className="text-xs text-slate-400 mt-1">Yeni usta kayıtları burada görünecek</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(u => (
            <UstaCard key={u.id} u={u} onApprove={handleApprove} onReject={handleReject} actioning={actioning} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Customer Approval Tab ----------
function CustomerCard({ u, onApprove, onReject, actioning }) {
  const [open, setOpen] = useState(false)
  const busy = actioning === u.id

  return (
    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-black text-lg">
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
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Belgeler ({u.certificates.length})
              </p>
              {u.certificates.map(cert => (
                <a key={cert.id} href={cert.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition group">
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
        <button onClick={() => onApprove(u.id)} disabled={busy}
          className="flex items-center justify-center gap-1.5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-[0.97] transition disabled:opacity-50">
          {busy ? <Loader size={14} className="animate-spin" /> : <Check size={15} />} Onayla
        </button>
        <button onClick={() => onReject(u.id)} disabled={busy}
          className="flex items-center justify-center gap-1.5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm active:scale-[0.97] transition disabled:opacity-50">
          <X size={15} /> Reddet
        </button>
      </div>
    </div>
  )
}

function CustomerApprovalTab() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actioning, setActioning] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const res = await fetchAPI(API_ENDPOINTS.ADMIN.PENDING_CUSTOMERS)
      setList(Array.isArray(res?.data) ? res.data : [])
    } catch (err) { showToast('Yüklenemedi: ' + err.message, 'error') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (userId) => {
    if (!confirm('Bu müşteriyi onaylamak istediğinize emin misiniz?')) return
    setActioning(userId)
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.APPROVE_CUSTOMER(userId), { method: 'PATCH' })
      showToast('Müşteri onaylandı')
      await load(true)
    } catch (err) { showToast('Hata: ' + err.message, 'error') }
    finally { setActioning(null) }
  }

  const handleReject = async (userId) => {
    if (!confirm('Bu müşteriyi reddetmek istediğinize emin misiniz?')) return
    setActioning(userId)
    try {
      await fetchAPI(API_ENDPOINTS.ADMIN.REJECT_CUSTOMER(userId), { method: 'PATCH' })
      showToast('Müşteri reddedildi', 'error')
      await load(true)
    } catch (err) { showToast('Hata: ' + err.message, 'error') }
    finally { setActioning(null) }
  }

  return (
    <div>
      <Toast toast={toast} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Onay bekleyen müşteri başvuruları</p>
        <button onClick={() => load(true)} disabled={refreshing} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
          <RefreshCw size={14} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!loading && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-md shadow-blue-500/20">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-black text-white">{list.length}</p>
            <p className="text-xs text-blue-100">Onay Bekleyen Müşteri Başvurusu</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16"><Loader size={28} className="text-blue-500 animate-spin mb-3" /><p className="text-sm text-slate-400">Yükleniyor...</p></div>
      ) : list.length === 0 ? (
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-10 text-center shadow-sm">
          <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-slate-600 dark:text-slate-300">Bekleyen başvuru yok</p>
          <p className="text-xs text-slate-400 mt-1">Yeni müşteri kayıtları burada görünecek</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(u => (
            <CustomerCard key={u.id} u={u} onApprove={handleApprove} onReject={handleReject} actioning={actioning} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Certificates Tab ----------
function CertificatesTab() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [toast, setToast] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('PENDING')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadCertificates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAPI(API_ENDPOINTS.CERTIFICATES.ADMIN_LIST)
      setCertificates(Array.isArray(res?.data) ? res.data : [])
    } catch (err) { showToast('Sertifikalar yüklenemedi: ' + err.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadCertificates() }, [loadCertificates])

  const handleStatus = async (id, status) => {
    setActionId(id)
    try {
      await fetchAPI(API_ENDPOINTS.CERTIFICATES.ADMIN_UPDATE(id), { method: 'PATCH', body: { status } })
      setCertificates(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      showToast(status === 'APPROVED' ? 'Belge onaylandı' : 'Belge reddedildi', status === 'APPROVED' ? 'success' : 'error')
    } catch (err) { showToast('İşlem başarısız: ' + err.message, 'error') }
    finally { setActionId(null) }
  }

  const filtered = certificates.filter(c => {
    const roleMatch = roleFilter === 'all' || (c.user?.role?.toUpperCase() === roleFilter.toUpperCase())
    const statusMatch = statusFilter === 'all' || c.status === statusFilter
    return roleMatch && statusMatch
  })

  return (
    <div>
      <Toast toast={toast} />

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          {[{ key: 'all', label: 'Tümü' }, { key: 'USTA', label: 'Usta' }, { key: 'CUSTOMER', label: 'Müşteri' }].map(f => (
            <button key={f.key} onClick={() => setRoleFilter(f.key)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${roleFilter === f.key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
          <button onClick={loadCertificates} disabled={loading} className="ml-auto w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <RefreshCw size={14} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex gap-2">
          {[{ key: 'all', label: 'Tümü' }, { key: 'PENDING', label: 'Bekleyen' }, { key: 'APPROVED', label: 'Onaylı' }, { key: 'REJECTED', label: 'Reddedildi' }].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${statusFilter === f.key ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} belge</p>

      {loading ? (
        <div className="flex flex-col items-center py-16"><Loader size={28} className="text-primary-500 animate-spin mb-3" /><p className="text-xs text-gray-500">Yükleniyor...</p></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Belge bulunamadı" description="Seçilen filtreye uygun belge yok." />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] overflow-hidden shadow-sm">
              <div className="flex items-start gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  {c.user?.role?.toUpperCase() === 'USTA'
                    ? <ShieldCheck size={18} className="text-amber-600" />
                    : <User size={18} className="text-blue-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.user?.name || 'Kullanıcı'}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      c.user?.role?.toUpperCase() === 'USTA' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {c.user?.role?.toUpperCase() === 'USTA' ? 'Usta' : 'Müşteri'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.user?.email}</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                    {c.label || DOC_LABELS[c.docType] || c.docType || 'Belge'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(c.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                  c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  c.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {c.status === 'APPROVED' ? 'Onaylı' : c.status === 'REJECTED' ? 'Reddedildi' : 'Bekliyor'}
                </span>
              </div>

              <div className="flex gap-2 px-4 pb-4">
                <a
                  href={c.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-primary-50 text-primary-600 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                >
                  <ExternalLink size={13} /> Görüntüle
                </a>
                {c.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleStatus(c.id, 'APPROVED')}
                    disabled={actionId === c.id}
                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <Check size={13} /> Onayla
                  </button>
                )}
                {c.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleStatus(c.id, 'REJECTED')}
                    disabled={actionId === c.id}
                    className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <X size={13} /> Reddet
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Main Page ----------
export default function AdminVerificationPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('ustas')

  const tabs = [
    { key: 'ustas', label: 'Usta Onaylama' },
    { key: 'customers', label: 'Müşteri Onaylama' },
    { key: 'certificates', label: 'Tüm Belgeler' },
  ]

  return (
    <Layout hideNav>
      <PageHeader title="Onay & Sertifika" onBack={() => navigate('/admin')} />
      <div className="max-w-lg mx-auto px-4 pb-10">
        {/* Tabs */}
        <div className="flex gap-2 mt-4 mb-5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'ustas' && <UstaApprovalTab />}
        {tab === 'customers' && <CustomerApprovalTab />}
        {tab === 'certificates' && <CertificatesTab />}
      </div>
    </Layout>
  )
}
