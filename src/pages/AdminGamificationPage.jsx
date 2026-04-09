import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Trophy, Medal, Star, Award, Crown, Target, Zap,
  Users, ChevronRight, TrendingUp, Gift, Heart,
} from 'lucide-react'

const BADGES = [
  { id: 'first_job', name: 'Ilk Is', desc: '1 is tamamla', icon: Zap, color: '#3b82f6', requirement: 1 },
  { id: 'job_10', name: '10 Is', desc: '10 is tamamla', icon: Medal, color: '#f59e0b', requirement: 10 },
  { id: 'job_50', name: '50 Is', desc: '50 is tamamla', icon: Trophy, color: '#8b5cf6', requirement: 50 },
  { id: 'job_100', name: '100 Is', desc: '100 is tamamla', icon: Crown, color: '#ef4444', requirement: 100 },
  { id: 'star_5', name: '5 Yildiz Serisi', desc: '5 ardisik 5 yildiz', icon: Star, color: '#ffd700', requirement: 5 },
  { id: 'speed_king', name: 'Hiz Krali', desc: '24 saat icinde 3 is tamamla', icon: Zap, color: '#10b981', requirement: 3 },
  { id: 'loyal', name: 'Sadik Musteri', desc: '5+ tekrar is', icon: Heart, color: '#ec4899', requirement: 5 },
  { id: 'big_spender', name: 'Buyuk Harcamaci', desc: '5000+ TL harcama', icon: Gift, color: '#f97316', requirement: 5000 },
]

export default function AdminGamificationPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [tab, setTab] = useState('leaderboard')

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

  const leaderboard = useMemo(() => {
    const ustas = users.filter(u => u.role === 'USTA' || u.role === 'professional')
    return ustas.map(u => {
      const uJobs = jobs.filter(j => (j.professionalId || j.professional?.id) === u.id)
      const completed = uJobs.filter(j => j.status === 'completed' || j.status === 'rated')
      const ratings = uJobs.filter(j => j.rating).map(j => j.rating)
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      const revenue = completed.reduce((s, j) => s + (Number(j.budget) || Number(j.price) || 0), 0)
      const points = completed.length * 10 + Math.round(avgRating * 20) + Math.round(revenue / 100)
      const earnedBadges = BADGES.filter(b => {
        if (b.id === 'first_job') return completed.length >= 1
        if (b.id === 'job_10') return completed.length >= 10
        if (b.id === 'job_50') return completed.length >= 50
        if (b.id === 'job_100') return completed.length >= 100
        if (b.id === 'star_5') return ratings.filter(r => r === 5).length >= 5
        return false
      })
      return { ...u, completedCount: completed.length, avgRating: avgRating.toFixed(1), revenue, points, earnedBadges }
    }).sort((a, b) => b.points - a.points)
  }, [users, jobs])

  const customerLeaderboard = useMemo(() => {
    const custs = users.filter(u => u.role === 'customer' || u.role === 'CUSTOMER')
    return custs.map(c => {
      const cJobs = jobs.filter(j => (j.customerId || j.customer?.id) === c.id)
      const completed = cJobs.filter(j => j.status === 'completed' || j.status === 'rated')
      const totalSpent = completed.reduce((s, j) => s + (Number(j.budget) || Number(j.price) || 0), 0)
      const loyaltyPoints = completed.length * 50 + Math.round(totalSpent / 10)
      const earnedBadges = BADGES.filter(b => {
        if (b.id === 'loyal') return completed.length >= 5
        if (b.id === 'big_spender') return totalSpent >= 5000
        return false
      })
      return { ...c, completedCount: completed.length, totalSpent, loyaltyPoints, earnedBadges }
    }).sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
  }, [users, jobs])

  const fmtTL = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`
  const podiumColors = ['from-amber-500 to-amber-600', 'from-zinc-400 to-zinc-500', 'from-orange-600 to-orange-700']

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Gamification" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Gamification & Sadakat" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Tabs */}
        <div className="flex gap-2 mt-4 mb-6">
          {[
            { key: 'leaderboard', label: 'Usta Liderlik', icon: Trophy },
            { key: 'customers', label: 'Musteri Sadakat', icon: Heart },
            { key: 'badges', label: 'Rozetler', icon: Award },
          ].map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  tab === t.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400'
                }`}>
                <Icon size={13} /> {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'leaderboard' && (
          <div className="space-y-3">
            {/* Podium */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-6 pt-4">
                {[1, 0, 2].map(idx => {
                  const u = leaderboard[idx]
                  if (!u) return null
                  return (
                    <div key={u.id} className="flex flex-col items-center" style={{ marginBottom: idx === 0 ? 20 : 0 }}>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${podiumColors[idx]} flex items-center justify-center text-white font-black text-xl mb-2`}>
                        {u.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <p className="text-xs font-bold text-white text-center truncate max-w-[80px]">{u.name}</p>
                      <p className="text-lg font-black text-amber-400">{u.points}</p>
                      <p className="text-[9px] text-zinc-600">puan</p>
                      <div className={`mt-1 w-16 rounded-t-lg bg-gradient-to-t ${podiumColors[idx]} text-center py-1`}>
                        <span className="text-white font-black text-sm">{idx === 0 ? '1' : idx === 1 ? '2' : '3'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {leaderboard.slice(3, 20).map((u, i) => (
              <button key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] transition text-left">
                <span className="w-6 text-center text-xs font-black text-zinc-600">{i + 4}</span>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-400 font-bold text-sm">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-500">{u.completedCount} is</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-zinc-500"><Star size={8} className="text-amber-400" /> {u.avgRating}</span>
                    {u.earnedBadges.map(b => <b.icon key={b.id} size={10} style={{ color: b.color }} />)}
                  </div>
                </div>
                <p className="text-sm font-black text-amber-400">{u.points}</p>
              </button>
            ))}
          </div>
        )}

        {tab === 'customers' && (
          <div className="space-y-2">
            {customerLeaderboard.slice(0, 30).map((c, i) => (
              <button key={c.id} onClick={() => navigate(`/admin/users/${c.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] transition text-left">
                <span className="w-6 text-center text-xs font-black text-zinc-600">{i + 1}</span>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold text-sm">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-500">{c.completedCount} is</span>
                    <span className="text-[10px] text-zinc-500">{fmtTL(c.totalSpent)}</span>
                    {c.earnedBadges.map(b => <b.icon key={b.id} size={10} style={{ color: b.color }} />)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400">{c.loyaltyPoints}</p>
                  <p className="text-[9px] text-zinc-600">sadakat</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'badges' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {BADGES.map(b => {
              const Icon = b.icon
              const earners = tab === 'leaderboard'
                ? leaderboard.filter(u => u.earnedBadges.some(eb => eb.id === b.id)).length
                : users.length
              return (
                <div key={b.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 text-center">
                  <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: b.color + '20' }}>
                    <Icon size={22} style={{ color: b.color }} />
                  </div>
                  <p className="text-xs font-bold text-white">{b.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{b.desc}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
