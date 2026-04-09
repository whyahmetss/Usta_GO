import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import {
  MapPin, Users, Briefcase, AlertTriangle, TrendingUp,
  Plus, Edit3, Trash2, ChevronRight, Search, RefreshCw,
  CheckCircle, XCircle, BarChart2, Zap,
} from 'lucide-react'

const ISTANBUL_DISTRICTS = [
  'Adalar','Arnavutkoy','Atasehir','Avcilar','Bagcilar','Bahcelievler','Bakirkoy',
  'Basaksehir','Bayrampasa','Besiktas','Beykoz','Beylikduzu','Beyoglu','Buyukcekmece',
  'Catalca','Cekmekoy','Esenler','Esenyurt','Eyupsultan','Fatih','Gaziosmanpasa',
  'Gungoren','Kadikoy','Kagithane','Kartal','Kucukcekmece','Maltepe','Pendik',
  'Sancaktepe','Sarıyer','Silivri','Sultanbeyli','Sultangazi','Sile','Sisli',
  'Tuzla','Umraniye','Uskudar','Zeytinburnu',
]

export default function AdminRegionsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [tab, setTab] = useState('overview')

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

  const districtData = useMemo(() => {
    const data = {}
    ISTANBUL_DISTRICTS.forEach(d => {
      data[d] = { name: d, jobs: 0, completed: 0, ustas: 0, customers: 0, revenue: 0, avgRating: 0, ratingCount: 0, totalRating: 0 }
    })

    jobs.forEach(j => {
      const addr = j.location?.address || j.address || ''
      const district = ISTANBUL_DISTRICTS.find(d => addr.toLowerCase().includes(d.toLowerCase()))
      if (district && data[district]) {
        data[district].jobs++
        if (j.status === 'completed' || j.status === 'rated') {
          data[district].completed++
          data[district].revenue += Number(j.budget) || Number(j.price) || 0
        }
        if (j.rating) { data[district].totalRating += j.rating; data[district].ratingCount++ }
      }
    })

    users.forEach(u => {
      const addr = u.address || u.location || ''
      const district = ISTANBUL_DISTRICTS.find(d => (typeof addr === 'string' ? addr : '').toLowerCase().includes(d.toLowerCase()))
      if (district && data[district]) {
        if (u.role === 'USTA' || u.role === 'professional') data[district].ustas++
        else if (u.role === 'customer' || u.role === 'CUSTOMER') data[district].customers++
      }
    })

    Object.values(data).forEach(d => {
      d.avgRating = d.ratingCount > 0 ? (d.totalRating / d.ratingCount).toFixed(1) : '-'
      d.balance = d.ustas > 0 ? (d.jobs / d.ustas).toFixed(1) : d.jobs > 0 ? 'Usta Yok!' : '-'
    })

    return data
  }, [users, jobs])

  const sortedDistricts = useMemo(() => {
    return Object.values(districtData)
      .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.jobs - a.jobs)
  }, [districtData, search])

  const totalStats = useMemo(() => {
    const all = Object.values(districtData)
    return {
      totalJobs: all.reduce((s, d) => s + d.jobs, 0),
      totalUstas: all.reduce((s, d) => s + d.ustas, 0),
      totalRevenue: all.reduce((s, d) => s + d.revenue, 0),
      hotspots: all.filter(d => d.jobs > 0 && d.ustas === 0).length,
    }
  }, [districtData])

  const fmtTL = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Bolge Yonetimi" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const detail = selectedDistrict ? districtData[selectedDistrict] : null

  return (
    <Layout hideNav>
      <PageHeader title="Bolge Yonetimi" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-6">
          {[
            { label: 'Toplam Is (Bolgesel)', value: totalStats.totalJobs, icon: Briefcase, color: 'bg-blue-500/10 text-blue-400' },
            { label: 'Toplam Usta', value: totalStats.totalUstas, icon: Users, color: 'bg-emerald-500/10 text-emerald-400' },
            { label: 'Bolgesel Ciro', value: fmtTL(totalStats.totalRevenue), icon: TrendingUp, color: 'bg-amber-500/10 text-amber-400' },
            { label: 'Usta Eksik Bolge', value: totalStats.hotspots, icon: AlertTriangle, color: totalStats.hotspots > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400' },
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

        {/* Detail panel or list */}
        {detail ? (
          <div>
            <button onClick={() => setSelectedDistrict(null)} className="text-xs text-blue-400 mb-4 flex items-center gap-1 hover:underline">
              &larr; Tum Bolgeler
            </button>
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <MapPin size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{detail.name}</h2>
                  <p className="text-xs text-zinc-500">Istanbul</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Toplam Is', value: detail.jobs, color: 'text-blue-400' },
                  { label: 'Tamamlanan', value: detail.completed, color: 'text-emerald-400' },
                  { label: 'Usta Sayisi', value: detail.ustas, color: 'text-violet-400' },
                  { label: 'Musteri', value: detail.customers, color: 'text-teal-400' },
                  { label: 'Ciro', value: fmtTL(detail.revenue), color: 'text-amber-400' },
                  { label: 'Ort. Puan', value: detail.avgRating, color: 'text-amber-400' },
                  { label: 'Is/Usta Orani', value: detail.balance, color: detail.balance === 'Usta Yok!' ? 'text-rose-400' : 'text-zinc-300' },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-zinc-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Jobs in this district */}
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Bu Bolgedeki Isler</h3>
              {jobs.filter(j => {
                const addr = j.location?.address || j.address || ''
                return addr.toLowerCase().includes(detail.name.toLowerCase())
              }).length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-6">Bu bolgede is bulunamadi</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {jobs.filter(j => {
                    const addr = j.location?.address || j.address || ''
                    return addr.toLowerCase().includes(detail.name.toLowerCase())
                  }).slice(0, 20).map(j => (
                    <div key={j.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{j.title}</p>
                        <p className="text-[10px] text-zinc-500">{j.customer?.name} - {j.status}</p>
                      </div>
                      <p className="text-xs font-bold text-emerald-400">{j.price ?? j.budget} TL</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Search + tabs */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Ilce ara..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                />
              </div>
              <button onClick={load} className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
                <RefreshCw size={14} className="text-zinc-400" />
              </button>
            </div>

            {/* Heat map - simplified bar chart */}
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Ilce Bazli Talep Yogunlugu</h3>
              </div>
              <div className="flex items-end gap-[2px] h-[100px]">
                {sortedDistricts.slice(0, 20).map(d => {
                  const max = sortedDistricts[0]?.jobs || 1
                  const pct = (d.jobs / max) * 100
                  const hasUsta = d.ustas > 0
                  return (
                    <div key={d.name} className="flex-1 flex flex-col items-center cursor-pointer group"
                      onClick={() => setSelectedDistrict(d.name)} title={`${d.name}: ${d.jobs} is, ${d.ustas} usta`}>
                      <div
                        className={`w-full rounded-t-sm transition-all group-hover:opacity-100 ${!hasUsta && d.jobs > 0 ? 'animate-pulse' : ''}`}
                        style={{
                          height: d.jobs > 0 ? `${Math.max(pct, 8)}%` : '2px',
                          backgroundColor: !hasUsta && d.jobs > 0 ? '#ef4444' : '#3b82f6',
                          opacity: d.jobs > 0 ? 0.7 : 0.1,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-zinc-600">{sortedDistricts[0]?.name}</span>
                <span className="text-[8px] text-zinc-600">{sortedDistricts[Math.min(19, sortedDistricts.length - 1)]?.name}</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-[10px] text-zinc-500"><div className="w-2 h-2 rounded-sm bg-blue-500" /> Usta Var</span>
                <span className="flex items-center gap-1 text-[10px] text-zinc-500"><div className="w-2 h-2 rounded-sm bg-rose-500" /> Usta Yok</span>
              </div>
            </div>

            {/* District list */}
            <div className="space-y-1">
              {sortedDistricts.map(d => (
                <button
                  key={d.name}
                  onClick={() => setSelectedDistrict(d.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] transition text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    d.ustas === 0 && d.jobs > 0 ? 'bg-rose-500/10' : 'bg-blue-500/10'
                  }`}>
                    <MapPin size={14} className={d.ustas === 0 && d.jobs > 0 ? 'text-rose-400' : 'text-blue-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{d.name}</span>
                      {d.ustas === 0 && d.jobs > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400">Usta Eksik</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-zinc-500">{d.jobs} is</span>
                      <span className="text-[10px] text-zinc-500">{d.ustas} usta</span>
                      <span className="text-[10px] text-zinc-500">{d.customers} musteri</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-emerald-400">{fmtTL(d.revenue)}</p>
                    <p className="text-[10px] text-zinc-600">{d.avgRating !== '-' ? `${d.avgRating} puan` : ''}</p>
                  </div>
                  <ChevronRight size={14} className="text-zinc-700 flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
