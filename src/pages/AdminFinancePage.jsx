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
  TOPUP: { label: 'Bakiye Yükleme', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CreditCard },
  EARNING: { label: 'Usta Kazancı', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: ArrowUpRight },
  WITHDRAWAL: { label: 'Para Çekme', color: 'text-rose-400', bg: 'bg-rose-500/10', icon: ArrowDownRight },
  JOB_PAYMENT: { label: 'İş Ödemesi', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Briefcase },
  REFUND: { label: 'İade', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: ArrowDownLeft },
  COUPON: { label: 'Kupon', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: BarChart2 },
  REFERRAL: { label: 'Referans', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Users },
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
      className={`bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-bold text-white leading-tight">{value}</p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminFinancePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('monthly') // 'monthly' | 'daily'
  const [txFilter, setTxFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'withdrawals'
  const [withdrawals, setWithdrawals] = useState([])
  const [wFilter, setWFilter] = useState('pending')
  const [wLoading, setWLoading] = useState(false)
  const [processingId, setProcessingId] = useState(null)

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

        // Son işlemler — JOB_PAYMENT: iş oluşturma; WITHDRAWAL: sadece usta banka çekimi
        // Müşterinin WITHDRAWAL kayıtları (eski hata) → JOB_PAYMENT olarak göster
        const recentTransactions = allTransactions
          .slice(0, 100)
          .map(t => {
            const raw = Number(t.amount) || 0
            const userRole = t.user?.role || ''
            const effectiveType =
              t.type === 'WITHDRAWAL' && userRole === 'CUSTOMER' ? 'JOB_PAYMENT' : t.type
            const isDebit = effectiveType === 'WITHDRAWAL' || effectiveType === 'JOB_PAYMENT'
            const amount = isDebit ? -Math.abs(raw) : raw
            return {
              id: t.id,
              amount,
              type: effectiveType,
              status: t.status,
              description: t.description || '—',
              userName: t.user?.name || '—',
              createdAt: t.createdAt,
            }
          })

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

  const loadWithdrawals = async () => {
    setWLoading(true)
    try {
      const res = await fetchAPI('/wallet/admin/withdrawals')
      setWithdrawals(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])
    } catch (e) { console.error(e) }
    finally { setWLoading(false) }
  }

  const handleWApprove = async (id) => {
    if (!confirm('Bu çekim talebini onaylamak istediğinize emin misiniz?')) return
    setProcessingId(id)
    try {
      await fetchAPI(`/wallet/withdraw/${id}/approve`, { method: 'PATCH', body: {} })
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' } : w))
    } catch (e) { alert(e.message) }
    finally { setProcessingId(null) }
  }

  const handleWReject = async (id) => {
    const reason = prompt('Red nedeni (opsiyonel):')
    if (reason === null) return
    setProcessingId(id)
    try {
      await fetchAPI(`/wallet/withdraw/${id}/reject`, { method: 'PATCH', body: { rejectionReason: reason || 'Belirtilmedi' } })
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' } : w))
    } catch (e) { alert(e.message) }
    finally { setProcessingId(null) }
  }

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Muhasebe" />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const s = data?.summary || {}
  const chartData = view === 'monthly' ? (data?.monthlyData || []) : (data?.dailyData || [])
  const chartMax = Math.max(...chartData.map(d => d.volume || 0), 1)
  const chartMaxTopup = Math.max(...chartData.map(d => d.topup || 0), 1)

  const txTypes = ['all', 'TOPUP', 'EARNING', 'JOB_PAYMENT', 'WITHDRAWAL', 'REFUND', 'COUPON']
  const filteredTx = (data?.recentTransactions || []).filter(t => txFilter === 'all' || t.type === txFilter)

  const fmt = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`

  return (
    <Layout hideNav>
      <PageHeader title="Muhasebe" />
      <div className="max-w-2xl mx-auto px-4 pb-10">

        {/* Tab navigation */}
        <div className="flex gap-2 mt-4 mb-5">
          {[
            { key: 'overview', label: 'Genel Özet' },
            { key: 'withdrawals', label: 'Para Çekme' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                if (tab.key === 'withdrawals' && withdrawals.length === 0) loadWithdrawals()
              }}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'withdrawals' ? (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
              {[
                { key: 'pending', label: 'Bekleyen' },
                { key: 'approved', label: 'Onaylanan' },
                { key: 'rejected', label: 'Reddedilen' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setWFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    wFilter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={loadWithdrawals}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1] transition"
              >
                Yenile
              </button>
            </div>

            {wLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.filter(w => (w.status || 'pending') === wFilter).length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm">Bu kategoride talep yok</div>
                ) : withdrawals
                  .filter(w => (w.status || 'pending') === wFilter)
                  .map(w => (
                    <Card key={w.id} padding="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          wFilter === 'approved' ? 'bg-emerald-500/10' : wFilter === 'rejected' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                        }`}>
                          <ArrowDownLeft size={18} className={
                            wFilter === 'approved' ? 'text-emerald-400' : wFilter === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                          } />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{w.user?.name || '—'}</p>
                          <p className="text-xs text-zinc-500 truncate">{w.user?.email || w.description || '—'}</p>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            {w.createdAt ? new Date(w.createdAt).toLocaleString('tr-TR') : '—'}
                          </p>
                          {w.rejectionReason && (
                            <p className="text-[11px] text-rose-500 mt-1">Red: {w.rejectionReason}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-rose-400">
                            {Math.abs(Number(w.amount) || 0).toLocaleString('tr-TR')} TL
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            wFilter === 'approved' ? 'bg-emerald-500/10 text-emerald-400'
                            : wFilter === 'rejected' ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {wFilter === 'approved' ? 'Onaylandı' : wFilter === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                          </span>
                        </div>
                      </div>
                      {wFilter === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                          <button
                            onClick={() => handleWApprove(w.id)}
                            disabled={processingId === w.id}
                            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition"
                          >
                            {processingId === w.id ? '...' : 'Onayla'}
                          </button>
                          <button
                            onClick={() => handleWReject(w.id)}
                            disabled={processingId === w.id}
                            className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition"
                          >
                            {processingId === w.id ? '...' : 'Reddet'}
                          </button>
                        </div>
                      )}
                    </Card>
                  ))
                }
              </div>
            )}
          </div>
        ) : (
        <>

        {/* Özet kartlar */}
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-3">Genel Özet</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatBox
            label="Toplam İş Hacmi"
            value={fmt(s.totalVolume)}
            sub={`Bu ay: ${fmt(s.monthVolume)}`}
            icon={TrendingUp}
            color="bg-blue-500/10 text-blue-400"
          />
          <StatBox
            label="Platform Komisyonu"
            value={fmt(s.totalCommission)}
            sub={`Bu ay: ${fmt(s.monthCommission)}`}
            icon={DollarSign}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <StatBox
            label="Müşteri Yükleme"
            value={fmt(s.totalTopup)}
            sub={`Bu ay: ${fmt(s.monthTopup)}`}
            icon={CreditCard}
            color="bg-violet-500/10 text-violet-400"
          />
          <StatBox
            label="Bekleyen Çekim"
            value={fmt(s.pendingWithdrawalsAmount)}
            sub={`${s.pendingWithdrawalsCount || 0} talep`}
            icon={ArrowDownLeft}
            color="bg-rose-500/10 text-rose-400"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox
            label="Bugün Komisyon"
            value={fmt(s.todayCommission)}
            icon={Calendar}
            color="bg-amber-500/10 text-amber-400"
          />
          <StatBox
            label="Tamamlanan İş"
            value={s.completedJobsCount || 0}
            icon={Briefcase}
            color="bg-blue-500/10 text-blue-400"
          />
          <StatBox
            label="Toplam Kullanıcı"
            value={s.totalUsers || 0}
            icon={Users}
            color="bg-cyan-500/10 text-cyan-400"
          />
        </div>

        {/* Grafik */}
        <Card padding="p-4" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-400" /> Ciro Grafiği
            </h2>
            <div className="flex gap-1">
              {['monthly', 'daily'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${view === v ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-zinc-400'}`}
                >
                  {v === 'monthly' ? '12 Ay' : '30 Gün'}
                </button>
              ))}
            </div>
          </div>

          {/* İş hacmi bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
              <span className="text-[11px] text-zinc-500">İş Hacmi</span>
            </div>
            <MiniBar data={chartData} field="volume" color="#2563eb" max={chartMax} />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-zinc-600">{chartData[0]?.label}</span>
              <span className="text-[9px] text-zinc-600">{chartData[chartData.length - 1]?.label}</span>
            </div>
          </div>

          {/* Bakiye yükleme bar */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" />
              <span className="text-[11px] text-zinc-500">Müşteri Yüklemeleri</span>
            </div>
            <MiniBar data={chartData} field="topup" color="#8b5cf6" max={chartMaxTopup} />
          </div>
        </Card>

        {/* Son İşlemler */}
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock size={15} className="text-zinc-500" /> Son İşlemler
            </h2>
          </div>

          {/* Filtre */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {txTypes.map(t => (
              <button
                key={t}
                onClick={() => setTxFilter(t)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition ${txFilter === t ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-zinc-400'}`}
              >
                {t === 'all' ? 'Tümü' : (TYPE_LABELS[t]?.label || t)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredTx.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">İşlem bulunamadı</p>
            )}
            {filteredTx.map(tx => {
              const meta = TYPE_LABELS[tx.type] || { label: tx.type, color: 'text-zinc-400', bg: 'bg-white/[0.06]', icon: DollarSign }
              const TxIcon = meta.icon
              const isPositive = tx.amount > 0
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <TxIcon size={15} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">
                      {meta.label}
                      {tx.userName && <span className="text-zinc-500 font-normal"> · {tx.userName}</span>}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {tx.type === 'WITHDRAWAL' ? 'Para çekme talebi'
                        : tx.type === 'TOPUP' ? 'Bakiye yükleme'
                        : tx.type === 'EARNING' ? 'Usta kazancı'
                        : tx.type === 'REFUND' ? 'İade işlemi'
                        : tx.type === 'COUPON' ? 'Kupon indirimi'
                        : (tx.description || '—')
                      } · {new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} TL
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
        </>
        )}
      </div>
    </Layout>
  )
}
