import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { useAuth } from '../context/AuthContext'
import { connectSocket, joinSupportRoom } from '../utils/socket'
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
        <Star key={s} size={size} className={s <= r ? 'text-amber-400' : 'text-zinc-700'}
          fill={s <= r ? 'currentColor' : 'none'} />
      ))}
    </div>
  )
}

export default function AdminSupportMonitorPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
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

  useEffect(() => {
    if (!user?.id) return
    const socket = connectSocket(user.id)
    joinSupportRoom()
    const onUpdate = () => load()
    socket.on('new_support_session', onUpdate)
    socket.on('support_new_message', onUpdate)
    return () => {
      socket.off('new_support_session', onUpdate)
      socket.off('support_new_message', onUpdate)
    }
  }, [user, load])

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

      <div className="max-w-6xl mx-auto px-4 pb-10">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 mb-5">
          {[
            { label: 'Toplam', value: sessions.length, color: 'bg-blue-500/10 text-blue-400' },
            { label: 'Açık', value: totalOpen, color: 'bg-emerald-500/10 text-emerald-400' },
            { label: 'Kapalı', value: totalClosed, color: 'bg-white/[0.06] text-zinc-300' },
            { label: 'Ort. Puan', value: overallAvg, color: 'bg-amber-500/10 text-amber-400' },
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold transition ${tab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'}`}>
            <BarChart2 size={14} /> Temsilciler
          </button>
          <button onClick={() => setTab('sessions')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold transition ${tab === 'sessions' ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'}`}>
            <MessageCircle size={14} /> Oturumlar
          </button>
          <button onClick={load} disabled={loading}
            className="w-10 h-10 bg-zinc-900 border border-white/[0.06] rounded-2xl flex items-center justify-center flex-shrink-0">
            <RefreshCw size={15} className={`text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <Loader size={28} className="text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-zinc-500">Yükleniyor...</p>
          </div>
        ) : tab === 'overview' ? (
          /* Agent cards */
          <div className="space-y-3">
            {agentStats.length === 0 ? (
              <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-10 text-center">
                <Headphones size={32} className="text-zinc-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-zinc-500">Henüz oturum yok</p>
              </div>
            ) : agentStats.map(a => (
              <div key={a.agent.id} className="bg-zinc-900 rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-white font-black text-lg">
                    {a.agent.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{a.agent.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{a.agent.email}</p>
                    {a.avgRating && (
                      <div className="flex items-center gap-1.5 mt-1 group/tip relative">
                        <RatingStars rating={a.avgRating} />
                        <span className="text-xs font-bold text-amber-500">{a.avgRating}</span>
                        <span className="text-[10px] text-zinc-500">({a.ratings.length} puan)</span>
                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover/tip:block z-10">
                          <div className="bg-zinc-800 border border-white/[0.1] rounded-lg px-3 py-2 text-[10px] text-zinc-400 whitespace-nowrap shadow-xl">
                            Musteri degerlendirmelerinin ortalamasi (1-5 yildiz)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-0 border-t border-white/[0.06]">
                  {[
                    { label: 'Toplam', value: a.total, color: 'text-white' },
                    { label: 'Açık', value: a.open, color: 'text-emerald-400' },
                    { label: 'Kapalı', value: a.closed, color: 'text-zinc-400' },
                  ].map((s, i) => (
                    <div key={s.label} className={`p-3 text-center ${i < 2 ? 'border-r border-white/[0.06]' : ''}`}>
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{s.label}</p>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${statusFilter === f.k ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'}`}>
                  {f.l}
                </button>
              ))}
              {agentStats.length > 1 && (
                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-white/[0.06] text-zinc-400">
                  <option value="all">Tüm Temsilciler</option>
                  {agentStats.map(a => (
                    <option key={a.agent.id} value={a.agent.id}>{a.agent.name}</option>
                  ))}
                </select>
              )}
            </div>

            <p className="text-xs text-zinc-500">{filteredSessions.length} oturum</p>

            {filteredSessions.length === 0 ? (
              <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-8 text-center">
                <MessageCircle size={28} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-500">Oturum bulunamadı</p>
              </div>
            ) : filteredSessions.map(s => (
              <div key={s.id} className={`bg-zinc-900 rounded-2xl border overflow-hidden ${
                s.status === 'OPEN' ? 'border-emerald-500/30' : 'border-white/[0.06]'
              }`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.06] text-zinc-400'}`}>
                        {s.status === 'OPEN' ? '● Açık' : '✓ Kapalı'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-600">{new Date(s.openedAt).toLocaleString('tr-TR')}</p>
                      {s.closedAt && <p className="text-[10px] text-zinc-600">{new Date(s.closedAt).toLocaleString('tr-TR')}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <User size={11} className="text-blue-400" />
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Kullanıcı</p>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{s.user?.name || '—'}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{s.user?.role}</p>
                    </div>
                    <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Headphones size={11} className="text-teal-400" />
                        <p className="text-[10px] font-bold text-teal-400 uppercase">Temsilci</p>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{s.agent?.name || '—'}</p>
                    </div>
                  </div>

                  {s.rating != null && (
                    <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl p-2.5">
                      <RatingStars rating={s.rating} size={13} />
                      <span className="text-xs font-bold text-amber-400">{s.rating}/5</span>
                      {s.ratingNote && <span className="text-xs text-zinc-500 truncate">"{s.ratingNote}"</span>}
                    </div>
                  )}
                </div>

                <div className="px-4 pb-3">
                  <button onClick={() => navigate(`/support/chat/${s.userId}?agentId=${s.agentId}`)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      s.status === 'OPEN'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/[0.06] text-zinc-400'
                    }`}>
                    <MessageCircle size={12} /> Sohbeti Görüntüle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
