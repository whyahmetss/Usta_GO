import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapUsersFromBackend } from '../utils/fieldMapper'
import { LogOut, Trash2, Shield, AlertCircle, Loader, Star, Briefcase, Users, User, Headphones, TrendingUp, TrendingDown } from 'lucide-react'
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

  // Top/bottom rated (only users with rating > 0)
  const ratedUsers = useMemo(() =>
    [...users].filter(u => (u.rating || 0) > 0).sort((a, b) => b.rating - a.rating)
  , [users])
  const topRated = ratedUsers.slice(0, 3)
  const bottomRated = [...ratedUsers].reverse().slice(0, 3)

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

        {/* Top/Bottom rated */}
        {ratedUsers.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={14} className="text-emerald-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">En Yüksek Puan</p>
              </div>
              {topRated.map((u, i) => (
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
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">En Düşük Puan</p>
              </div>
              {bottomRated.map((u, i) => (
                <div key={u.id} className="flex items-center gap-2 py-1">
                  <span className="text-[10px] font-black text-slate-400 w-3">{i + 1}.</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{u.name}</p>
                  <span className="flex items-center gap-0.5 text-[11px] font-bold text-rose-400">
                    <Star size={10} fill="currentColor" />{(u.rating || 0).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Card className="!border-amber-200 !bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600">{error}</p>
            </div>
          </Card>
        )}

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
              {f.key !== 'all' && counts[f.key] > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold ${roleFilter === f.key ? 'opacity-70' : 'text-slate-400'}`}>
                  {counts[f.key]}
                </span>
              )}
              {f.key === 'all' && (
                <span className={`ml-1.5 text-[10px] font-bold ${roleFilter === f.key ? 'opacity-70' : 'text-slate-400'}`}>
                  {counts.all}
                </span>
              )}
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
      </div>
    </div>
  )
}

export default AdminUsersPage
