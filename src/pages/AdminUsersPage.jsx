import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapUsersFromBackend } from '../utils/fieldMapper'
import { LogOut, Trash2, Shield, AlertCircle, Loader, Star, Briefcase, Users, User, Headphones, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

const ROLE_FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'customer', label: 'Müşteri' },
  { key: 'professional', label: 'Usta' },
  { key: 'support', label: 'Destek' },
  { key: 'admin', label: 'Admin' },
]

const roleBadge = (role) => {
  const r = (role || '').toLowerCase()
  if (r === 'admin') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
      <Shield size={10} /> Admin
    </span>
  )
  if (r === 'professional' || r === 'usta') return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
      Usta
    </span>
  )
  if (r === 'support') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
      <Headphones size={10} /> Destek
    </span>
  )
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
      Müşteri
    </span>
  )
}

function AdminUsersPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [view, setView] = useState('users') // 'users' | 'ratings'

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS, { method: 'GET' })
      const raw = Array.isArray(res) ? res : res.data || []
      setUsers(mapUsersFromBackend(raw))
    } catch (err) {
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return
    try {
      setDeletingId(userId)
      await fetchAPI(API_ENDPOINTS.ADMIN.DELETE_USER(userId), { method: 'DELETE' })
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    if (roleFilter === 'all') return users
    return users.filter(u => {
      const r = (u.role || '').toLowerCase()
      if (roleFilter === 'professional') return r === 'professional' || r === 'usta'
      if (roleFilter === 'support') return r === 'support'
      if (roleFilter === 'admin') return r === 'admin'
      if (roleFilter === 'customer') return r === 'customer' || r === 'müşteri'
      return true
    })
  }, [users, roleFilter])

  // Ratings: top uses only rated>0, bottom includes all (0 rating = lowest)
  const allSortedDesc = useMemo(() =>
    [...users].sort((a, b) => (b.rating || 0) - (a.rating || 0))
  , [users])
  const topRated = allSortedDesc.filter(u => (u.rating || 0) > 0).slice(0, 3)
  const bottomRated = [...allSortedDesc].reverse().slice(0, 3)

  const counts = useMemo(() => ({
    all: users.length,
    customer: users.filter(u => { const r = (u.role||'').toLowerCase(); return r==='customer'||r==='müşteri' }).length,
    professional: users.filter(u => { const r = (u.role||'').toLowerCase(); return r==='professional'||r==='usta' }).length,
    support: users.filter(u => (u.role||'').toLowerCase()==='support').length,
    admin: users.filter(u => (u.role||'').toLowerCase()==='admin').length,
  }), [users])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628]">
      <PageHeader
        title="Kullanıcı Yönetimi"
        onBack={() => navigate('/admin')}
        rightAction={
          <button
            onClick={() => { logout(); navigate('/') }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <LogOut size={18} />
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Müşteri', count: counts.customer, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' },
            { label: 'Usta', count: counts.professional, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300' },
            { label: 'Destek', count: counts.support, color: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300' },
            { label: 'Admin', count: counts.admin, color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
              <p className="text-lg font-black">{s.count}</p>
              <p className="text-[10px] font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Top/Bottom rated summary */}
        {(topRated.length > 0 || bottomRated.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={14} className="text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">En Yüksek</p>
              </div>
              {topRated.length === 0
                ? <p className="text-xs text-slate-400 italic">Henüz puan yok</p>
                : topRated.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-2 py-1">
                    <span className="text-[10px] font-black text-slate-400 w-3">{i + 1}.</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{u.name}</p>
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                      <Star size={10} fill="currentColor" />{(u.rating || 0).toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown size={14} className="text-rose-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">En Düşük</p>
              </div>
              {bottomRated.map((u, i) => (
                <div key={u.id} className="flex items-center gap-2 py-1">
                  <span className="text-[10px] font-black text-slate-400 w-3">{i + 1}.</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{u.name}</p>
                  <span className="flex items-center gap-0.5 text-[11px] font-bold text-rose-400">
                    <Star size={10} fill={(u.rating||0) > 0 ? 'currentColor' : 'none'} />{(u.rating || 0).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-3">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-2">
          <button onClick={() => setView('users')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${view === 'users' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#1a2332] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.07]'}`}>
            <Users size={13} /> Kullanıcılar
          </button>
          <button onClick={() => setView('ratings')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${view === 'ratings' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#1a2332] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.07]'}`}>
            <BarChart2 size={13} /> Puan Listesi
          </button>
        </div>

        {/* Ratings view */}
        {view === 'ratings' && !loading && (
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Tüm Kullanıcılar — Puana Göre</p>
              <p className="text-[10px] text-slate-400">{allSortedDesc.length} kullanıcı</p>
            </div>
            {allSortedDesc.map((u, i) => {
              const rating = u.rating || 0
              const pct = (rating / 5) * 100
              return (
                <div key={u.id} className={`flex items-center gap-3 px-4 py-3 ${i !== allSortedDesc.length - 1 ? 'border-b border-slate-50 dark:border-white/[0.04]' : ''}`}>
                  <span className="text-xs font-black text-slate-400 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0 text-[11px] font-black text-slate-500 dark:text-slate-300">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{u.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${rating >= 4 ? 'bg-emerald-400' : rating >= 3 ? 'bg-amber-400' : rating > 0 ? 'bg-rose-400' : 'bg-slate-200 dark:bg-white/10'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold w-7 text-right flex-shrink-0 ${rating >= 4 ? 'text-emerald-500' : rating >= 3 ? 'text-amber-500' : rating > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {roleBadge(u.role)}
                </div>
              )
            })}
          </div>
        )}

        {/* Users list view */}
        {view === 'users' && (
          <>
        {/* Role filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {ROLE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                roleFilter === f.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#1a2332] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.07]'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-[10px] font-bold ${roleFilter === f.key ? 'opacity-70' : 'text-slate-400'}`}>
                {counts[f.key] ?? counts.all}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size={32} className="text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Kullanıcılar yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Kullanıcı bulunamadı" description="Bu kategoride kayıtlı kullanıcı yok." />
        ) : (
          <div className="space-y-2">
            {filtered.map((user) => (
              <div key={user.id} className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] shadow-sm p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  {user.profileImage
                    ? <img src={user.profileImage} className="w-10 h-10 rounded-xl object-cover" alt="" />
                    : <User size={18} className="text-slate-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
                    {roleBadge(user.role)}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Star size={11} className="text-amber-400" fill={user.rating > 0 ? 'currentColor' : 'none'} />
                      {(user.rating || 0).toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Briefcase size={11} className="text-slate-400" />
                      {user.jobCount || 0} iş
                    </span>
                  </div>
                </div>
                {(user.role || '').toLowerCase() !== 'admin' && (
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deletingId === user.id}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {deletingId === user.id
                      ? <Loader size={14} className="animate-spin" />
                      : <Trash2 size={16} />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminUsersPage
