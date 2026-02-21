import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { ArrowLeft, LogOut, Trash2, Shield, AlertCircle, Loader } from 'lucide-react'

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
      // TODO: Replace with actual admin endpoint when available
      // For now, trying GET /api/users as placeholder
      const res = await fetchAPI('/users', {
        method: 'GET'
      })
      setUsers(Array.isArray(res) ? res : res.data || [])
    } catch (err) {
      setError(err.message)
      // Fallback to empty array if endpoint not available yet
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
        // TODO: Use DELETE /api/users/:id when admin endpoint is available
        // For now, placeholder implementation
        alert('Kullanıcı silme özelliği yakında etkinleştirilecektir.')
        setDeletingId(null)
      } catch (err) {
        setError(err.message)
        setDeletingId(null)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="w-10 h-10 hover:bg-gray-100 rounded-lg flex items-center justify-center transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
              <p className="text-sm text-gray-500">Toplam {savedUsers.length} kullanıcı</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
          >
            <LogOut size={18} /> Çıkış
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-yellow-700">Uyarı</p>
              <p className="text-sm text-yellow-600">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader size={40} className="mx-auto mb-3 text-blue-600 animate-spin" />
              <p className="text-gray-600 font-semibold">Kullanıcılar yükleniyor...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-gray-600 font-semibold">Henüz kullanıcı yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Ad</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">E-posta</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Rol</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Tamamlanan İş</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Puan</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{user.avatar || '👤'}</span>
                          <span className="font-semibold text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' && (
                            <>
                              <Shield size={16} className="text-purple-600" />
                              <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">
                                Admin
                              </span>
                            </>
                          )}
                          {user.role === 'professional' && (
                            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                              Usta
                            </span>
                          )}
                          {user.role === 'customer' && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                              Müşteri
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.completedJobs || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.rating || 0}⭐</td>
                      <td className="px-6 py-4 text-sm">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingId === user.id}
                            className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} /> {deletingId === user.id ? 'Siliniyor...' : 'Sil'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
