import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  Webhook, CheckCircle, XCircle, Clock, Search, RefreshCw,
  CreditCard, MessageSquare, Bell, Mail, Phone, Globe,
  ChevronRight, Filter, ArrowUpDown,
} from 'lucide-react'

const LS_KEY = 'usta_webhook_logs'

const MOCK_LOGS = [
  { id: 1, service: 'iyzico', event: 'payment.success', status: 'success', data: 'orderId: 12345, amount: 850 TL', timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: 2, service: 'iyzico', event: 'payment.failed', status: 'error', data: 'orderId: 12346, error: insufficient_funds', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 3, service: 'sms', event: 'sms.sent', status: 'success', data: 'to: +905xx, template: verification_code', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 4, service: 'sms', event: 'sms.failed', status: 'error', data: 'to: +905xx, error: invalid_number', timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 5, service: 'push', event: 'notification.delivered', status: 'success', data: 'userId: abc123, title: Yeni is teklifi', timestamp: new Date(Date.now() - 1200000).toISOString() },
  { id: 6, service: 'push', event: 'notification.bounced', status: 'error', data: 'userId: def456, error: token_expired', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 7, service: 'email', event: 'email.sent', status: 'success', data: 'to: user@test.com, subject: Is onaylandi', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 8, service: 'iyzico', event: 'refund.completed', status: 'success', data: 'refundId: R789, amount: 200 TL', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 9, service: 'webhook', event: 'callback.received', status: 'success', data: 'from: iyzico, type: BKM_EXPRESS', timestamp: new Date(Date.now() - 10800000).toISOString() },
  { id: 10, service: 'sms', event: 'sms.sent', status: 'success', data: 'to: +905xx, template: job_assigned', timestamp: new Date(Date.now() - 14400000).toISOString() },
]

const SERVICES = { iyzico: { icon: CreditCard, color: 'bg-violet-500/10 text-violet-400' }, sms: { icon: Phone, color: 'bg-blue-500/10 text-blue-400' }, push: { icon: Bell, color: 'bg-amber-500/10 text-amber-400' }, email: { icon: Mail, color: 'bg-teal-500/10 text-teal-400' }, webhook: { icon: Globe, color: 'bg-zinc-500/10 text-zinc-400' } }

export default function AdminWebhookLogPage() {
  const navigate = useNavigate()
  const [logs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || MOCK_LOGS } catch { return MOCK_LOGS }
  })
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (serviceFilter !== 'all' && l.service !== serviceFilter) return false
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return l.event.toLowerCase().includes(q) || l.data.toLowerCase().includes(q) || l.service.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [logs, search, serviceFilter, statusFilter])

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    error: logs.filter(l => l.status === 'error').length,
    pending: logs.filter(l => l.status === 'pending').length,
  }

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime()
    if (diff < 60000) return 'Az once'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}dk once`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa once`
    return `${Math.floor(diff / 86400000)}g once`
  }

  return (
    <Layout hideNav>
      <PageHeader title="Webhook & Event Log" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
          <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-black text-white">{stats.total}</p>
            <p className="text-[10px] text-zinc-500">Toplam Event</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-3 text-center">
            <p className="text-lg font-black text-emerald-400">{stats.success}</p>
            <p className="text-[10px] text-emerald-400/70">Basarili</p>
          </div>
          <div className="bg-rose-500/10 rounded-xl border border-rose-500/20 p-3 text-center">
            <p className="text-lg font-black text-rose-400">{stats.error}</p>
            <p className="text-[10px] text-rose-400/70">Hata</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          {[{ k: 'all', l: 'Tumuu' }, { k: 'iyzico', l: 'iyzico' }, { k: 'sms', l: 'SMS' }, { k: 'push', l: 'Push' }, { k: 'email', l: 'Email' }, { k: 'webhook', l: 'Webhook' }].map(f => (
            <button key={f.k} onClick={() => setServiceFilter(f.k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${serviceFilter === f.k ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
              {f.l}
            </button>
          ))}
          <button onClick={() => setStatusFilter(statusFilter === 'all' ? 'error' : statusFilter === 'error' ? 'success' : 'all')}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold transition ${statusFilter !== 'all' ? 'bg-rose-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
            {statusFilter === 'all' ? 'Durum: Tumuu' : statusFilter === 'error' ? 'Sadece Hatalar' : 'Sadece Basarili'}
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Event, servis veya data ara..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Webhook} title="Event yok" description="Filtreye uygun kayit bulunamadi" />
        ) : (
          <div className="space-y-1.5">
            {filtered.map(log => {
              const svc = SERVICES[log.service] || SERVICES.webhook
              const SvcIcon = svc.icon
              return (
                <div key={log.id} className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${svc.color}`}>
                    <SvcIcon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-white">{log.event}</p>
                      {log.status === 'success' ? <CheckCircle size={11} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={11} className="text-rose-400 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">{log.data}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-zinc-600">{timeAgo(log.timestamp)}</p>
                    <p className="text-[9px] text-zinc-700 font-mono">{log.service}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
