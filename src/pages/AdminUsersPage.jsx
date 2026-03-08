import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapUsersFromBackend } from '../utils/fieldMapper'
import { LogOut, Trash2, Shield, AlertCircle, Loader, Star, Briefcase } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

function AdminUsersPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchAPI(API_ENDPOINTS.ADMIN.GET_USERS, {
        method: 'GET'
      })
      const raw = Array.isArray(res) ? res : res.data || []
      setUsers(mapUsersFromBackend(raw))
    } catch (err) {
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      try {
        setDeletingId(userId)
        setError(null)
        await fetchAPI(API_ENDPOINTS.ADMIN.DELETE_USER(userId), { method: 'DELETE' })
        setUsers(prev => prev.filter(u => u.id !== userId))
        setDeletingId(null)
      } catch (err) {
        setError(err.message)
        setDeletingId(null)
      }
    }
  }

  const roleBadge = (role) => {
    if (role === 'admin') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700">
        <Shield size={12} /> Admin
      </span>
    )
    if (role === 'professional') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary-50 text-primary-700">
        Usta
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent-50 text-accent-700">
        Müşteri
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Kullanıcı Yönetimi"
        onBack={() => navigate('/admin')}
        rightAction={
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <LogOut size={18} />
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <p className="text-xs text-gray-500 font-medium px-1">Toplam {users.length} kullanıcı</p>

        {error && (
          <Card className="!border-amber-200 !bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700">Uyarı</p>
                <p className="text-xs text-amber-600 mt-0.5">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader size={32} className="text-primary-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">Kullanıcılar yükleniyor...</p>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Henüz kullanıcı yok"
            description="Kayıtlı kullanıcılar burada listelenir."
          />
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {user.avatar || '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      {roleBadge(user.role)}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Briefcase size={12} className="text-gray-400" />
                        <span>{user.completedJobs || 0} iş</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star size={12} className="text-amber-400" />
                        <span>{user.rating || 0}</span>
                      </div>
                    </div>
                  </div>
                  {user.role !== 'admin' && user.role !== 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deletingId === user.id}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {deletingId === user.id
                        ? <Loader size={14} className="animate-spin" />
                        : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsersPage
