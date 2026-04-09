import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Shield, Clock, User, Briefcase, DollarSign, AlertCircle,
  CheckCircle, XCircle, UserPlus, UserMinus, CreditCard,
  FileText, RefreshCw, Filter, Search, ArrowDownRight,
} from 'lucide-react'

const EVENT_CONFIG = {
  USER_REGISTERED:  { label: 'Kullanici Kayit', icon: UserPlus, color: 'bg-blue-500/10 text-blue-400' },
  USER_DELETED:     { label: 'Kullanici Silindi', icon: UserMinus, color: 'bg-rose-500/10 text-rose-400' },
  JOB_CREATED:      { label: 'Is Olusturuldu', icon: Briefcase, color: 'bg-violet-500/10 text-violet-400' },
  JOB_COMPLETED:    { label: 'Is Tamamlandi', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-400' },
  JOB_CANCELLED:    { label: 'Is Iptal Edildi', icon: XCircle, color: 'bg-rose-500/10 text-rose-400' },
  JOB_RATED:        { label: 'Degerlendirme', icon: FileText, color: 'bg-amber-500/10 text-amber-400' },
  TOPUP:            { label: 'Bakiye Yukleme', icon: CreditCard, color: 'bg-emerald-500/10 text-emerald-400' },
  WITHDRAWAL:       { label: 'Para Cekme', icon: ArrowDownRight, color: 'bg-rose-500/10 text-rose-400' },
  EARNING:          { label: 'Kazanc', icon: DollarSign, color: 'bg-teal-500/10 text-teal-400' },
  COMPLAINT_FILED:  { label: 'Sikayet', icon: AlertCircle, color: 'bg-amber-500/10 text-amber-400' },
}

export default function AdminAuditLogPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [jobsRes, txRes, usersRes, complaintsRes] = await Promise.allSettled([
        fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=2000`),
        fetchAPI(`${API_ENDPOINTS.WALLET.ADMIN_TRANSACTIONS}?limit=5000`),
        fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
        fetchAPI(API_ENDPOINTS.COMPLAINTS.LIST),
      ])

      const allEvents = []

      // Jobs events
      const jRaw = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : []
      const allJobs = mapJobsFromBackend(jRaw)
      allJobs.forEach(j => {
        allEvents.push({
          type: 'JOB_CREATED',
          date: j.createdAt || j.date,
          actor: j.customer?.name || 'Musteri',
          detail: j.title || 'Is',
          meta: `${j.budget || j.price || 0} TL`,
        })
        if (j.status === 'completed' || j.status === 'rated') {
          allEvents.push({
            type: j.status === 'rated' ? 'JOB_RATED' : 'JOB_COMPLETED',
            date: j.updatedAt || j.createdAt,
            actor: j.professional?.name || 'Usta',
            detail: j.title || 'Is',
            meta: j.rating ? `${j.rating}/5` : '',
          })
        }
        if (j.status === 'cancelled') {
          allEvents.push({
            type: 'JOB_CANCELLED',
            date: j.updatedAt || j.createdAt,
            actor: j.customer?.name || 'Kullanici',
            detail: j.title || 'Is',
          })
        }
      })

      // Transactions events
      const allTx = txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data) ? txRes.value.data : []
      allTx.forEach(t => {
        if (['TOPUP', 'WITHDRAWAL', 'EARNING'].includes(t.type)) {
          allEvents.push({
            type: t.type,
            date: t.createdAt,
            actor: t.userName || t.userId || 'Kullanici',
            detail: t.description || t.type,
            meta: `${Math.abs(Number(t.amount) || 0).toLocaleString('tr-TR')} TL`,
          })
        }
      })

      // User events
      const allUsers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data) ? usersRes.value.data : []
      allUsers.forEach(u => {
        allEvents.push({
          type: 'USER_REGISTERED',
          date: u.createdAt,
          actor: u.name || 'Kullanici',
          detail: `${u.role || 'user'} - ${u.email || ''}`,
        })
      })

      // Complaints
      const allComplaints = complaintsRes.status === 'fulfilled' && Array.isArray(complaintsRes.value?.data) ? complaintsRes.value.data : []
      allComplaints.forEach(c => {
        allEvents.push({
          type: 'COMPLAINT_FILED',
          date: c.filedAt || c.createdAt,
          actor: c.customerName || 'Musteri',
          detail: c.reason || 'Sikayet',
          meta: c.status,
        })
      })

      // Sort by date desc
      allEvents.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      setEvents(allEvents)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const eventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.type))
    return ['all', ...Array.from(types).sort()]
  }, [events])

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (e.actor || '').toLowerCase().includes(q) || (e.detail || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [events, typeFilter, searchQuery])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Denetim Logu" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Denetim Logu" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Stats */}
        <div className="flex items-center gap-3 mt-4 mb-5">
          <div className="bg-zinc-900 border border-white/[0.06] rounded-xl px-4 py-2">
            <span className="text-lg font-bold text-white">{events.length.toLocaleString('tr-TR')}</span>
            <span className="text-[11px] text-zinc-500 ml-2">toplam olay</span>
          </div>
          <div className="bg-zinc-900 border border-white/[0.06] rounded-xl px-4 py-2">
            <span className="text-lg font-bold text-white">{filtered.length.toLocaleString('tr-TR')}</span>
            <span className="text-[11px] text-zinc-500 ml-2">filtrelenmis</span>
          </div>
          <button onClick={load} className="ml-auto w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
            <RefreshCw size={14} className="text-zinc-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(0) }}
              placeholder="Ara (isim, detay...)"
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
            className="px-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-zinc-400 focus:outline-none"
          >
            <option value="all">Tum Olaylar</option>
            {eventTypes.filter(t => t !== 'all').map(t => (
              <option key={t} value={t}>{EVENT_CONFIG[t]?.label || t}</option>
            ))}
          </select>
        </div>

        {/* Events list */}
        <div className="space-y-1">
          {paginated.length === 0 ? (
            <div className="text-center py-12 text-sm text-zinc-600">Olay bulunamadi</div>
          ) : paginated.map((e, i) => {
            const cfg = EVENT_CONFIG[e.type] || { label: e.type, icon: Shield, color: 'bg-zinc-800 text-zinc-400' }
            const Icon = cfg.icon
            return (
              <div key={`${e.type}-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] transition">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{cfg.label}</span>
                    <span className="text-[10px] text-zinc-600">{e.actor}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{e.detail}</p>
                </div>
                {e.meta && (
                  <span className="text-xs font-semibold text-zinc-300 flex-shrink-0">{e.meta}</span>
                )}
                <span className="text-[10px] text-zinc-600 flex-shrink-0 whitespace-nowrap">
                  {e.date ? new Date(e.date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '\u2014'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-white/[0.06] text-zinc-400 disabled:opacity-30"
            >
              Onceki
            </button>
            <span className="text-xs text-zinc-500">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-white/[0.06] text-zinc-400 disabled:opacity-30"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
