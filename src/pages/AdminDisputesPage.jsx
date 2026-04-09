import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import {
  Scale, AlertCircle, CheckCircle, XCircle, Clock, MessageSquare,
  DollarSign, RefreshCw, Search, ChevronDown, User, FileText,
  ArrowRight, Shield, Zap, BarChart2,
} from 'lucide-react'

const DISPUTE_STATUSES = [
  { key: 'all', label: 'Tumuu' },
  { key: 'open', label: 'Acik' },
  { key: 'resolved', label: 'Cozuldu' },
  { key: 'rejected', label: 'Reddedildi' },
]

export default function AdminDisputesPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState([])
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [refundAmount, setRefundAmount] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [compRes, jobsRes] = await Promise.allSettled([
        fetchAPI(API_ENDPOINTS.COMPLAINTS.LIST),
        fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=2000`),
      ])
      setComplaints(compRes.status === 'fulfilled' && Array.isArray(compRes.value?.data) ? compRes.value.data : [])
      const jRaw = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : []
      setJobs(mapJobsFromBackend(jRaw))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      if (filter !== 'all' && c.status !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        return (c.customerName || '').toLowerCase().includes(q) ||
               (c.jobTitle || '').toLowerCase().includes(q) ||
               (c.reason || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [complaints, filter, search])

  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    avgResolution: (() => {
      const resolved = complaints.filter(c => c.status === 'resolved' && c.resolvedAt && c.filedAt)
      if (resolved.length === 0) return '-'
      const totalHours = resolved.reduce((s, c) => {
        return s + (new Date(c.resolvedAt) - new Date(c.filedAt)) / 3600000
      }, 0)
      return `${(totalHours / resolved.length).toFixed(0)} saat`
    })(),
  }), [complaints])

  const selected = selectedId ? complaints.find(c => c.id === selectedId) : null
  const relatedJob = selected ? jobs.find(j => j.id === selected.jobId) : null

  const handleResolve = async () => {
    if (!selected) return
    setProcessing(true)
    try {
      await fetchAPI(API_ENDPOINTS.COMPLAINTS.RESOLVE(selected.id), {
        method: 'PATCH',
        body: { resolution: resolutionNote || 'Cozuldu' },
      })
      setComplaints(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString() } : c))
      setSelectedId(null)
      setResolutionNote('')
      setRefundAmount('')
    } catch (e) { alert(e.message) }
    finally { setProcessing(false) }
  }

  const handleReject = async () => {
    if (!selected) return
    setProcessing(true)
    try {
      await fetchAPI(API_ENDPOINTS.COMPLAINTS.REJECT(selected.id), {
        method: 'PATCH',
        body: { reason: resolutionNote || 'Reddedildi' },
      })
      setComplaints(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'rejected' } : c))
      setSelectedId(null)
      setResolutionNote('')
    } catch (e) { alert(e.message) }
    finally { setProcessing(false) }
  }

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Anlasamazlik & Arabuluculuk" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Anlasamazlik & Arabuluculuk" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-6">
          {[
            { label: 'Toplam', value: stats.total, icon: Scale, color: 'bg-blue-500/10 text-blue-400' },
            { label: 'Acik', value: stats.open, icon: AlertCircle, color: stats.open > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-400' },
            { label: 'Cozuldu', value: stats.resolved, icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-400' },
            { label: 'Ort. Cozum', value: stats.avgResolution, icon: Clock, color: 'bg-violet-500/10 text-violet-400' },
          ].map(kpi => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>
                  <Icon size={15} />
                </div>
                <p className="text-lg font-bold text-white">{kpi.value}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{kpi.label}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]" />
          </div>
          <button onClick={load} className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
            <RefreshCw size={14} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex gap-1.5 mb-5 overflow-x-auto">
          {DISPUTE_STATUSES.map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filter === s.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
              }`}>
              {s.label}
              {s.key === 'open' && stats.open > 0 && <span className="ml-1 text-[10px] opacity-70">({stats.open})</span>}
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="space-y-4">
            <button onClick={() => setSelectedId(null)} className="text-xs text-blue-400 flex items-center gap-1 hover:underline">
              &larr; Listeye Don
            </button>

            {/* Dispute header */}
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{selected.jobTitle || 'Sikayet'}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{selected.reason}</p>
                </div>
                <StatusBadge status={selected.status === 'open' ? 'pending' : selected.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 mb-1">Musteri</p>
                  <p className="text-xs font-semibold text-white">{selected.customerName || '-'}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 mb-1">Tarih</p>
                  <p className="text-xs font-semibold text-white">{selected.filedAt ? new Date(selected.filedAt).toLocaleString('tr-TR') : '-'}</p>
                </div>
              </div>

              {selected.details && (
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04] mb-4">
                  <p className="text-[10px] text-zinc-500 mb-1">Detay</p>
                  <p className="text-xs text-zinc-300">{selected.details}</p>
                </div>
              )}

              {/* Related job */}
              {relatedJob && (
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04] mb-4">
                  <p className="text-[10px] text-zinc-500 mb-1">Ilgili Is</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{relatedJob.title}</p>
                      <p className="text-[10px] text-zinc-500">{relatedJob.professional?.name || 'Usta atanmamis'} - {relatedJob.status}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">{relatedJob.price ?? relatedJob.budget} TL</p>
                  </div>
                </div>
              )}

              {/* Action area */}
              {selected.status === 'open' && (
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <textarea
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    placeholder="Karar notu ekleyin..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.12] resize-none h-20"
                  />
                  <input
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    placeholder="Iade tutari (TL, opsiyonel)"
                    type="number"
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleResolve} disabled={processing}
                      className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition flex items-center justify-center gap-1.5">
                      <CheckCircle size={13} /> Coz
                    </button>
                    <button onClick={handleReject} disabled={processing}
                      className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition flex items-center justify-center gap-1.5">
                      <XCircle size={13} /> Reddet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dispute list */
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <EmptyState icon={Scale} title="Anlasamazlik bulunamadi" description="Bu kategoride kayit yok." />
            ) : filtered.map(c => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] transition text-left">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  c.status === 'open' ? 'bg-amber-500/10' : c.status === 'resolved' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                }`}>
                  <Scale size={14} className={
                    c.status === 'open' ? 'text-amber-400' : c.status === 'resolved' ? 'text-emerald-400' : 'text-rose-400'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.jobTitle || c.reason || 'Sikayet'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-500">{c.customerName}</span>
                    <span className="text-[10px] text-zinc-600">{c.filedAt ? new Date(c.filedAt).toLocaleDateString('tr-TR') : ''}</span>
                  </div>
                </div>
                <StatusBadge status={c.status === 'open' ? 'pending' : c.status} size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
