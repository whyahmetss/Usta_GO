import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Users, Star, Crown, Clock, DollarSign, TrendingUp,
  UserCheck, UserX, Zap, ChevronRight, Search, RefreshCw,
  Heart, BarChart2, Target, Award,
} from 'lucide-react'

const SEGMENT_CONFIG = [
  { key: 'vip', label: 'VIP', desc: '5+ is & 1000+ TL harcama', color: 'bg-amber-500/10 text-amber-400', icon: Crown },
  { key: 'active', label: 'Aktif', desc: 'Son 30 gunde is olan', color: 'bg-emerald-500/10 text-emerald-400', icon: Zap },
  { key: 'new', label: 'Yeni', desc: 'Son 7 gunde kayit', color: 'bg-blue-500/10 text-blue-400', icon: UserCheck },
  { key: 'sleeping', label: 'Uyuyan', desc: '30-90 gun inaktif', color: 'bg-violet-500/10 text-violet-400', icon: Clock },
  { key: 'churned', label: 'Kayip', desc: '90+ gun inaktif', color: 'bg-rose-500/10 text-rose-400', icon: UserX },
]

export default function AdminCRMPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [usersRes, jobsRes] = await Promise.allSettled([
        fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
        fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=3000`),
      ])
      setUsers(usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data) ? usersRes.value.data : [])
      const jRaw = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : []
      setJobs(mapJobsFromBackend(jRaw))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const customerData = useMemo(() => {
    const now = new Date()
    const customers = users.filter(u => u.role === 'customer' || u.role === 'CUSTOMER')

    return customers.map(c => {
      const cJobs = jobs.filter(j => (j.customerId || j.customer?.id) === c.id)
      const completed = cJobs.filter(j => j.status === 'completed' || j.status === 'rated')
      const totalSpent = completed.reduce((s, j) => s + (Number(j.budget) || Number(j.price) || 0), 0)
      const lastJobDate = cJobs.length > 0 ? new Date(Math.max(...cJobs.map(j => new Date(j.createdAt || j.date).getTime()))) : null
      const daysSinceLastJob = lastJobDate ? Math.floor((now - lastJobDate) / 86400000) : 999
      const daysSinceRegistration = Math.floor((now - new Date(c.createdAt)) / 86400000)

      // RFM
      const recency = daysSinceLastJob <= 7 ? 5 : daysSinceLastJob <= 30 ? 4 : daysSinceLastJob <= 60 ? 3 : daysSinceLastJob <= 90 ? 2 : 1
      const frequency = completed.length >= 10 ? 5 : completed.length >= 5 ? 4 : completed.length >= 3 ? 3 : completed.length >= 1 ? 2 : 1
      const monetary = totalSpent >= 5000 ? 5 : totalSpent >= 2000 ? 4 : totalSpent >= 500 ? 3 : totalSpent >= 100 ? 2 : 1
      const rfmScore = ((recency + frequency + monetary) / 3).toFixed(1)

      // LTV estimate
      const avgOrderValue = completed.length > 0 ? totalSpent / completed.length : 0
      const orderFrequency = daysSinceRegistration > 0 ? (completed.length / daysSinceRegistration) * 365 : 0
      const ltv = Math.round(avgOrderValue * orderFrequency * 2)

      // Segment
      let segment = 'new'
      if (completed.length >= 5 && totalSpent >= 1000) segment = 'vip'
      else if (daysSinceLastJob <= 30 && completed.length > 0) segment = 'active'
      else if (daysSinceRegistration <= 7) segment = 'new'
      else if (daysSinceLastJob > 90) segment = 'churned'
      else if (daysSinceLastJob > 30) segment = 'sleeping'

      return {
        ...c,
        jobCount: cJobs.length,
        completedCount: completed.length,
        totalSpent,
        lastJobDate,
        daysSinceLastJob,
        recency, frequency, monetary, rfmScore,
        ltv,
        segment,
      }
    }).sort((a, b) => b.totalSpent - a.totalSpent)
  }, [users, jobs])

  const segmentCounts = useMemo(() => {
    const counts = {}
    SEGMENT_CONFIG.forEach(s => { counts[s.key] = 0 })
    customerData.forEach(c => { if (counts[c.segment] !== undefined) counts[c.segment]++ })
    return counts
  }, [customerData])

  const totalLTV = customerData.reduce((s, c) => s + c.ltv, 0)
  const avgLTV = customerData.length > 0 ? Math.round(totalLTV / customerData.length) : 0

  const filtered = customerData.filter(c => {
    if (selectedSegment !== 'all' && c.segment !== selectedSegment) return false
    if (search) {
      const q = search.toLowerCase()
      return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
    }
    return true
  })

  const fmtTL = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Musteri CRM" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Musteri CRM & Segmentasyon" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-6">
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-blue-500/10 text-blue-400"><Users size={15} /></div>
            <p className="text-lg font-bold text-white">{customerData.length}</p>
            <p className="text-[11px] text-zinc-500">Toplam Musteri</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-amber-500/10 text-amber-400"><Crown size={15} /></div>
            <p className="text-lg font-bold text-white">{segmentCounts.vip}</p>
            <p className="text-[11px] text-zinc-500">VIP Musteri</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-emerald-500/10 text-emerald-400"><TrendingUp size={15} /></div>
            <p className="text-lg font-bold text-white">{fmtTL(avgLTV)}</p>
            <p className="text-[11px] text-zinc-500">Ort. LTV</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-rose-500/10 text-rose-400"><UserX size={15} /></div>
            <p className="text-lg font-bold text-white">{segmentCounts.churned}</p>
            <p className="text-[11px] text-zinc-500">Kayip Musteri</p>
          </div>
        </div>

        {/* Segment buttons */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <button onClick={() => setSelectedSegment('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${selectedSegment === 'all' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'}`}>
            Tumuu ({customerData.length})
          </button>
          {SEGMENT_CONFIG.map(s => {
            const Icon = s.icon
            return (
              <button key={s.key} onClick={() => setSelectedSegment(s.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedSegment === s.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'
                }`}>
                <Icon size={11} /> {s.label} ({segmentCounts[s.key]})
              </button>
            )
          })}
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Musteri ara..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none" />
        </div>

        {/* Customer list */}
        <div className="space-y-2">
          {filtered.slice(0, 50).map(c => {
            const segConf = SEGMENT_CONFIG.find(s => s.key === c.segment) || SEGMENT_CONFIG[2]
            const SegIcon = segConf.icon
            return (
              <button key={c.id} onClick={() => navigate(`/admin/users/${c.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] transition text-left">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${segConf.color}`}>
                  <SegIcon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">{c.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${segConf.color}`}>{segConf.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-zinc-500">{c.completedCount} is</span>
                    <span className="text-[10px] text-zinc-500">{fmtTL(c.totalSpent)}</span>
                    <span className="text-[10px] text-zinc-500">RFM: {c.rfmScore}</span>
                    <span className="text-[10px] text-zinc-500">LTV: {fmtTL(c.ltv)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-zinc-600">{c.daysSinceLastJob < 999 ? `${c.daysSinceLastJob}g once` : 'Is yok'}</p>
                </div>
                <ChevronRight size={14} className="text-zinc-700 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
