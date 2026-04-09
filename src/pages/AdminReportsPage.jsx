import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Download, FileSpreadsheet, FileText, Calendar, DollarSign,
  Users, Briefcase, TrendingUp, RefreshCw, Filter, BarChart2,
} from 'lucide-react'

function exportCSV(filename, headers, rows) {
  const BOM = '\uFEFF'
  const csv = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReportsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [transactions, setTransactions] = useState([])
  const [generating, setGenerating] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [usersRes, jobsRes, txRes] = await Promise.allSettled([
        fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS),
        fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?limit=5000`),
        fetchAPI(`${API_ENDPOINTS.WALLET.ADMIN_TRANSACTIONS}?limit=10000`),
      ])
      setUsers(usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data) ? usersRes.value.data : [])
      const jRaw = jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : []
      setJobs(mapJobsFromBackend(jRaw))
      setTransactions(txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data) ? txRes.value.data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const reports = [
    {
      id: 'monthly-revenue',
      title: 'Aylik Gelir Raporu',
      desc: 'Ay bazinda ciro, komisyon ve islem sayilari',
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-400',
      generate: () => {
        const monthly = {}
        jobs.filter(j => j.status === 'completed' || j.status === 'rated').forEach(j => {
          const d = new Date(j.createdAt || j.date)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          if (!monthly[key]) monthly[key] = { revenue: 0, count: 0, commission: 0 }
          const amt = Number(j.budget) || Number(j.price) || 0
          monthly[key].revenue += amt
          monthly[key].commission += amt * 0.12
          monthly[key].count++
        })
        const rows = Object.entries(monthly).sort().map(([month, d]) => [
          month, d.count.toString(), d.revenue.toFixed(2), d.commission.toFixed(2)
        ])
        exportCSV('aylik-gelir-raporu.csv', ['Ay', 'Is Sayisi', 'Ciro (TL)', 'Komisyon (TL)'], rows)
      }
    },
    {
      id: 'usta-performance',
      title: 'Usta Performans Raporu',
      desc: 'Tum ustalarin is, tamamlama, iptal ve puan istatistikleri',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-400',
      generate: () => {
        const ustaMap = {}
        const ustaUsers = users.filter(u => u.role === 'USTA' || u.role === 'professional')
        ustaUsers.forEach(u => {
          ustaMap[u.id] = { name: u.name, email: u.email, phone: u.phone || '', jobs: 0, completed: 0, cancelled: 0, totalRating: 0, ratingCount: 0, revenue: 0 }
        })
        jobs.forEach(j => {
          const uid = j.professionalId || j.professional?.id
          if (!uid || !ustaMap[uid]) return
          ustaMap[uid].jobs++
          if (j.status === 'completed' || j.status === 'rated') { ustaMap[uid].completed++; ustaMap[uid].revenue += Number(j.budget) || Number(j.price) || 0 }
          if (j.status === 'cancelled') ustaMap[uid].cancelled++
          if (j.rating) { ustaMap[uid].totalRating += j.rating; ustaMap[uid].ratingCount++ }
        })
        const rows = Object.values(ustaMap).map(u => [
          u.name, u.email, u.phone, u.jobs.toString(), u.completed.toString(), u.cancelled.toString(),
          u.ratingCount > 0 ? (u.totalRating / u.ratingCount).toFixed(1) : '-',
          u.revenue.toFixed(2),
        ])
        exportCSV('usta-performans-raporu.csv', ['Ad', 'E-posta', 'Telefon', 'Toplam Is', 'Tamamlanan', 'Iptal', 'Ort. Puan', 'Ciro (TL)'], rows)
      }
    },
    {
      id: 'all-jobs',
      title: 'Tum Isler Raporu',
      desc: 'Tum islerin detayli listesi (tarih, durum, fiyat, musteri, usta)',
      icon: Briefcase,
      color: 'bg-violet-500/10 text-violet-400',
      generate: () => {
        const rows = jobs.map(j => [
          j.id,
          j.title || '',
          j.category || j.serviceCategory || '',
          j.status || '',
          (Number(j.budget) || Number(j.price) || 0).toFixed(2),
          j.customer?.name || '',
          j.professional?.name || '',
          j.createdAt ? new Date(j.createdAt).toLocaleString('tr-TR') : '',
          j.rating ? j.rating.toString() : '',
        ])
        exportCSV('tum-isler-raporu.csv', ['ID', 'Baslik', 'Kategori', 'Durum', 'Fiyat (TL)', 'Musteri', 'Usta', 'Tarih', 'Puan'], rows)
      }
    },
    {
      id: 'all-transactions',
      title: 'Islem Gecmisi Raporu',
      desc: 'Tum cuzdan islemleri (yukleme, odeme, cekim, iade)',
      icon: TrendingUp,
      color: 'bg-amber-500/10 text-amber-400',
      generate: () => {
        const rows = transactions.map(t => [
          t.id,
          t.type || '',
          (Number(t.amount) || 0).toFixed(2),
          t.description || '',
          t.userId || '',
          t.createdAt ? new Date(t.createdAt).toLocaleString('tr-TR') : '',
        ])
        exportCSV('islem-gecmisi-raporu.csv', ['ID', 'Tur', 'Tutar (TL)', 'Aciklama', 'Kullanici ID', 'Tarih'], rows)
      }
    },
    {
      id: 'users-list',
      title: 'Kullanici Listesi',
      desc: 'Tum kullanicilarin bilgileri (ad, rol, e-posta, kayit tarihi)',
      icon: Users,
      color: 'bg-teal-500/10 text-teal-400',
      generate: () => {
        const rows = users.map(u => [
          u.id, u.name || '', u.email || '', u.phone || '', u.role || '', u.status || '',
          u.createdAt ? new Date(u.createdAt).toLocaleString('tr-TR') : '',
        ])
        exportCSV('kullanici-listesi.csv', ['ID', 'Ad', 'E-posta', 'Telefon', 'Rol', 'Durum', 'Kayit Tarihi'], rows)
      }
    },
    {
      id: 'category-revenue',
      title: 'Kategori Bazli Ciro',
      desc: 'Hizmet kategorilerine gore ciro ve is sayilari',
      icon: BarChart2,
      color: 'bg-rose-500/10 text-rose-400',
      generate: () => {
        const catMap = {}
        jobs.filter(j => j.status === 'completed' || j.status === 'rated').forEach(j => {
          const cat = j.category || j.serviceCategory || 'Diger'
          if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0 }
          catMap[cat].count++
          catMap[cat].revenue += Number(j.budget) || Number(j.price) || 0
        })
        const rows = Object.entries(catMap).sort((a,b) => b[1].revenue - a[1].revenue)
          .map(([cat, d]) => [cat, d.count.toString(), d.revenue.toFixed(2)])
        exportCSV('kategori-ciro-raporu.csv', ['Kategori', 'Is Sayisi', 'Ciro (TL)'], rows)
      }
    },
  ]

  const handleGenerate = async (report) => {
    setGenerating(report.id)
    try {
      report.generate()
    } catch (e) {
      console.error(e)
      alert('Rapor olusturulurken hata: ' + e.message)
    }
    setTimeout(() => setGenerating(null), 800)
  }

  if (loading) {
    return (
      <Layout hideNav>
        <PageHeader title="Raporlar" onBack={() => navigate('/admin')} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideNav>
      <PageHeader title="Raporlama & Export" onBack={() => navigate('/admin')} />
      <div className="max-w-6xl mx-auto px-4 pb-10">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
          {[
            { label: 'Kullanici', value: users.length, color: 'bg-blue-500/10 text-blue-400' },
            { label: 'Is', value: jobs.length, color: 'bg-emerald-500/10 text-emerald-400' },
            { label: 'Islem', value: transactions.length, color: 'bg-amber-500/10 text-amber-400' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
              <p className="text-lg font-black">{s.value.toLocaleString('tr-TR')}</p>
              <p className="text-[10px] font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reports.map(r => {
            const Icon = r.icon
            const isGen = generating === r.id
            return (
              <div key={r.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">{r.title}</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{r.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleGenerate(r)}
                  disabled={isGen}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.98]"
                >
                  {isGen ? (
                    <><RefreshCw size={13} className="animate-spin" /> Olusturuluyor...</>
                  ) : (
                    <><Download size={13} /> CSV Indir</>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
