import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  DollarSign, Percent, TrendingUp, Zap, Save, Plus, Trash2,
  Clock, Calendar, AlertCircle, CheckCircle, BarChart2,
} from 'lucide-react'

const DEFAULT_RULES = [
  { id: '1', category: 'Elektrik', rate: 12, minPrice: 0, maxPrice: 0, active: true },
  { id: '2', category: 'Tesisat', rate: 12, minPrice: 0, maxPrice: 0, active: true },
  { id: '3', category: 'Boyaci', rate: 12, minPrice: 0, maxPrice: 0, active: true },
  { id: '4', category: 'Temizlik', rate: 15, minPrice: 0, maxPrice: 0, active: true },
  { id: '5', category: 'Klima', rate: 10, minPrice: 0, maxPrice: 0, active: true },
]

const SURGE_RULES_DEFAULT = [
  { id: 's1', name: 'Hafta Sonu', condition: 'weekend', multiplier: 20, active: true },
  { id: 's2', name: 'Acil Is (2 saat)', condition: 'urgent', multiplier: 30, active: false },
  { id: 's3', name: 'Gece (22-08)', condition: 'night', multiplier: 25, active: false },
]

export default function AdminCommissionPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [tab, setTab] = useState('rates')
  const [rules, setRules] = useState(() => {
    try { const s = localStorage.getItem('usta_commission_rules'); return s ? JSON.parse(s) : DEFAULT_RULES }
    catch { return DEFAULT_RULES }
  })
  const [surgeRules, setSurgeRules] = useState(() => {
    try { const s = localStorage.getItem('usta_surge_rules'); return s ? JSON.parse(s) : SURGE_RULES_DEFAULT }
    catch { return SURGE_RULES_DEFAULT }
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=2000`)
      const jRaw = Array.isArray(res?.data) ? res.data : []
      setJobs(mapJobsFromBackend(jRaw))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const analytics = useMemo(() => {
    const completed = jobs.filter(j => j.status === 'completed' || j.status === 'rated')
    const totalRevenue = completed.reduce((s, j) => s + (Number(j.budget) || Number(j.price) || 0), 0)

    const byCat = {}
    completed.forEach(j => {
      const cat = j.category || j.serviceCategory || 'Diger'
      if (!byCat[cat]) byCat[cat] = { count: 0, revenue: 0 }
      byCat[cat].count++
      byCat[cat].revenue += Number(j.budget) || Number(j.price) || 0
    })

    const catData = Object.entries(byCat).map(([cat, d]) => {
      const rule = rules.find(r => r.category.toLowerCase() === cat.toLowerCase())
      const rate = rule ? rule.rate : 12
      return { category: cat, ...d, rate, commission: d.revenue * (rate / 100) }
    }).sort((a, b) => b.commission - a.commission)

    const totalCommission = catData.reduce((s, c) => s + c.commission, 0)

    return { totalRevenue, totalCommission, catData, completedCount: completed.length }
  }, [jobs, rules])

  const handleSave = () => {
    localStorage.setItem('usta_commission_rules', JSON.stringify(rules))
    localStorage.setItem('usta_surge_rules', JSON.stringify(surgeRules))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateRule = (id, field, value) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const addRule = () => {
    setRules(prev => [...prev, { id: `r${Date.now()}`, category: '', rate: 12, minPrice: 0, maxPrice: 0, active: true }])
  }

  const deleteRule = (id) => { setRules(prev => prev.filter(r => r.id !== id)) }

  const fmtTL = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Komisyon Yonetimi" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Komisyon & Dinamik Fiyatlandirma" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-6">
          {[
            { label: 'Toplam Ciro', value: fmtTL(analytics.totalRevenue), icon: TrendingUp, color: 'bg-blue-500/10 text-blue-400' },
            { label: 'Toplam Komisyon', value: fmtTL(analytics.totalCommission), icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-400' },
            { label: 'Ort. Oran', value: `%${analytics.catData.length > 0 ? (analytics.catData.reduce((s, c) => s + c.rate, 0) / analytics.catData.length).toFixed(1) : '12'}`, icon: Percent, color: 'bg-amber-500/10 text-amber-400' },
            { label: 'Tamamlanan Is', value: analytics.completedCount, icon: CheckCircle, color: 'bg-violet-500/10 text-violet-400' },
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

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'rates', label: 'Komisyon Oranlari' },
            { key: 'surge', label: 'Dinamik Fiyatlandirma' },
            { key: 'analytics', label: 'Komisyon Analizi' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                tab === t.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'rates' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Kategori bazli komisyon oranlarini duzenleyin</p>
              <div className="flex gap-2">
                <button onClick={addRule} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white active:scale-[0.98] transition">
                  <Plus size={12} /> Ekle
                </button>
                <button onClick={handleSave} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${saved ? 'bg-emerald-500 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
                  {saved ? <><CheckCircle size={12} /> Kaydedildi</> : <><Save size={12} /> Kaydet</>}
                </button>
              </div>
            </div>

            {rules.map(rule => (
              <div key={rule.id} className={`bg-zinc-900 rounded-2xl border p-4 transition ${rule.active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-50'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateRule(rule.id, 'active', !rule.active)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.active ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
                    {rule.active ? <CheckCircle size={14} className="text-emerald-400" /> : <Clock size={14} className="text-zinc-600" />}
                  </button>
                  <input value={rule.category} onChange={e => updateRule(rule.id, 'category', e.target.value)}
                    placeholder="Kategori adi" className="flex-1 px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-500">%</span>
                    <input type="number" value={rule.rate} onChange={e => updateRule(rule.id, 'rate', Number(e.target.value))}
                      className="w-16 px-2 py-2 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white text-center focus:outline-none" />
                  </div>
                  <button onClick={() => deleteRule(rule.id)} className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={13} className="text-rose-400" />
                  </button>
                </div>
                <div className="flex gap-3 mt-2 ml-11">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-600">Min:</span>
                    <input type="number" value={rule.minPrice} onChange={e => updateRule(rule.id, 'minPrice', Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-zinc-800 border border-white/[0.06] rounded-lg text-[10px] text-zinc-400 focus:outline-none" placeholder="0" />
                    <span className="text-[10px] text-zinc-600">TL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-600">Max:</span>
                    <input type="number" value={rule.maxPrice} onChange={e => updateRule(rule.id, 'maxPrice', Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-zinc-800 border border-white/[0.06] rounded-lg text-[10px] text-zinc-400 focus:outline-none" placeholder="0" />
                    <span className="text-[10px] text-zinc-600">TL</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'surge' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 mb-2">Dinamik fiyatlandirma kurallari (fiyat carpani)</p>
            {surgeRules.map(sr => (
              <div key={sr.id} className={`bg-zinc-900 rounded-2xl border p-4 transition ${sr.active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-50'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSurgeRules(prev => prev.map(s => s.id === sr.id ? { ...s, active: !s.active } : s))}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sr.active ? 'bg-amber-500/10' : 'bg-zinc-800'}`}>
                    <Zap size={14} className={sr.active ? 'text-amber-400' : 'text-zinc-600'} />
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">{sr.name}</p>
                    <p className="text-[10px] text-zinc-500">{sr.condition}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-500">+%</span>
                    <input type="number" value={sr.multiplier}
                      onChange={e => setSurgeRules(prev => prev.map(s => s.id === sr.id ? { ...s, multiplier: Number(e.target.value) } : s))}
                      className="w-16 px-2 py-2 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white text-center focus:outline-none" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleSave} className={`w-full py-2.5 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
              {saved ? 'Kaydedildi!' : 'Kaydet'}
            </button>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Kategori Bazli Komisyon Geliri</h3>
              </div>
              {analytics.catData.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-6">Veri yok</p>
              ) : (
                <div className="space-y-3">
                  {analytics.catData.map(c => {
                    const maxComm = analytics.catData[0]?.commission || 1
                    return (
                      <div key={c.category}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-300">{c.category}</span>
                            <span className="text-[10px] text-zinc-600">%{c.rate}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-500">{c.count} is</span>
                            <span className="text-xs font-bold text-emerald-400">{fmtTL(c.commission)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(c.commission / maxComm) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
