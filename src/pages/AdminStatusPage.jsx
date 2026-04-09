import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  Activity, CheckCircle, AlertTriangle, XCircle, Clock,
  Server, CreditCard, MessageSquare, Bell, Globe, Wifi,
  Plus, X, Trash2, Edit3, Calendar,
} from 'lucide-react'

const LS_MAINT = 'usta_maintenances'
const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const save = (k, d) => localStorage.setItem(k, JSON.stringify(d))

const SERVICES = [
  { id: 'api', name: 'Ana API', icon: Server, status: 'operational' },
  { id: 'payment', name: 'Odeme Sistemi (iyzico)', icon: CreditCard, status: 'operational' },
  { id: 'sms', name: 'SMS Servisi', icon: MessageSquare, status: 'operational' },
  { id: 'push', name: 'Push Bildirim', icon: Bell, status: 'operational' },
  { id: 'socket', name: 'Canli Destek (Socket)', icon: Wifi, status: 'operational' },
  { id: 'storage', name: 'Dosya Depolama', icon: Globe, status: 'operational' },
]

const STATUS_MAP = {
  operational: { label: 'Calisiyor', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: CheckCircle },
  degraded: { label: 'Yavas', color: 'text-amber-400', bg: 'bg-amber-500', icon: AlertTriangle },
  partial: { label: 'Kismi Kesinti', color: 'text-orange-400', bg: 'bg-orange-500', icon: AlertTriangle },
  major: { label: 'Buyuk Kesinti', color: 'text-rose-400', bg: 'bg-rose-500', icon: XCircle },
}

export default function AdminStatusPage() {
  const navigate = useNavigate()
  const [services, setServices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_service_status') || 'null') || SERVICES } catch { return SERVICES }
  })
  const [maintenances, setMaintenances] = useState(() => load(LS_MAINT))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', affectedServices: [] })

  const saveServices = (next) => { setServices(next); localStorage.setItem('usta_service_status', JSON.stringify(next)) }
  const saveMaint = (next) => { setMaintenances(next); save(LS_MAINT, next) }

  const updateServiceStatus = (id, status) => saveServices(services.map(s => s.id === id ? { ...s, status } : s))

  const addMaintenance = () => {
    if (!form.title || !form.startDate) return
    saveMaint([{ ...form, id: Date.now(), createdAt: new Date().toISOString() }, ...maintenances])
    setShowForm(false); setForm({ title: '', description: '', startDate: '', endDate: '', affectedServices: [] })
  }

  const deleteMaint = (id) => saveMaint(maintenances.filter(m => m.id !== id))

  const allOperational = services.every(s => s.status === 'operational')
  const issueCount = services.filter(s => s.status !== 'operational').length
  const upcoming = maintenances.filter(m => new Date(m.startDate) > new Date())
  const past = maintenances.filter(m => new Date(m.startDate) <= new Date())

  return (
    <Layout hideNav>
      <PageHeader title="Sistem Durumu & Bakim" onBack={() => navigate('/admin')} />
      <div className="max-w-5xl mx-auto px-4 pb-10">

        {/* Overall status */}
        <div className={`mt-4 mb-6 rounded-2xl p-5 border ${allOperational ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
          <div className="flex items-center gap-3">
            {allOperational ? <CheckCircle size={24} className="text-emerald-400" /> : <AlertTriangle size={24} className="text-rose-400" />}
            <div>
              <p className={`text-sm font-bold ${allOperational ? 'text-emerald-400' : 'text-rose-400'}`}>
                {allOperational ? 'Tum Sistemler Calisiyor' : `${issueCount} Serviste Sorun Var`}
              </p>
              <p className="text-[11px] text-zinc-500">Son guncelleme: {new Date().toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Servis Durumu</h3>
        <div className="space-y-2 mb-8">
          {services.map(s => {
            const Icon = s.icon
            const st = STATUS_MAP[s.status]
            const StIcon = st.icon
            return (
              <div key={s.id} className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{s.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${st.bg}`} />
                    <span className={`text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                  <select value={s.status} onChange={e => updateServiceStatus(s.id, e.target.value)}
                    className="px-2 py-1 bg-zinc-800 border border-white/[0.06] rounded-lg text-[10px] text-zinc-400 focus:outline-none">
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        {/* Maintenance schedule */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bakim Plani</h3>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-semibold">
            <Plus size={11} /> Planla
          </button>
        </div>

        {maintenances.length === 0 ? (
          <EmptyState icon={Calendar} title="Planlanmis bakim yok" description="Yeni bir bakim zamanlayabilirsiniz" />
        ) : (
          <div className="space-y-2">
            {upcoming.length > 0 && <p className="text-[10px] text-amber-400 font-semibold mt-2 mb-1">YAKLASAN</p>}
            {upcoming.map(m => (
              <div key={m.id} className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{m.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{m.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-amber-400 font-semibold">{new Date(m.startDate).toLocaleString('tr-TR')}</span>
                      {m.endDate && <span className="text-[10px] text-zinc-600">→ {new Date(m.endDate).toLocaleString('tr-TR')}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteMaint(m.id)} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-500 hover:text-rose-400 transition"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            {past.length > 0 && <p className="text-[10px] text-zinc-600 font-semibold mt-4 mb-1">GECMIS</p>}
            {past.map(m => (
              <div key={m.id} className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 opacity-60">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{m.title}</p>
                    <p className="text-[10px] text-zinc-500">{new Date(m.startDate).toLocaleString('tr-TR')}</p>
                  </div>
                  <button onClick={() => deleteMaint(m.id)} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-500"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/[0.1] rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-white">Bakim Planla</h3>
                <button onClick={() => setShowForm(false)} className="text-zinc-500"><X size={16} /></button>
              </div>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Bakim basligi"
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Aciklama" rows={2}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Baslangic</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-zinc-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Bitis (opsiyonel)</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-xl text-xs text-zinc-400 focus:outline-none" />
                </div>
              </div>
              <button onClick={addMaintenance} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition">Kaydet</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
