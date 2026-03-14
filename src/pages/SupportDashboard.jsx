import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { connectSocket } from '../utils/socket'
import { useAuth } from '../context/AuthContext'
import {
  MessageCircle, UserCheck, UserX, Loader, Users,
  FileText, ExternalLink, RefreshCw, AlertCircle, CheckCircle2,
  Clock, ChevronDown, ChevronUp, Headphones, ChevronRight,
  Check, X, ShieldCheck, User, LogOut,
} from 'lucide-react'

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
    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] overflow-hidden shadow-sm">
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
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('ustas') // 'ustas' | 'chats' | 'complaints' | 'docs'
  const [ustas, setUstas] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actioning, setActioning] = useState(null)
  const [toast, setToast] = useState(null)

  // Conversations state
  const [conversations, setConversations] = useState([])
  const [convLoading, setConvLoading] = useState(false)

  // Complaints state
  const [complaints, setComplaints] = useState([])
  const [complaintLoading, setComplaintLoading] = useState(false)
  const [complaintFilter, setComplaintFilter] = useState('open')
  const [complaintActioning, setComplaintActioning] = useState(null)

  // Documents/Certificates state
  const [certs, setCerts] = useState([])
  const [certLoading, setCertLoading] = useState(false)
  const [certFilter, setCertFilter] = useState('PENDING')
  const [certRoleFilter, setCertRoleFilter] = useState('all')
  const [certActioning, setCertActioning] = useState(null)

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

  const loadConversations = useCallback(async () => {
    setConvLoading(true)
    try {
      const r = await fetchAPI('/support/conversations')
      setConversations(Array.isArray(r?.data) ? r.data : [])
    } catch (e) {
      console.error('Conv load error:', e)
    } finally {
      setConvLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Real-time: HER zaman dinle (hangi sekmede olursa olsun)
  useEffect(() => {
    if (!user?.id) return
    const socket = connectSocket(user.id)
    
    const onReceive = (msg) => {
      loadConversations()
      if (activeTab !== 'chats') {
        showToast('Yeni mesaj geldi!')
      }
    }
    
    const onNewSession = (data) => {
      loadConversations()
      showToast(`Yeni destek talebi: ${data?.userName || 'Kullanıcı'}`)
    }
    
    socket.on('receive_message', onReceive)
    socket.on('new_support_session', onNewSession)
    
    return () => {
      socket.off('receive_message', onReceive)
      socket.off('new_support_session', onNewSession)
    }
  }, [user, activeTab, loadConversations])

  // Her tab geçişinde ilgili veriyi yeniden yükle
  useEffect(() => {
    if (activeTab === 'chats') loadConversations()
    if (activeTab === 'complaints' && complaints.length === 0) loadComplaints()
    if (activeTab === 'docs' && certs.length === 0) loadCerts()
  }, [activeTab])

  const loadComplaints = useCallback(async () => {
    setComplaintLoading(true)
    try {
      const res = await fetchAPI(API_ENDPOINTS.COMPLAINTS.LIST)
      setComplaints(Array.isArray(res?.data) ? res.data : [])
    } catch (e) { showToast('Şikayetler yüklenemedi: ' + e.message, 'error') }
    finally { setComplaintLoading(false) }
  }, [])

  const handleComplaintAction = async (id, action) => {
    setComplaintActioning(id)
    try {
      const endpoint = action === 'resolve'
        ? API_ENDPOINTS.COMPLAINTS.RESOLVE(id)
        : API_ENDPOINTS.COMPLAINTS.REJECT(id)
      await fetchAPI(endpoint, { method: 'PUT' })
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: action === 'resolve' ? 'resolved' : 'rejected' } : c))
      showToast(action === 'resolve' ? 'Şikayet çözüldü' : 'Şikayet reddedildi', action === 'resolve' ? 'success' : 'error')
    } catch (e) { showToast('İşlem başarısız: ' + e.message, 'error') }
    finally { setComplaintActioning(null) }
  }

  const loadCerts = useCallback(async () => {
    setCertLoading(true)
    try {
      const res = await fetchAPI(API_ENDPOINTS.CERTIFICATES.ADMIN_LIST)
      setCerts(Array.isArray(res?.data) ? res.data : [])
    } catch (e) { showToast('Belgeler yüklenemedi: ' + e.message, 'error') }
    finally { setCertLoading(false) }
  }, [])

  const handleCertAction = async (id, status) => {
    setCertActioning(id)
    try {
      await fetchAPI(API_ENDPOINTS.CERTIFICATES.ADMIN_UPDATE(id), { method: 'PATCH', body: { status } })
      setCerts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      showToast(status === 'APPROVED' ? 'Belge onaylandı' : 'Belge reddedildi', status === 'APPROVED' ? 'success' : 'error')
    } catch (e) { showToast('İşlem başarısız: ' + e.message, 'error') }
    finally { setCertActioning(null) }
  }

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

  const roleLabel = (role) => {
    const r = (role || '').toUpperCase()
    if (r === 'CUSTOMER') return 'Müşteri'
    if (r === 'USTA') return 'Usta'
    return role
  }

  const fmt = (d) => {
    if (!d) return ''
    const date = new Date(d)
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return 'Az önce'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dk`
    if (diff < 86400000) return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0d]">
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
                <h1 className="text-lg font-black text-white">
                  {(() => {
                    const h = new Date().getHours()
                    const greeting = h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'
                    const firstName = user?.name?.split(' ')[0] || ''
                    return `${greeting}${firstName ? ', ' + firstName : ''}!`
                  })()}
                </h1>
                <p className="text-xs text-blue-100">Müşteri Hizmetleri Paneli</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeTab === 'ustas') load(true)
                  else if (activeTab === 'chats') loadConversations()
                  else if (activeTab === 'complaints') loadComplaints()
                  else loadCerts()
                }}
                disabled={refreshing || convLoading || complaintLoading || certLoading}
                className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
              >
                <RefreshCw size={16} className={`text-white ${(refreshing || convLoading || complaintLoading || certLoading) ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('Hesaptan çıkış yapmak istediğinize emin misiniz?')) {
                    await logout()
                    navigate('/', { replace: true })
                  }
                }}
                className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
              >
                <LogOut size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            <div className="bg-white/15 backdrop-blur rounded-2xl p-2.5 text-center">
              <p className="text-xl font-black text-white">{ustas.length}</p>
              <p className="text-[10px] text-blue-100 mt-0.5">Başvuru</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-2.5 text-center">
              <p className="text-xl font-black text-white">{conversations.length}</p>
              <p className="text-[10px] text-blue-100 mt-0.5">Konuşma</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-2.5 text-center">
              <p className="text-xl font-black text-white">{complaints.filter(c => c.status === 'open').length}</p>
              <p className="text-[10px] text-blue-100 mt-0.5">Şikayet</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-2.5 text-center">
              <p className="text-xl font-black text-white">{certs.filter(c => c.status === 'PENDING').length}</p>
              <p className="text-[10px] text-blue-100 mt-0.5">Belge</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { key: 'ustas', label: 'Başvurular', badge: ustas.length },
            { key: 'chats', label: 'Mesajlar', badge: conversations.filter(c => c.unread > 0).reduce((s, c) => s + c.unread, 0) },
            { key: 'complaints', label: 'Şikayetler', badge: complaints.filter(c => c.status === 'open').length },
            { key: 'docs', label: 'Belgeler', badge: certs.filter(c => c.status === 'PENDING').length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[11px] font-semibold transition ${
                activeTab === t.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#141414] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.07]'
              }`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? 'bg-white/30 text-white' : 'bg-rose-500 text-white'
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Usta Başvuruları */}
        {activeTab === 'ustas' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center py-16">
                <Loader size={28} className="text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Yükleniyor...</p>
              </div>
            ) : ustas.length === 0 ? (
              <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-8 text-center shadow-sm">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Bekleyen başvuru yok</p>
                <p className="text-xs text-slate-400 mt-1">Yeni usta başvuruları burada görünür</p>
              </div>
            ) : ustas.map(u => (
              <UstaCard key={u.id} u={u} onApprove={handleApprove} onReject={handleReject} actioning={actioning} />
            ))}
          </div>
        )}

        {/* Şikayetler */}
        {activeTab === 'complaints' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'open', label: 'Bekleyen' },
                { key: 'resolved', label: 'Çözüldü' },
                { key: 'rejected', label: 'Reddedildi' },
              ].map(f => (
                <button key={f.key} onClick={() => setComplaintFilter(f.key)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${complaintFilter === f.key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#141414] text-slate-600 border border-slate-200 dark:border-white/[0.07]'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {complaintLoading ? (
              <div className="flex flex-col items-center py-16">
                <Loader size={28} className="text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Yükleniyor...</p>
              </div>
            ) : complaints.filter(c => c.status === complaintFilter).length === 0 ? (
              <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-8 text-center shadow-sm">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Bu kategoride şikayet yok</p>
              </div>
            ) : complaints
              .filter(c => c.status === complaintFilter)
              .map(complaint => (
                <div key={complaint.id} className={`bg-white dark:bg-[#141414] rounded-2xl border shadow-sm overflow-hidden ${
                  complaint.status === 'open' ? 'border-amber-200 dark:border-amber-500/30' :
                  complaint.status === 'resolved' ? 'border-emerald-200 dark:border-emerald-500/30' :
                  'border-rose-200 dark:border-rose-500/30'
                }`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                          {complaint.customerName || complaint.filedBy?.name || 'Kullanıcı'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{complaint.jobTitle || complaint.reason}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                        complaint.status === 'open' ? 'bg-amber-100 text-amber-700' :
                        complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {complaint.status === 'open' ? 'Bekliyor' : complaint.status === 'resolved' ? 'Çözüldü' : 'Reddedildi'}
                      </span>
                    </div>
                    {complaint.details && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 mb-3">
                        {complaint.details}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {complaint.filedAt ? new Date(complaint.filedAt).toLocaleString('tr-TR') : ''}
                    </p>
                    {complaint.status === 'open' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                        <button
                          onClick={() => handleComplaintAction(complaint.id, 'resolve')}
                          disabled={complaintActioning === complaint.id}
                          className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition"
                        >
                          {complaintActioning === complaint.id ? <Loader size={13} className="animate-spin" /> : <Check size={13} />}
                          Çözüldü
                        </button>
                        <button
                          onClick={() => handleComplaintAction(complaint.id, 'reject')}
                          disabled={complaintActioning === complaint.id}
                          className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition"
                        >
                          <X size={13} />
                          Reddet
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Belgeler */}
        {activeTab === 'docs' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {[{ key: 'all', label: 'Tümü' }, { key: 'CUSTOMER', label: 'Müşteri' }, { key: 'USTA', label: 'Usta' }].map(f => (
                  <button key={f.key} onClick={() => setCertRoleFilter(f.key)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${certRoleFilter === f.key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#141414] text-slate-600 border border-slate-200 dark:border-white/[0.07]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {[{ key: 'PENDING', label: 'Bekleyen' }, { key: 'APPROVED', label: 'Onaylı' }, { key: 'REJECTED', label: 'Reddedildi' }].map(f => (
                  <button key={f.key} onClick={() => setCertFilter(f.key)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${certFilter === f.key ? 'bg-slate-700 text-white' : 'bg-white dark:bg-[#141414] text-slate-600 border border-slate-200 dark:border-white/[0.07]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {certLoading ? (
              <div className="flex flex-col items-center py-16">
                <Loader size={28} className="text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Yükleniyor...</p>
              </div>
            ) : certs
              .filter(c => {
                const roleMatch = certRoleFilter === 'all' || c.user?.role?.toUpperCase() === certRoleFilter
                const statusMatch = c.status === certFilter
                return roleMatch && statusMatch
              }).length === 0 ? (
              <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-8 text-center shadow-sm">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Belge bulunamadı</p>
              </div>
            ) : certs
              .filter(c => {
                const roleMatch = certRoleFilter === 'all' || c.user?.role?.toUpperCase() === certRoleFilter
                const statusMatch = c.status === certFilter
                return roleMatch && statusMatch
              })
              .map(c => (
                <div key={c.id} className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] overflow-hidden shadow-sm">
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-50 dark:bg-violet-500/10">
                      {c.user?.role?.toUpperCase() === 'USTA'
                        ? <ShieldCheck size={18} className="text-amber-600" />
                        : <User size={18} className="text-blue-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{c.user?.name || '—'}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.user?.role?.toUpperCase() === 'USTA' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.user?.role?.toUpperCase() === 'USTA' ? 'Usta' : 'Müşteri'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{c.user?.email}</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                        {c.label || c.docType || 'Belge'}
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
                    <a href={c.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
                      <ExternalLink size={12} /> Görüntüle
                    </a>
                    {c.status !== 'APPROVED' && (
                      <button onClick={() => handleCertAction(c.id, 'APPROVED')} disabled={certActioning === c.id}
                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition">
                        {certActioning === c.id ? <Loader size={12} className="animate-spin" /> : <Check size={12} />} Onayla
                      </button>
                    )}
                    {c.status !== 'REJECTED' && (
                      <button onClick={() => handleCertAction(c.id, 'REJECTED')} disabled={certActioning === c.id}
                        className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition">
                        <X size={12} /> Reddet
                      </button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Konuşmalar */}
        {activeTab === 'chats' && (
          <div className="space-y-2">
            {convLoading ? (
              <div className="flex flex-col items-center py-16">
                <Loader size={28} className="text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Konuşmalar yükleniyor...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-8 text-center shadow-sm">
                <MessageCircle size={32} className="text-blue-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Henüz konuşma yok</p>
                <p className="text-xs text-slate-400 mt-1">Kullanıcılar mesaj gönderdiğinde burada görünür</p>
              </div>
            ) : conversations.map(conv => (
              <button
                key={conv.user.id}
                onClick={() => navigate(`/support/chat/${conv.user.id}`)}
                className="w-full bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-4 flex items-center gap-3 shadow-sm text-left hover:border-blue-300 active:scale-[0.99] transition"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg text-white bg-gradient-to-br ${
                  conv.user.role?.toUpperCase() === 'USTA'
                    ? 'from-amber-400 to-orange-500'
                    : 'from-blue-400 to-indigo-500'
                }`}>
                  {conv.user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{conv.user.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      conv.user.role?.toUpperCase() === 'USTA'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>{roleLabel(conv.user.role)}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage || '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] text-slate-400">{fmt(conv.lastMessageAt)}</span>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread > 9 ? '9+' : conv.unread}
                    </span>
                  )}
                  {!conv.unread && <ChevronRight size={14} className="text-slate-300" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
