import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import {
  TrendingUp, DollarSign, CreditCard, ArrowDownLeft, Users,
  Briefcase, BarChart2, Calendar, ArrowUpRight, ArrowDownRight,
  Clock,
} from 'lucide-react'

const TYPE_LABELS = {
  TOPUP: { label: 'Bakiye Yükleme', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CreditCard },
  EARNING: { label: 'Usta Kazancı', color: 'text-blue-600', bg: 'bg-blue-50', icon: ArrowUpRight },
  WITHDRAWAL: { label: 'Para Çekme', color: 'text-rose-600', bg: 'bg-rose-50', icon: ArrowDownRight },
  REFUND: { label: 'İade', color: 'text-amber-600', bg: 'bg-amber-50', icon: ArrowDownLeft },
  COUPON: { label: 'Kupon', color: 'text-violet-600', bg: 'bg-violet-50', icon: BarChart2 },
  REFERRAL: { label: 'Referans', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Users },
}

function MiniBar({ data, field, color, max }) {
  return (
    <div className="flex items-end gap-[2px] mt-2 rounded-lg overflow-hidden" style={{ height: 72 }}>
      {data.map((d, i) => {
        const val = Number(d[field]) || 0
        const pct = max > 0 ? (val / max) * 100 : 0
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              height: val > 0 ? `${Math.max(pct, 8)}%` : '2px',
              backgroundColor: color,
              opacity: val > 0 ? 0.85 : 0.18,
            }}
            title={`${d.label}: ${val.toLocaleString('tr-TR')} TL`}
          />
        )
      })}
    </div>
  )
}

function StatBox({ label, value, sub, icon: Icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5E7EB] dark:border-[#334155] p-4 shadow-sm ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminFinancePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('monthly') // 'monthly' | 'daily'
  const [txFilter, setTxFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const COMMISSION_RATE = 0.12
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const [jobsRes, usersRes, txRes] = await Promise.allSettled([
          fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=1000`),
          fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
          fetchAPI(`${API_ENDPOINTS.WALLET.ADMIN_TRANSACTIONS}?limit=2000`),
        ])

        const allJobsRaw = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data)
          ? jobsRes.value.data : []
        const allUsers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data)
          ? usersRes.value.data : []
        const allTransactions = txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data)
          ? txRes.value.data : []

        // İş hacmi (tamamlanan işler)
        const completedJobs = allJobsRaw.filter(j => {
          const s = j.status?.toLowerCase()
          return s === 'completed' || s === 'rated'
        })
        const totalVolume = completedJobs.reduce((s, j) => s + (Number(j.budget) || 0), 0)
        const monthVolume = completedJobs
          .filter(j => new Date(j.completedAt || j.updatedAt || j.createdAt) >= startOfMonth)
          .reduce((s, j) => s + (Number(j.budget) || 0), 0)
        const totalCommission = totalVolume * COMMISSION_RATE
        const monthCommission = monthVolume * COMMISSION_RATE
        const todayJobs = completedJobs.filter(j =>
          new Date(j.completedAt || j.updatedAt || j.createdAt) >= startOfToday
        )
        const todayCommission = todayJobs.reduce((s, j) => s + (Number(j.budget) || 0), 0) * COMMISSION_RATE

        // TOPUP işlemleri (gerçek veriler)
        const topupTx = allTransactions.filter(t => t.type === 'TOPUP' && t.status === 'COMPLETED')
        const totalTopup = topupTx.reduce((s, t) => s + (Number(t.amount) || 0), 0)
        const monthTopup = topupTx
          .filter(t => new Date(t.createdAt) >= startOfMonth)
          .reduce((s, t) => s + (Number(t.amount) || 0), 0)

        // Bekleyen çekimler (transaction tablosundan)
        const withdrawalTx = allTransactions.filter(t => t.type === 'WITHDRAWAL')
        const pendingW = withdrawalTx.filter(w => w.status === 'PENDING')
        const pendingWithdrawalsAmount = pendingW.reduce((s, w) => s + Math.abs(Number(w.amount) || 0), 0)

        // Son 12 ay aylık kırılım
        const monthlyData = []
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
          const label = d.toLocaleString('tr-TR', { month: 'short', year: '2-digit' })
          const vol = completedJobs
            .filter(j => { const cd = new Date(j.completedAt || j.updatedAt || j.createdAt); return cd >= d && cd < end })
            .reduce((s, j) => s + (Number(j.budget) || 0), 0)
          const tp = topupTx
            .filter(t => { const cd = new Date(t.createdAt); return cd >= d && cd < end })
            .reduce((s, t) => s + (Number(t.amount) || 0), 0)
          monthlyData.push({ label, volume: Math.round(vol), commission: Math.round(vol * COMMISSION_RATE), topup: Math.round(tp) })
        }

        // Son 30 gün günlük kırılım
        const dailyData = []
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1)
          const label = `${d.getDate()}/${d.getMonth() + 1}`
          const vol = completedJobs
            .filter(j => { const cd = new Date(j.completedAt || j.updatedAt || j.createdAt); return cd >= d && cd < end })
            .reduce((s, j) => s + (Number(j.budget) || 0), 0)
          const tp = topupTx
            .filter(t => { const cd = new Date(t.createdAt); return cd >= d && cd < end })
            .reduce((s, t) => s + (Number(t.amount) || 0), 0)
          dailyData.push({ label, volume: Math.round(vol), topup: Math.round(tp) })
        }

        // Son işlemler — gerçek transaction kayıtları
        const recentTransactions = allTransactions
          .slice(0, 100)
          .map(t => ({
            id: t.id,
            amount: t.type === 'WITHDRAWAL' ? -Math.abs(Number(t.amount) || 0) : Number(t.amount) || 0,
            type: t.type,
            status: t.status,
            description: t.description || '—',
            userName: t.user?.name || '—',
            createdAt: t.createdAt,
          }))

        setData({
          summary: {
            totalVolume: Math.round(totalVolume),
            monthVolume: Math.round(monthVolume),
            todayCommission: Math.round(todayCommission),
            totalCommission: Math.round(totalCommission),
            monthCommission: Math.round(monthCommission),
            totalTopup: Math.round(totalTopup),
            monthTopup: Math.round(monthTopup),
            pendingWithdrawalsAmount: Math.round(pendingWithdrawalsAmount),
            pendingWithdrawalsCount: pendingW.length,
            totalUsers: allUsers.length,
            completedJobsCount: completedJobs.length,
          },
          monthlyData,
          dailyData,
          recentTransactions,
        })
      } catch (e) {
        console.error('Finance load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Muhasebe" />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const s = data?.summary || {}
  const chartData = view === 'monthly' ? (data?.monthlyData || []) : (data?.dailyData || [])
  const chartMax = Math.max(...chartData.map(d => d.volume || 0), 1)
  const chartMaxTopup = Math.max(...chartData.map(d => d.topup || 0), 1)

  const txTypes = ['all', 'TOPUP', 'EARNING', 'WITHDRAWAL', 'REFUND', 'COUPON']
  const filteredTx = (data?.recentTransactions || []).filter(t => txFilter === 'all' || t.type === txFilter)

  const fmt = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`

  return (
    <Layout hideNav>
      <PageHeader title="Muhasebe" />
      <div className="max-w-2xl mx-auto px-4 pb-10">

        {/* Özet kartlar */}
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3 mt-4">Genel Özet</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatBox
            label="Toplam İş Hacmi"
            value={fmt(s.totalVolume)}
            sub={`Bu ay: ${fmt(s.monthVolume)}`}
            icon={TrendingUp}
            color="bg-blue-50 text-blue-600"
          />
          <StatBox
            label="Platform Komisyonu"
            value={fmt(s.totalCommission)}
            sub={`Bu ay: ${fmt(s.monthCommission)}`}
            icon={DollarSign}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatBox
            label="Müşteri Yükleme"
            value={fmt(s.totalTopup)}
            sub={`Bu ay: ${fmt(s.monthTopup)}`}
            icon={CreditCard}
            color="bg-violet-50 text-violet-600"
          />
          <StatBox
            label="Bekleyen Çekim"
            value={fmt(s.pendingWithdrawalsAmount)}
            sub={`${s.pendingWithdrawalsCount || 0} talep`}
            icon={ArrowDownLeft}
            color="bg-rose-50 text-rose-600"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox
            label="Bugün Komisyon"
            value={fmt(s.todayCommission)}
            icon={Calendar}
            color="bg-amber-50 text-amber-600"
          />
          <StatBox
            label="Tamamlanan İş"
            value={s.completedJobsCount || 0}
            icon={Briefcase}
            color="bg-primary-50 text-primary-600"
          />
          <StatBox
            label="Toplam Kullanıcı"
            value={s.totalUsers || 0}
            icon={Users}
            color="bg-cyan-50 text-cyan-600"
          />
        </div>

        {/* Grafik */}
        <Card padding="p-4" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart2 size={16} className="text-primary-500" /> Ciro Grafiği
            </h2>
            <div className="flex gap-1">
              {['monthly', 'daily'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${view === v ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  {v === 'monthly' ? '12 Ay' : '30 Gün'}
                </button>
              ))}
            </div>
          </div>

          {/* İş hacmi bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary-500 inline-block" />
              <span className="text-[11px] text-gray-500">İş Hacmi</span>
            </div>
            <MiniBar data={chartData} field="volume" color="#2563eb" max={chartMax} />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-gray-400">{chartData[0]?.label}</span>
              <span className="text-[9px] text-gray-400">{chartData[chartData.length - 1]?.label}</span>
            </div>
          </div>

          {/* Bakiye yükleme bar */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" />
              <span className="text-[11px] text-gray-500">Müşteri Yüklemeleri</span>
            </div>
            <MiniBar data={chartData} field="topup" color="#8b5cf6" max={chartMaxTopup} />
          </div>
        </Card>

        {/* Son İşlemler */}
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock size={15} className="text-gray-400" /> Son İşlemler
            </h2>
          </div>

          {/* Filtre */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {txTypes.map(t => (
              <button
                key={t}
                onClick={() => setTxFilter(t)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition ${txFilter === t ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              >
                {t === 'all' ? 'Tümü' : (TYPE_LABELS[t]?.label || t)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredTx.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">İşlem bulunamadı</p>
            )}
            {filteredTx.map(tx => {
              const meta = TYPE_LABELS[tx.type] || { label: tx.type, color: 'text-gray-600', bg: 'bg-gray-50', icon: DollarSign }
              const TxIcon = meta.icon
              const isPositive = tx.amount > 0
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#273548]">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <TxIcon size={15} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {meta.label}
                      {tx.userName && <span className="text-gray-400 font-normal"> · {tx.userName}</span>}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {tx.description || '—'} · {new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} TL
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
