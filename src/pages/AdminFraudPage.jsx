import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  ShieldAlert, AlertTriangle, Eye, Ban, Search, RefreshCw,
  Users, Briefcase, DollarSign, Activity, Flag, UserX,
  Fingerprint, Globe, Phone, Mail, CreditCard, Clock,
} from 'lucide-react'

function riskScore(u, jobs, allJobs) {
  let score = 0
  const uJobs = jobs.filter(j => (j.customerId || j.customer?.id) === u.id || (j.professionalId || j.professional?.id) === u.id)
  const cancelled = uJobs.filter(j => j.status === 'cancelled').length
  if (cancelled > 3) score += 25
  if (cancelled > 5) score += 15
  const selfJobs = uJobs.filter(j => (j.customerId || j.customer?.id) === u.id && (j.professionalId || j.professional?.id) === u.id)
  if (selfJobs.length > 0) score += 40
  if (!u.email) score += 10
  if (!u.phone) score += 10
  const recentJobs = uJobs.filter(j => new Date(j.createdAt) > new Date(Date.now() - 3600000))
  if (recentJobs.length > 5) score += 20
  const sameAmountJobs = {}
  uJobs.forEach(j => { const amt = Number(j.budget) || Number(j.price) || 0; sameAmountJobs[amt] = (sameAmountJobs[amt] || 0) + 1 })
  if (Object.values(sameAmountJobs).some(c => c > 3)) score += 15
  return Math.min(score, 100)
}

function riskLevel(score) {
  if (score >= 60) return { label: 'Yuksek', color: 'bg-rose-500/10 text-rose-400', border: 'border-rose-500/20' }
  if (score >= 30) return { label: 'Orta', color: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/20' }
  return { label: 'Dusuk', color: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/20' }
}

export default function AdminFraudPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [blacklist, setBlacklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usta_blacklist') || '[]') } catch { return [] }
  })
  const [newBlacklistItem, setNewBlacklistItem] = useState({ type: 'phone', value: '', reason: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [usersRes, jobsRes] = await Promise.allSettled([
        fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
        fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=2000`),
      ])
      setUsers(usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data) ? usersRes.value.data : [])
      const jRaw = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : []
      setJobs(mapJobsFromBackend(jRaw))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const riskData = useMemo(() => {
    return users.map(u => ({ ...u, risk: riskScore(u, jobs, jobs) }))
      .sort((a, b) => b.risk - a.risk)
  }, [users, jobs])

  const stats = useMemo(() => ({
    highRisk: riskData.filter(u => u.risk >= 60).length,
    mediumRisk: riskData.filter(u => u.risk >= 30 && u.risk < 60).length,
    lowRisk: riskData.filter(u => u.risk < 30).length,
    blacklisted: blacklist.length,
  }), [riskData, blacklist])

  const filtered = riskData.filter(u => {
    if (!search) return u.risk > 0
    const q = search.toLowerCase()
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q)
  })

  const addToBlacklist = () => {
    if (!newBlacklistItem.value) return
    const item = { ...newBlacklistItem, id: Date.now(), date: new Date().toISOString() }
    const updated = [...blacklist, item]
    setBlacklist(updated)
    localStorage.setItem('usta_blacklist', JSON.stringify(updated))
    setNewBlacklistItem({ type: 'phone', value: '', reason: '' })
  }

  const removeFromBlacklist = (id) => {
    const updated = blacklist.filter(b => b.id !== id)
    setBlacklist(updated)
    localStorage.setItem('usta_blacklist', JSON.stringify(updated))
  }

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Fraud & Risk" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Fraud Detection & Risk Yonetimi" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-6">
          {[
            { label: 'Yuksek Risk', value: stats.highRisk, icon: ShieldAlert, color: 'bg-rose-500/10 text-rose-400' },
            { label: 'Orta Risk', value: stats.mediumRisk, icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-400' },
            { label: 'Dusuk Risk', value: stats.lowRisk, icon: Eye, color: 'bg-emerald-500/10 text-emerald-400' },
            { label: 'Kara Liste', value: stats.blacklisted, icon: Ban, color: 'bg-zinc-400/10 text-zinc-300' },
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

        <div className="flex gap-2 mb-5">
          {[
            { key: 'dashboard', label: 'Risk Skoru' },
            { key: 'blacklist', label: 'Kara Liste' },
            { key: 'patterns', label: 'Supheli Kaliplar' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-3">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kullanici ara..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
            </div>
            {filtered.slice(0, 30).map(u => {
              const rl = riskLevel(u.risk)
              return (
                <button key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border ${rl.border} hover:border-white/[0.1] transition text-left`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rl.color}`}>
                    <span className="text-sm font-black">{u.risk}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-zinc-500">{u.email} - {u.role}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rl.color}`}>{rl.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {tab === 'blacklist' && (
          <div className="space-y-3">
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 space-y-3">
              <p className="text-xs font-semibold text-white">Kara Listeye Ekle</p>
              <div className="flex gap-2">
                <select value={newBlacklistItem.type} onChange={e => setNewBlacklistItem(p => ({ ...p, type: e.target.value }))}
                  className="px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-zinc-400 focus:outline-none">
                  <option value="phone">Telefon</option>
                  <option value="email">E-posta</option>
                  <option value="iban">IBAN</option>
                  <option value="ip">IP</option>
                  <option value="device">Cihaz ID</option>
                </select>
                <input value={newBlacklistItem.value} onChange={e => setNewBlacklistItem(p => ({ ...p, value: e.target.value }))}
                  placeholder="Deger" className="flex-1 px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none" />
                <input value={newBlacklistItem.reason} onChange={e => setNewBlacklistItem(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Sebep" className="flex-1 px-3 py-2 bg-zinc-800 border border-white/[0.06] rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none" />
                <button onClick={addToBlacklist} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-semibold active:scale-[0.98]">Ekle</button>
              </div>
            </div>
            {blacklist.length === 0 ? (
              <EmptyState icon={Ban} title="Kara liste bos" description="Henuz engellenmis kayit yok" />
            ) : blacklist.map(b => (
              <div key={b.id} className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                  <Ban size={14} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">{b.type}</span>
                    <span className="text-xs font-semibold text-white">{b.value}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">{b.reason} - {new Date(b.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <button onClick={() => removeFromBlacklist(b.id)} className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <UserX size={12} className="text-zinc-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'patterns' && (
          <div className="space-y-3">
            {[
              { title: 'Kendi Kendine Is', desc: 'Ayni kullanici hem musteri hem usta olarak eslesme', icon: Fingerprint, count: riskData.filter(u => u.risk >= 40).length, severity: 'high' },
              { title: 'Coklu Iptal', desc: '3+ ardisik iptal yapan kullanicilar', icon: Flag, count: riskData.filter(u => u.risk >= 25).length, severity: 'medium' },
              { title: 'Ayni Tutar Tekrari', desc: 'Surekli ayni tutarda is/havale yapanlar', icon: DollarSign, count: 0, severity: 'low' },
              { title: 'Hizli Kayit-Is', desc: 'Kayit sonrasi 1 saat icinde 5+ is olusturanlar', icon: Clock, count: 0, severity: 'low' },
              { title: 'Bilgi Eksikligi', desc: 'E-posta veya telefon bilgisi olmayan hesaplar', icon: UserX, count: users.filter(u => !u.email || !u.phone).length, severity: 'medium' },
            ].map(p => (
              <div key={p.title} className={`bg-zinc-900 rounded-2xl border p-4 ${
                p.severity === 'high' ? 'border-rose-500/20' : p.severity === 'medium' ? 'border-amber-500/20' : 'border-white/[0.06]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    p.severity === 'high' ? 'bg-rose-500/10' : p.severity === 'medium' ? 'bg-amber-500/10' : 'bg-zinc-800'
                  }`}>
                    <p.icon size={16} className={
                      p.severity === 'high' ? 'text-rose-400' : p.severity === 'medium' ? 'text-amber-400' : 'text-zinc-400'
                    } />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">{p.title}</p>
                    <p className="text-[10px] text-zinc-500">{p.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{p.count}</p>
                    <p className="text-[9px] text-zinc-600">tespit</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
