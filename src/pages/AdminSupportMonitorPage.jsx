import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import {
  Headphones, Loader, RefreshCw, Star, User, Zap,
  MessageCircle, CheckCircle2, Clock, BarChart2,
} from 'lucide-react'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'

function RatingStars({ rating, size = 12 }) {
  const r = Number(rating) || 0
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size} className={s <= r ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}
          fill={s <= r ? 'currentColor' : 'none'} />
      ))}
    </div>
  )
}

export default function AdminSupportMonitorPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview') // 'overview' | 'sessions'
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAPI(API_ENDPOINTS.SUPPORT_SESSIONS.ALL)
      setData(res?.data || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sessions = data?.sessions || []
  const agentStats = data?.agentStats || []

  const filteredSessions = sessions.filter(s => {
    const statusOk = statusFilter === 'all' || s.status === statusFilter
    const agentOk = selectedAgent === 'all' || s.agentId === selectedAgent
    return statusOk && agentOk
  })

  const totalOpen = sessions.filter(s => s.status === 'OPEN').length
  const totalClosed = sessions.filter(s => s.status === 'CLOSED').length
  const ratedSessions = sessions.filter(s => s.rating != null)
  const overallAvg = ratedSessions.length > 0
    ? (ratedSessions.reduce((a, b) => a + b.rating, 0) / ratedSessions.length).toFixed(1)
    : '—'

  return (
    <Layout hideNav>
      <PageHeader title="Canlı Destek Takibi" onBack={() => navigate('/admin')} />

      <div className="max-w-lg mx-auto px-4 pb-10">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 mb-5">
          {[
            { label: 'Toplam', value: sessions.length, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' },
            { label: 'Açık', value: totalOpen, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
            { label: 'Kapalı', value: totalClosed, color: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300' },
            { label: 'Ort. Puan', value: overallAvg, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[10px] font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab toggle */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setTab('overview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold transition ${tab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-[#1a2332] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.07]'}`}>
            <BarChart2 size={14} /> Temsilciler
          </button>
          <button onClick={() => setTab('sessions')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold transition ${tab === 'sessions' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-[#1a2332] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.07]'}`}>
            <MessageCircle size={14} /> Oturumlar
          </button>
          <button onClick={load} disabled={loading}
            className="w-10 h-10 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/[0.07] rounded-2xl flex items-center justify-center flex-shrink-0">
            <RefreshCw size={15} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <Loader size={28} className="text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Yükleniyor...</p>
          </div>
        ) : tab === 'overview' ? (
          /* Agent cards */
          <div className="space-y-3">
            {agentStats.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-10 text-center">
                <Headphones size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">Henüz oturum yok</p>
              </div>
            ) : agentStats.map(a => (
              <div key={a.agent.id} className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-white font-black text-lg">
                    {a.agent.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{a.agent.name}</p>
                    <p className="text-xs text-slate-500 truncate">{a.agent.email}</p>
                    {a.avgRating && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <RatingStars rating={a.avgRating} />
                        <span className="text-xs font-bold text-amber-500">{a.avgRating}</span>
                        <span className="text-[10px] text-slate-400">({a.ratings.length} puan)</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-0 border-t border-slate-100 dark:border-white/[0.05]">
                  {[
                    { label: 'Toplam', value: a.total, color: 'text-slate-700 dark:text-slate-200' },
                    { label: 'Açık', value: a.open, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Kapalı', value: a.closed, color: 'text-slate-500' },
                  ].map((s, i) => (
                    <div key={s.label} className={`p-3 text-center ${i < 2 ? 'border-r border-slate-100 dark:border-white/[0.05]' : ''}`}>
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Sessions list */
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {[{ k: 'all', l: 'Tümü' }, { k: 'OPEN', l: 'Açık' }, { k: 'CLOSED', l: 'Kapalı' }].map(f => (
                <button key={f.k} onClick={() => setStatusFilter(f.k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${statusFilter === f.k ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-slate-400'}`}>
                  {f.l}
                </button>
              ))}
              {agentStats.length > 1 && (
                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-slate-400">
                  <option value="all">Tüm Temsilciler</option>
                  {agentStats.map(a => (
                    <option key={a.agent.id} value={a.agent.id}>{a.agent.name}</option>
                  ))}
                </select>
              )}
            </div>

            <p className="text-xs text-slate-500">{filteredSessions.length} oturum</p>

            {filteredSessions.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-8 text-center">
                <MessageCircle size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">Oturum bulunamadı</p>
              </div>
            ) : filteredSessions.map(s => (
              <div key={s.id} className={`bg-white dark:bg-[#1a2332] rounded-2xl border shadow-sm overflow-hidden ${
                s.status === 'OPEN' ? 'border-emerald-200 dark:border-emerald-500/30' : 'border-slate-200 dark:border-white/[0.07]'
              }`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                        {s.status === 'OPEN' ? '● Açık' : '✓ Kapalı'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">{new Date(s.openedAt).toLocaleString('tr-TR')}</p>
                      {s.closedAt && <p className="text-[10px] text-slate-400">{new Date(s.closedAt).toLocaleString('tr-TR')}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-blue-50 dark:bg-blue-500/[0.07] border border-blue-100 dark:border-blue-500/20 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <User size={11} className="text-blue-500" />
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Kullanıcı</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{s.user?.name || '—'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{s.user?.role}</p>
                    </div>
                    <div className="bg-teal-50 dark:bg-teal-500/[0.07] border border-teal-100 dark:border-teal-500/20 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Headphones size={11} className="text-teal-500" />
                        <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Temsilci</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{s.agent?.name || '—'}</p>
                    </div>
                  </div>

                  {s.rating != null && (
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl p-2.5">
                      <RatingStars rating={s.rating} size={13} />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{s.rating}/5</span>
                      {s.ratingNote && <span className="text-xs text-slate-500 truncate">"{s.ratingNote}"</span>}
                    </div>
                  )}
                </div>

                {s.status === 'OPEN' && (
                  <div className="px-4 pb-3">
                    <button onClick={() => navigate(`/support/chat/${s.userId}`)}
                      className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                      <MessageCircle size={12} /> Sohbeti Görüntüle
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
