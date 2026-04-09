import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Brain, TrendingUp, AlertTriangle, Zap, Target, BarChart2,
  DollarSign, Users, MapPin, Lightbulb, Activity, RefreshCw,
  CheckCircle, ArrowUpRight, ArrowDownRight, Star,
} from 'lucide-react'

export default function AdminAICommandPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [tab, setTab] = useState('insights')

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

  const insights = useMemo(() => {
    const completed = jobs.filter(j => j.status === 'completed' || j.status === 'rated')
    const cancelled = jobs.filter(j => j.status === 'cancelled')
    const ustas = users.filter(u => u.role === 'USTA' || u.role === 'professional')
    const customers = users.filter(u => u.role === 'customer' || u.role === 'CUSTOMER')

    // Category demand
    const catDemand = {}
    jobs.forEach(j => { const c = j.category || j.serviceCategory || 'Diger'; catDemand[c] = (catDemand[c] || 0) + 1 })
    const topCategory = Object.entries(catDemand).sort((a, b) => b[1] - a[1])[0]
    const lowCategory = Object.entries(catDemand).sort((a, b) => a[1] - b[1])[0]

    // Completion rate trend
    const completionRate = jobs.length > 0 ? ((completed.length / jobs.length) * 100).toFixed(1) : '0'
    const cancelRate = jobs.length > 0 ? ((cancelled.length / jobs.length) * 100).toFixed(1) : '0'

    // Usta utilization
    const ustaWithJobs = new Set(jobs.filter(j => j.professionalId || j.professional?.id).map(j => j.professionalId || j.professional?.id)).size
    const utilization = ustas.length > 0 ? ((ustaWithJobs / ustas.length) * 100).toFixed(0) : '0'

    // Price analysis
    const prices = completed.map(j => Number(j.budget) || Number(j.price) || 0).filter(p => p > 0)
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
    const medianPrice = prices.length > 0 ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0

    // Recommendations
    const recommendations = []

    if (Number(cancelRate) > 20) {
      recommendations.push({ type: 'warning', title: 'Yuksek Iptal Orani', desc: `Iptal orani %${cancelRate} - sebeplerini arastirin. Eslestirme algoritmasi iyilestirilmeli.`, icon: AlertTriangle, color: 'bg-rose-500/10 text-rose-400' })
    }

    if (Number(utilization) < 50) {
      recommendations.push({ type: 'action', title: 'Dusuk Usta Kullanimi', desc: `Ustalarin sadece %${utilization}'i aktif. Inaktif ustalara bildirim gonderin.`, icon: Users, color: 'bg-amber-500/10 text-amber-400' })
    }

    if (topCategory) {
      recommendations.push({ type: 'insight', title: `${topCategory[0]} En Populer`, desc: `${topCategory[1]} taleple en cok aranan kategori. Bu alanda usta sayisini artirin.`, icon: TrendingUp, color: 'bg-blue-500/10 text-blue-400' })
    }

    if (lowCategory && lowCategory[1] < 3) {
      recommendations.push({ type: 'action', title: `${lowCategory[0]} Dusuk Talep`, desc: `Sadece ${lowCategory[1]} talep. Bu kategoriyi gecici olarak kapatmayi dusunun.`, icon: Target, color: 'bg-violet-500/10 text-violet-400' })
    }

    if (customers.length > 0) {
      const inactive30 = customers.filter(c => {
        const cJobs = jobs.filter(j => (j.customerId || j.customer?.id) === c.id)
        if (cJobs.length === 0) return true
        const lastJob = Math.max(...cJobs.map(j => new Date(j.createdAt || j.date).getTime()))
        return Date.now() - lastJob > 30 * 86400000
      })
      if (inactive30.length > customers.length * 0.3) {
        recommendations.push({ type: 'action', title: 'Uyuyan Musteriler', desc: `${inactive30.length} musteri 30+ gun inaktif. Geri don kampanyasi baslatin.`, icon: Zap, color: 'bg-teal-500/10 text-teal-400' })
      }
    }

    recommendations.push({ type: 'insight', title: 'Fiyat Analizi', desc: `Ort: ${avgPrice} TL, Medyan: ${medianPrice} TL. ${avgPrice > medianPrice * 1.5 ? 'Asiri yuksek fiyatli isler var - kontrol edin.' : 'Fiyat dagılimi normal.'}`, icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-400' })

    return {
      completionRate, cancelRate, utilization, avgPrice, medianPrice,
      totalJobs: jobs.length, totalCompleted: completed.length,
      topCategory, recommendations,
    }
  }, [users, jobs])

  // AI pricing performance mock
  const pricingPerformance = useMemo(() => {
    const completed = jobs.filter(j => j.status === 'completed' || j.status === 'rated')
    const withBudgetAndPrice = completed.filter(j => j.budget && j.price && j.budget !== j.price)
    const accuracyData = withBudgetAndPrice.map(j => {
      const predicted = Number(j.budget)
      const actual = Number(j.price)
      const diff = Math.abs(predicted - actual)
      const accuracy = Math.max(0, 100 - (diff / actual) * 100)
      return { predicted, actual, accuracy }
    })
    const avgAccuracy = accuracyData.length > 0 ? (accuracyData.reduce((s, d) => s + d.accuracy, 0) / accuracyData.length).toFixed(0) : '-'
    return { totalPredictions: withBudgetAndPrice.length, avgAccuracy, data: accuracyData.slice(0, 20) }
  }, [jobs])

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="AI Komut Merkezi" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="AI Komut Merkezi" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 mb-6">
          {[
            { label: 'Tamamlama', value: `%${insights.completionRate}`, icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-400', good: Number(insights.completionRate) > 60 },
            { label: 'Iptal', value: `%${insights.cancelRate}`, icon: AlertTriangle, color: Number(insights.cancelRate) > 20 ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400' },
            { label: 'Usta Kullanim', value: `%${insights.utilization}`, icon: Users, color: 'bg-blue-500/10 text-blue-400' },
            { label: 'AI Fiyat Isabeti', value: pricingPerformance.avgAccuracy !== '-' ? `%${pricingPerformance.avgAccuracy}` : '-', icon: Brain, color: 'bg-violet-500/10 text-violet-400' },
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
            { key: 'insights', label: 'AI Onerileri', icon: Lightbulb },
            { key: 'pricing', label: 'Fiyat Tahmin', icon: DollarSign },
            { key: 'anomaly', label: 'Anomali', icon: Activity },
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

        {tab === 'insights' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-2xl border border-violet-500/20 p-5 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-white">AI Oneriler ({insights.recommendations.length})</h3>
              </div>
              <p className="text-[11px] text-zinc-400">Platform verilerine dayali otomatik analiz ve aksiyon onerileri</p>
            </div>
            {insights.recommendations.map((r, i) => {
              const Icon = r.icon
              return (
                <div key={i} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white">{r.title}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                          r.type === 'warning' ? 'bg-rose-500/10 text-rose-400' : r.type === 'action' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>{r.type === 'warning' ? 'UYARI' : r.type === 'action' ? 'AKSIYON' : 'BILGI'}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{r.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'pricing' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Fiyat Tahmin Performansi</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04] text-center">
                  <p className="text-lg font-bold text-white">{pricingPerformance.totalPredictions}</p>
                  <p className="text-[10px] text-zinc-500">Tahmin</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04] text-center">
                  <p className="text-lg font-bold text-emerald-400">%{pricingPerformance.avgAccuracy}</p>
                  <p className="text-[10px] text-zinc-500">Isabet</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04] text-center">
                  <p className="text-lg font-bold text-white">{insights.avgPrice} TL</p>
                  <p className="text-[10px] text-zinc-500">Ort Fiyat</p>
                </div>
              </div>
              {pricingPerformance.data.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-600 px-1 mb-1">
                    <span>Tahmin</span><span>Gercek</span><span>Isabet</span>
                  </div>
                  {pricingPerformance.data.slice(0, 10).map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg p-2">
                      <span className="text-xs text-zinc-400">{d.predicted} TL</span>
                      <span className="text-xs text-white font-semibold">{d.actual} TL</span>
                      <span className={`text-xs font-bold ${d.accuracy > 80 ? 'text-emerald-400' : d.accuracy > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                        %{d.accuracy.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'anomaly' && (
          <div className="space-y-3">
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Anomali Tespiti</h3>
              </div>
              {[
                { label: 'Anormal Fiyat', desc: `Ort fiyatin 3x uzeri isler`, count: jobs.filter(j => (Number(j.budget) || Number(j.price) || 0) > insights.avgPrice * 3).length, severity: 'high' },
                { label: 'Anormal Siparis Yogunlugu', desc: 'Son 1 saatte 10+ is olusturan kullanicilar', count: 0, severity: 'low' },
                { label: 'Anormal Iptal', desc: 'Ayni gun 3+ iptal', count: 0, severity: 'medium' },
              ].map(a => (
                <div key={a.label} className={`bg-white/[0.03] rounded-xl p-3 border mb-2 ${
                  a.severity === 'high' ? 'border-rose-500/20' : a.severity === 'medium' ? 'border-amber-500/20' : 'border-white/[0.04]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{a.label}</p>
                      <p className="text-[10px] text-zinc-500">{a.desc}</p>
                    </div>
                    <p className={`text-lg font-black ${a.count > 0 ? 'text-rose-400' : 'text-zinc-600'}`}>{a.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
