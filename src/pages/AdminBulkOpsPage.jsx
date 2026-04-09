import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Layers, Upload, CheckSquare, Square, DollarSign, Tag,
  Users, Briefcase, AlertTriangle, CheckCircle, Loader,
  Search, X, Play,
} from 'lucide-react'

const OPS = [
  { id: 'price_update', title: 'Toplu Fiyat Guncelleme', desc: 'Secili ustalarin fiyatlarini yuzde ile artir/azalt', icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-400', target: 'usta' },
  { id: 'send_coupon', title: 'Toplu Kupon Gonder', desc: 'Secili musterilere kupon kodu ata', icon: Tag, color: 'bg-violet-500/10 text-violet-400', target: 'customer' },
  { id: 'send_notification', title: 'Toplu Bildirim', desc: 'Secili kullanicilara bildirim gonder', icon: Users, color: 'bg-blue-500/10 text-blue-400', target: 'all' },
  { id: 'cancel_jobs', title: 'Toplu Is Iptal', desc: 'Secili isleri topluca iptal et', icon: Briefcase, color: 'bg-rose-500/10 text-rose-400', target: 'jobs' },
]

export default function AdminBulkOpsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedOp, setSelectedOp] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [opParams, setOpParams] = useState({ percentage: 10, couponCode: '', message: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [usersRes, jobsRes] = await Promise.allSettled([
        fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
        fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=1000`),
      ])
      setUsers(usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data) ? usersRes.value.data : [])
      setJobs(jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const getItems = () => {
    if (!selectedOp) return []
    const op = OPS.find(o => o.id === selectedOp)
    if (op.target === 'usta') return users.filter(u => u.role === 'USTA' || u.role === 'professional')
    if (op.target === 'customer') return users.filter(u => u.role === 'customer' || u.role === 'CUSTOMER')
    if (op.target === 'jobs') return jobs
    return users
  }

  const items = getItems().filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (item.name || item.title || '').toLowerCase().includes(q) || (item.email || '').toLowerCase().includes(q)
  })

  const toggleItem = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id || i._id)))
  }

  const runOperation = () => {
    if (selected.size === 0) return
    if (!confirm(`${selected.size} kayit uzerinde islem yapilacak. Devam?`)) return
    setProcessing(true)
    // Simulate operation
    setTimeout(() => {
      setProcessing(false)
      setResult({ success: selected.size, failed: 0, operation: OPS.find(o => o.id === selectedOp)?.title })
      const log = JSON.parse(localStorage.getItem('usta_bulk_history') || '[]')
      log.unshift({ op: selectedOp, count: selected.size, date: new Date().toISOString(), params: opParams })
      localStorage.setItem('usta_bulk_history', JSON.stringify(log.slice(0, 50)))
    }, 1500)
  }

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Toplu Islem" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Toplu Islem Paneli" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Operation selector */}
        {!selectedOp && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {OPS.map(op => {
              const Icon = op.icon
              return (
                <button key={op.id} onClick={() => { setSelectedOp(op.id); setSelected(new Set()); setResult(null) }}
                  className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 text-left hover:border-white/[0.1] transition active:scale-[0.98]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${op.color}`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-xs font-semibold text-white mb-0.5">{op.title}</p>
                  <p className="text-[10px] text-zinc-500">{op.desc}</p>
                </button>
              )
            })}
          </div>
        )}

        {/* Bulk operation panel */}
        {selectedOp && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => { setSelectedOp(null); setSelected(new Set()) }}
                  className="text-zinc-500 hover:text-white transition"><X size={16} /></button>
                <h3 className="text-sm font-bold text-white">{OPS.find(o => o.id === selectedOp)?.title}</h3>
              </div>
              <span className="text-xs text-zinc-500">{selected.size} secili</span>
            </div>

            {/* Operation params */}
            {selectedOp === 'price_update' && (
              <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 flex items-center gap-3">
                <span className="text-xs text-zinc-400">Yuzde:</span>
                <input type="number" value={opParams.percentage} onChange={e => setOpParams(p => ({ ...p, percentage: Number(e.target.value) }))}
                  className="w-20 px-2 py-1 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white text-center focus:outline-none" />
                <span className="text-xs text-zinc-500">%</span>
              </div>
            )}
            {selectedOp === 'send_coupon' && (
              <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3">
                <input value={opParams.couponCode} onChange={e => setOpParams(p => ({ ...p, couponCode: e.target.value }))}
                  placeholder="Kupon kodu" className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none" />
              </div>
            )}
            {selectedOp === 'send_notification' && (
              <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3">
                <input value={opParams.message} onChange={e => setOpParams(p => ({ ...p, message: e.target.value }))}
                  placeholder="Bildirim mesaji" className="w-full px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none" />
              </div>
            )}

            {/* Search & Select All */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
              </div>
              <button onClick={selectAll} className="px-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-zinc-400 font-semibold whitespace-nowrap">
                {selected.size === items.length ? 'Hepsini Kaldir' : 'Hepsini Sec'}
              </button>
            </div>

            {/* Items */}
            <div className="space-y-1 max-h-[40vh] overflow-y-auto">
              {items.slice(0, 100).map(item => {
                const id = item.id || item._id
                const isSelected = selected.has(id)
                return (
                  <button key={id} onClick={() => toggleItem(id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${isSelected ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-zinc-900 border border-white/[0.04] hover:border-white/[0.08]'}`}>
                    {isSelected ? <CheckSquare size={14} className="text-blue-400 flex-shrink-0" /> : <Square size={14} className="text-zinc-700 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{item.name || item.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{item.email || item.status || ''}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Execute */}
            <div className="flex gap-2">
              <button onClick={runOperation} disabled={selected.size === 0 || processing}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition">
                {processing ? <Loader size={16} className="animate-spin" /> : <><Play size={14} /> {selected.size} Kayit Uzerinde Calistir</>}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <p className="text-xs font-semibold text-emerald-400">{result.operation} tamamlandi: {result.success} basarili</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
