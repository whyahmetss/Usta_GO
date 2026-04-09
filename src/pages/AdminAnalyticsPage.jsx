import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  BarChart2, TrendingUp, Users, Briefcase, DollarSign, Clock,
  ArrowRight, Activity, UserCheck, Star, Zap, Target, PieChart,
  RefreshCw, ArrowUpRight, ArrowDownRight, Award,
} from 'lucide-react'

function MiniBar({ data, color = '#3b82f6', height = 80 }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        return (
          <div key={i} className="flex-1">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: d.value > 0 ? `${Math.max(pct, 6)}%` : '2px',
                backgroundColor: color,
                opacity: d.value > 0 ? 0.8 : 0.15,
              }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        )
      })}
    </div>
  )
}

function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <div className="flex items-center justify-center text-xs text-zinc-600" style={{ width: size, height: size }}>Veri yok</div>
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {segments.map((seg, i) => {
        const pct = seg.value / total
        const dash = pct * circumference
        const gap = circumference - dash
        const currentOffset = offset
        offset += dash
        return (
          <circle key={i} cx="50" cy="50" r={radius} fill="none" stroke={seg.color}
            strokeWidth="12" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-currentOffset}
            className="transition-all duration-500" />
        )
      })}
      <text x="50" y="48" textAnchor="middle" className="fill-white text-[13px] font-bold">{total}</text>
      <text x="50" y="60" textAnchor="middle" className="fill-zinc-500 text-[7px]">Toplam</text>
    </svg>
  )
}

function FunnelStep({ label, count, total, color, isLast }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0
  const barW = total > 0 ? Math.max((count / total) * 100, 4) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">{count}</span>
          <span className="text-[10px] text-zinc-500">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barW}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [transactions, setTransactions] = useState([])
  const [period, setPeriod] = useState('30d')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [usersRes, jobsRes, txRes] = await Promise.allSettled([
        fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
        fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=2000`),
        fetchAPI(`${API_ENDPOINTS.WALLET.ADMIN_TRANSACTIONS}?limit=5000`),
      ])
      setUsers(usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data) ? usersRes.value.data : [])
      const jRaw = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : []
      setJobs(mapJobsFromBackend(jRaw))
      setTransactions(txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data) ? txRes.value.data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const analytics = useMemo(() => {
    const now = new Date()
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const cutoff = new Date(now.getTime() - daysBack * 86400000)

    const periodJobs = jobs.filter(j => new Date(j.createdAt || j.date) >= cutoff)
    const periodUsers = users.filter(u => new Date(u.createdAt) >= cutoff)

    // Funnel
    const totalRegistered = users.length
    const withFirstJob = new Set(jobs.map(j => j.customerId || j.customer?.id).filter(Boolean)).size
    const matched = jobs.filter(j => j.professionalId || j.professional?.id).length
    const completed = jobs.filter(j => j.status === 'completed' || j.status === 'rated').length
    const rated = jobs.filter(j => j.rating).length
    const customerJobCounts = {}
    jobs.forEach(j => { const cid = j.customerId || j.customer?.id; if (cid) customerJobCounts[cid] = (customerJobCounts[cid] || 0) + 1 })
    const repeatCustomers = Object.values(customerJobCounts).filter(c => c > 1).length

    // Category revenue
    const catRev = {}
    jobs.filter(j => j.status === 'completed' || j.status === 'rated').forEach(j => {
      const cat = j.category || j.serviceCategory || 'Diger'
      catRev[cat] = (catRev[cat] || 0) + (Number(j.budget) || Number(j.price) || 0)
    })
    const colors8 = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#14b8a6','#f97316','#ec4899']
    const categorySegments = Object.entries(catRev).sort((a,b) => b[1]-a[1])
      .map(([name, value], i) => ({ name, value, color: colors8[i % 8] }))

    // Usta performance
    const ustaMap = {}
    jobs.forEach(j => {
      const uid = j.professionalId || j.professional?.id
      if (!uid) return
      if (!ustaMap[uid]) ustaMap[uid] = { name: j.professional?.name || '\u2014', jobs: 0, completed: 0, cancelled: 0, totalRating: 0, ratingCount: 0, revenue: 0 }
      ustaMap[uid].jobs++
      if (j.status === 'completed' || j.status === 'rated') { ustaMap[uid].completed++; ustaMap[uid].revenue += Number(j.budget) || Number(j.price) || 0 }
      if (j.status === 'cancelled') ustaMap[uid].cancelled++
      if (j.rating) { ustaMap[uid].totalRating += j.rating; ustaMap[uid].ratingCount++ }
    })
    const ustaPerformance = Object.entries(ustaMap)
      .map(([id, d]) => ({ id, ...d, avgRating: d.ratingCount > 0 ? (d.totalRating / d.ratingCount).toFixed(1) : '\u2014', completionRate: d.jobs > 0 ? ((d.completed / d.jobs) * 100).toFixed(0) : '0', cancelRate: d.jobs > 0 ? ((d.cancelled / d.jobs) * 100).toFixed(0) : '0' }))
      .sort((a, b) => b.completed - a.completed).slice(0, 10)

    // Daily trend
    const dailyMap = {}
    for (let i = 0; i < daysBack; i++) {
      const key = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10)
      dailyMap[key] = { jobs: 0, revenue: 0, users: 0 }
    }
    periodJobs.forEach(j => { const k = new Date(j.createdAt || j.date).toISOString().slice(0, 10); if (dailyMap[k]) dailyMap[k].jobs++ })
    periodUsers.forEach(u => { const k = new Date(u.createdAt).toISOString().slice(0, 10); if (dailyMap[k]) dailyMap[k].users++ })
    const dailyTrend = Object.entries(dailyMap).sort((a,b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ label: date.slice(5), ...d }))

    // Roles
    const customers = users.filter(u => u.role === 'customer' || u.role === 'CUSTOMER').length
    const ustas = users.filter(u => u.role === 'USTA' || u.role === 'professional').length

    // Revenue
    const totalRevenue = jobs.filter(j => j.status === 'completed' || j.status === 'rated')
      .reduce((s, j) => s + (Number(j.budget) || Number(j.price) || 0), 0)
    const periodRevenue = periodJobs.filter(j => j.status === 'completed' || j.status === 'rated')
      .reduce((s, j) => s + (Number(j.budget) || Number(j.price) || 0), 0)

    // Job status
    const jobStatuses = {}
    jobs.forEach(j => { jobStatuses[j.status] = (jobStatuses[j.status] || 0) + 1 })

    // Avg rating
    const allRatings = jobs.filter(j => j.rating).map(j => j.rating)
    const avgRating = allRatings.length > 0 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) : '\u2014'

    return {
      funnel: { totalRegistered, withFirstJob, matched, completed, rated, repeatCustomers },
      categorySegments, ustaPerformance, dailyTrend,
      roles: { customers, ustas }, jobStatuses,
      totalRevenue, periodRevenue,
      periodJobs: periodJobs.length, periodUsers: periodUsers.length,
      avgRating, totalRatings: allRatings.length,
    }
  }, [users, jobs, transactions, period])

  const fmt = (n) => (n || 0).toLocaleString('tr-TR')
  const fmtTL = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`

  const STATUS_LABELS = {
    pending: 'Beklemede', accepted: 'Kabul', in_progress: 'Devam', pending_approval: 'Onay Bekliyor',
    completed: 'Tamamlandi', rated: 'Degerlendirildi', cancelled: 'Iptal',
  }
  const STATUS_COLORS = {
    pending: '#f59e0b', accepted: '#3b82f6', in_progress: '#8b5cf6', pending_approval: '#f97316',
    completed: '#10b981', rated: '#14b8a6', cancelled: '#ef4444',
  }

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Analitik" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Analitik & Is Zekasi" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Period selector */}
        <div className="flex items-center gap-2 mt-4 mb-6">
          {[{ key: '7d', label: '7 Gun' }, { key: '30d', label: '30 Gun' }, { key: '90d', label: '90 Gun' }].map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${period === p.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'}`}>
              {p.label}
            </button>
          ))}
          <button onClick={load} className="ml-auto w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
            <RefreshCw size={14} className="text-zinc-400" />
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Donem Geliri', value: fmtTL(analytics.periodRevenue), icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-400' },
            { label: 'Yeni Isler', value: fmt(analytics.periodJobs), icon: Briefcase, color: 'bg-blue-500/10 text-blue-400' },
            { label: 'Yeni Kullanicilar', value: fmt(analytics.periodUsers), icon: Users, color: 'bg-violet-500/10 text-violet-400' },
            { label: 'Toplam Ciro', value: fmtTL(analytics.totalRevenue), icon: TrendingUp, color: 'bg-amber-500/10 text-amber-400' },
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

        {/* Job Trend */}
        <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Is Trendi</h3>
              <p className="text-[11px] text-zinc-500">Gunluk yeni is sayisi</p>
            </div>
            <Activity size={16} className="text-blue-400" />
          </div>
          <MiniBar data={analytics.dailyTrend.map(d => ({ label: d.label, value: d.jobs }))} color="#3b82f6" height={90} />
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-zinc-600">{analytics.dailyTrend[0]?.label}</span>
            <span className="text-[9px] text-zinc-600">{analytics.dailyTrend[analytics.dailyTrend.length - 1]?.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Funnel */}
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-5">
              <Target size={16} className="text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Donusum Hunisi</h3>
            </div>
            <div className="space-y-3">
              <FunnelStep label="Kayit" count={analytics.funnel.totalRegistered} total={analytics.funnel.totalRegistered} color="#3b82f6" />
              <FunnelStep label="Ilk Is Talebi" count={analytics.funnel.withFirstJob} total={analytics.funnel.totalRegistered} color="#8b5cf6" />
              <FunnelStep label="Esleme" count={analytics.funnel.matched} total={analytics.funnel.totalRegistered} color="#f59e0b" />
              <FunnelStep label="Tamamlama" count={analytics.funnel.completed} total={analytics.funnel.totalRegistered} color="#10b981" />
              <FunnelStep label="Degerlendirme" count={analytics.funnel.rated} total={analytics.funnel.totalRegistered} color="#14b8a6" />
              <FunnelStep label="Tekrar Kullanim" count={analytics.funnel.repeatCustomers} total={analytics.funnel.totalRegistered} color="#ec4899" isLast />
            </div>
          </div>

          {/* Category Revenue */}
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-5">
              <PieChart size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Kategori Bazli Gelir</h3>
            </div>
            {analytics.categorySegments.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-xs text-zinc-600">Tamamlanan is yok</div>
            ) : (
              <div className="flex items-center gap-6">
                <DonutChart segments={analytics.categorySegments} size={130} />
                <div className="flex-1 space-y-2">
                  {analytics.categorySegments.slice(0, 6).map(seg => (
                    <div key={seg.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-xs text-zinc-400 flex-1 truncate">{seg.name}</span>
                      <span className="text-xs font-semibold text-white">{fmtTL(seg.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Status Distribution + User Roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Is Durum Dagilimi</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(analytics.jobStatuses).sort((a,b) => b[1]-a[1]).map(([status, count]) => {
                const total = jobs.length
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-400">{STATUS_LABELS[status] || status}</span>
                      <span className="text-xs font-semibold text-white">{count} <span className="text-zinc-600">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] || '#6b7280' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-teal-400" />
              <h3 className="text-sm font-semibold text-white">Platform Ozeti</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Musteriler', value: analytics.roles.customers, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
                { label: 'Ustalar', value: analytics.roles.ustas, icon: UserCheck, color: 'text-emerald-400 bg-emerald-500/10' },
                { label: 'Ort. Puan', value: analytics.avgRating, icon: Star, color: 'text-amber-400 bg-amber-500/10' },
                { label: 'Degerlendirme', value: analytics.totalRatings, icon: Award, color: 'text-violet-400 bg-violet-500/10' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${item.color}`}>
                      <Icon size={13} />
                    </div>
                    <p className="text-lg font-bold text-white">{item.value}</p>
                    <p className="text-[10px] text-zinc-500">{item.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Usta Performance */}
        <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Usta Performans Siralamasi</h3>
          </div>
          {analytics.ustaPerformance.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-6">Henuz veri yok</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 text-zinc-500 font-medium">#</th>
                    <th className="text-left py-2 text-zinc-500 font-medium">Usta</th>
                    <th className="text-center py-2 text-zinc-500 font-medium">Is</th>
                    <th className="text-center py-2 text-zinc-500 font-medium">Tamam</th>
                    <th className="text-center py-2 text-zinc-500 font-medium">Iptal %</th>
                    <th className="text-center py-2 text-zinc-500 font-medium">Puan</th>
                    <th className="text-right py-2 text-zinc-500 font-medium">Ciro</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.ustaPerformance.map((u, i) => (
                    <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2.5 text-zinc-600 font-semibold">{i + 1}</td>
                      <td className="py-2.5 text-white font-medium">{u.name}</td>
                      <td className="py-2.5 text-center text-zinc-300">{u.jobs}</td>
                      <td className="py-2.5 text-center">
                        <span className="text-emerald-400 font-semibold">{u.completionRate}%</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={Number(u.cancelRate) > 20 ? 'text-rose-400 font-semibold' : 'text-zinc-400'}>{u.cancelRate}%</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span className="text-amber-400 font-semibold">{u.avgRating}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-white font-semibold">{fmtTL(u.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Registration Trend */}
        <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Kullanici Kayit Trendi</h3>
              <p className="text-[11px] text-zinc-500">Gunluk yeni kayit</p>
            </div>
            <Users size={16} className="text-violet-400" />
          </div>
          <MiniBar data={analytics.dailyTrend.map(d => ({ label: d.label, value: d.users }))} color="#8b5cf6" height={70} />
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-zinc-600">{analytics.dailyTrend[0]?.label}</span>
            <span className="text-[9px] text-zinc-600">{analytics.dailyTrend[analytics.dailyTrend.length - 1]?.label}</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
