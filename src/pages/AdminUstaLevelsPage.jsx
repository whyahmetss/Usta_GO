import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Award, Star, Briefcase, TrendingUp, Users, Shield,
  ChevronRight, Crown, Gem, Medal, UserCheck, Zap,
} from 'lucide-react'

const LEVELS = [
  { key: 'bronze',   label: 'Bronze',   color: '#cd7f32', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: Medal,   minJobs: 0,  minRating: 0,   commission: 18 },
  { key: 'silver',   label: 'Silver',   color: '#c0c0c0', bg: 'bg-zinc-400/10',   text: 'text-zinc-300',   icon: Shield,  minJobs: 10, minRating: 3.5, commission: 15 },
  { key: 'gold',     label: 'Gold',     color: '#ffd700', bg: 'bg-amber-500/10',  text: 'text-amber-400',  icon: Crown,   minJobs: 50, minRating: 4.0, commission: 12 },
  { key: 'platinum', label: 'Platinum', color: '#e5e4e2', bg: 'bg-blue-400/10',   text: 'text-blue-300',   icon: Gem,     minJobs: 150,minRating: 4.5, commission: 10 },
]

function getLevelForUsta(jobs, avgRating) {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (jobs >= l.minJobs && avgRating >= l.minRating) level = l
  }
  return level
}

export default function AdminUstaLevelsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedLevel, setSelectedLevel] = useState('all')

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

  const ustaData = useMemo(() => {
    const ustas = users.filter(u => u.role === 'USTA' || u.role === 'professional')
    return ustas.map(u => {
      const ustaJobs = jobs.filter(j => (j.professionalId || j.professional?.id) === u.id)
      const completed = ustaJobs.filter(j => j.status === 'completed' || j.status === 'rated')
      const ratings = ustaJobs.filter(j => j.rating).map(j => j.rating)
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      const revenue = completed.reduce((s, j) => s + (Number(j.budget) || Number(j.price) || 0), 0)
      const level = getLevelForUsta(completed.length, avgRating)
      return {
        ...u,
        completedJobs: completed.length,
        totalJobs: ustaJobs.length,
        avgRating: avgRating.toFixed(1),
        revenue,
        level,
      }
    }).sort((a, b) => b.completedJobs - a.completedJobs)
  }, [users, jobs])

  const levelCounts = useMemo(() => {
    const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
    ustaData.forEach(u => { counts[u.level.key]++ })
    return counts
  }, [ustaData])

  const filteredUstas = selectedLevel === 'all' ? ustaData : ustaData.filter(u => u.level.key === selectedLevel)

  const fmtTL = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Usta Seviyeleri" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Usta Seviye Sistemi" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Level cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-6">
          {LEVELS.map(level => {
            const Icon = level.icon
            return (
              <button key={level.key} onClick={() => setSelectedLevel(level.key === selectedLevel ? 'all' : level.key)}
                className={`rounded-2xl border p-4 transition text-left active:scale-[0.98] ${
                  selectedLevel === level.key ? 'border-white/[0.15] bg-zinc-800' : 'border-white/[0.06] bg-zinc-900'
                }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level.bg}`}>
                    <Icon size={15} className={level.text} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${level.text}`}>{level.label}</p>
                    <p className="text-[9px] text-zinc-600">%{level.commission} komisyon</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-white">{levelCounts[level.key]}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{level.minJobs}+ is, {level.minRating}+ puan</p>
              </button>
            )
          })}
        </div>

        {/* Level requirements table */}
        <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Seviye Gereksinimleri</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 text-zinc-500 font-medium">Seviye</th>
                  <th className="text-center py-2 text-zinc-500 font-medium">Min Is</th>
                  <th className="text-center py-2 text-zinc-500 font-medium">Min Puan</th>
                  <th className="text-center py-2 text-zinc-500 font-medium">Komisyon</th>
                  <th className="text-center py-2 text-zinc-500 font-medium">Usta Sayisi</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map(level => {
                  const Icon = level.icon
                  return (
                    <tr key={level.key} className="border-b border-white/[0.03]">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={level.text} />
                          <span className={`font-semibold ${level.text}`}>{level.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-zinc-300">{level.minJobs}</td>
                      <td className="py-2.5 text-center text-zinc-300">{level.minRating > 0 ? level.minRating : '-'}</td>
                      <td className="py-2.5 text-center text-white font-semibold">%{level.commission}</td>
                      <td className="py-2.5 text-center text-white font-bold">{levelCounts[level.key]}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter button */}
        {selectedLevel !== 'all' && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500">
              {LEVELS.find(l => l.key === selectedLevel)?.label} seviye ustalar gosteriliyor
            </p>
            <button onClick={() => setSelectedLevel('all')} className="text-xs text-blue-400 hover:underline">
              Tumunu Goster
            </button>
          </div>
        )}

        {/* Usta list */}
        <div className="space-y-2">
          {filteredUstas.length === 0 ? (
            <div className="text-center py-10 text-xs text-zinc-600">Bu seviyede usta bulunamadi</div>
          ) : filteredUstas.map((u, i) => {
            const LevelIcon = u.level.icon
            return (
              <button key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] transition text-left">
                <div className="w-8 text-center flex-shrink-0">
                  <span className="text-xs font-black text-zinc-600">{i + 1}</span>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${u.level.bg}`}>
                  <LevelIcon size={15} className={u.level.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">{u.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${u.level.bg} ${u.level.text}`}>
                      {u.level.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-zinc-500">{u.completedJobs} is</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                      <Star size={9} className="text-amber-400 fill-amber-400" /> {u.avgRating}
                    </span>
                    <span className="text-[10px] text-zinc-500">{fmtTL(u.revenue)}</span>
                  </div>
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
