import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import {
  Star, Briefcase, DollarSign, Clock, Award, AlertTriangle,
  FileText, MapPin, Phone, Mail, Calendar, CheckCircle, XCircle,
  TrendingUp, Shield, User, ChevronRight, ExternalLink,
} from 'lucide-react'

function StatMini({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon size={13} />
      </div>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  )
}

export default function AdminUstaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [usta, setUsta] = useState(null)
  const [jobs, setJobs] = useState([])
  const [transactions, setTransactions] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, jobsRes, txRes, certsRes] = await Promise.allSettled([
        fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
        fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=2000`),
        fetchAPI(`${API_ENDPOINTS.WALLET.ADMIN_TRANSACTIONS}?limit=5000`),
        fetchAPI(API_ENDPOINTS.CERTIFICATES.ADMIN_LIST),
      ])

      const allUsers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data) ? usersRes.value.data : []
      const foundUsta = allUsers.find(u => u.id === id)
      setUsta(foundUsta || null)

      const allJobsRaw = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : []
      const allJobs = mapJobsFromBackend(allJobsRaw)
      const ustaJobs = allJobs.filter(j => (j.professionalId || j.professional?.id) === id)
      setJobs(ustaJobs)

      const allTx = txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data) ? txRes.value.data : []
      setTransactions(allTx.filter(t => t.userId === id))

      const allCerts = certsRes.status === 'fulfilled' && Array.isArray(certsRes.value?.data) ? certsRes.value.data : []
      setCertificates(allCerts.filter(c => c.userId === id))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fmtTL = (n) => `${(n || 0).toLocaleString('tr-TR')} TL`

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Usta Detay" onBack={() => navigate('/admin/users')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!usta) {
    return (
      <Layout hideNav>
        <PageHeader title="Usta Detay" onBack={() => navigate('/admin/users')} />
        <div className="min-h-[40vh] flex items-center justify-center">
          <p className="text-sm text-zinc-500">Usta bulunamadi</p>
        </div>
      </Layout>
    )
  }

  // Computed stats
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'rated')
  const cancelledJobs = jobs.filter(j => j.status === 'cancelled')
  const totalRevenue = completedJobs.reduce((s, j) => s + (Number(j.budget) || Number(j.price) || 0), 0)
  const ratings = jobs.filter(j => j.rating).map(j => j.rating)
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '\u2014'
  const completionRate = jobs.length > 0 ? ((completedJobs.length / jobs.length) * 100).toFixed(0) : '0'
  const cancelRate = jobs.length > 0 ? ((cancelledJobs.length / jobs.length) * 100).toFixed(0) : '0'

  // Earnings from transactions
  const totalEarnings = transactions.filter(t => t.type === 'EARNING').reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0)
  const totalWithdrawn = transactions.filter(t => t.type === 'WITHDRAWAL').reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0)

  const tabs = [
    { key: 'overview', label: 'Genel' },
    { key: 'jobs', label: `Isler (${jobs.length})` },
    { key: 'earnings', label: 'Kazanc' },
    { key: 'certificates', label: `Belgeler (${certificates.length})` },
  ]

  return (
    <Layout hideNav>
      <PageHeader title="Usta Detay" onBack={() => navigate('/admin/users')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Profile Header */}
        <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 mt-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
              {usta.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-white truncate">{usta.name}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  usta.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400'
                  : usta.status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {usta.status === 'ACTIVE' ? 'Aktif' : usta.status === 'PENDING_APPROVAL' ? 'Onay Bekliyor' : usta.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                {usta.email && <span className="flex items-center gap-1"><Mail size={11} /> {usta.email}</span>}
                {usta.phone && <span className="flex items-center gap-1"><Phone size={11} /> {usta.phone}</span>}
                {usta.createdAt && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(usta.createdAt).toLocaleDateString('tr-TR')}</span>}
              </div>
              {avgRating !== '\u2014' && (
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={s <= Math.round(Number(avgRating)) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
                  ))}
                  <span className="text-sm font-bold text-amber-400 ml-1">{avgRating}</span>
                  <span className="text-[11px] text-zinc-500">({ratings.length} degerlendirme)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatMini label="Toplam Is" value={jobs.length} icon={Briefcase} color="bg-blue-500/10 text-blue-400" />
          <StatMini label="Tamamlama" value={`${completionRate}%`} icon={CheckCircle} color="bg-emerald-500/10 text-emerald-400" />
          <StatMini label="Iptal Orani" value={`${cancelRate}%`} icon={XCircle} color={Number(cancelRate) > 20 ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400'} />
          <StatMini label="Toplam Ciro" value={fmtTL(totalRevenue)} icon={DollarSign} color="bg-amber-500/10 text-amber-400" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                tab === t.key ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Performans Ozeti</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Kazanc</p>
                  <p className="text-base font-bold text-emerald-400">{fmtTL(totalEarnings)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Cekilen</p>
                  <p className="text-base font-bold text-rose-400">{fmtTL(totalWithdrawn)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Tamamlanan Is</p>
                  <p className="text-base font-bold text-white">{completedJobs.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 mb-1">Iptal Edilen</p>
                  <p className="text-base font-bold text-white">{cancelledJobs.length}</p>
                </div>
              </div>
            </div>

            {/* Recent reviews */}
            <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Son Degerlendirmeler</h3>
              {jobs.filter(j => j.rating).length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-4">Henuz degerlendirme yok</p>
              ) : (
                <div className="space-y-2">
                  {jobs.filter(j => j.rating).slice(0, 5).map(j => (
                    <div key={j.id} className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-zinc-300 truncate">{j.customer?.name || 'Musteri'}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} className={s <= j.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
                          ))}
                        </div>
                      </div>
                      {j.ratingReview && <p className="text-[11px] text-zinc-500">"{j.ratingReview}"</p>}
                      <p className="text-[10px] text-zinc-600 mt-1">{j.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div className="space-y-2">
            {jobs.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-600">Is bulunamadi</div>
            ) : jobs.map(j => (
              <div key={j.id} className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{j.title}</p>
                  <p className="text-[10px] text-zinc-500">{j.customer?.name} - {new Date(j.createdAt || j.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-emerald-400">{j.price ?? j.budget} TL</p>
                  <StatusBadge status={j.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'earnings' && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-600">Islem bulunamadi</div>
            ) : transactions.slice(0, 50).map(t => (
              <div key={t.id} className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  t.type === 'EARNING' ? 'bg-emerald-500/10' : t.type === 'WITHDRAWAL' ? 'bg-rose-500/10' : 'bg-blue-500/10'
                }`}>
                  <DollarSign size={14} className={
                    t.type === 'EARNING' ? 'text-emerald-400' : t.type === 'WITHDRAWAL' ? 'text-rose-400' : 'text-blue-400'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{t.type === 'EARNING' ? 'Kazanc' : t.type === 'WITHDRAWAL' ? 'Cekim' : t.type}</p>
                  <p className="text-[10px] text-zinc-600">{new Date(t.createdAt).toLocaleString('tr-TR')}</p>
                </div>
                <p className={`text-sm font-bold ${Number(t.amount) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Number(t.amount) >= 0 ? '+' : ''}{Number(t.amount).toLocaleString('tr-TR')} TL
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'certificates' && (
          <div className="space-y-2">
            {certificates.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-600">Belge bulunamadi</div>
            ) : certificates.map(c => (
              <div key={c.id} className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">Sertifika</p>
                  <p className="text-[10px] text-zinc-600">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  c.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400'
                  : c.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-amber-500/10 text-amber-400'
                }`}>{c.status}</span>
                {c.fileUrl && (
                  <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
