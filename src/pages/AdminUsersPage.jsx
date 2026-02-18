import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, LogOut, Trash2, Shield } from 'lucide-react'

function AdminUsersPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDeleteUser = (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      const updatedUsers = savedUsers.filter(u => u.id !== userId)
      localStorage.setItem('users', JSON.stringify(updatedUsers))
      window.location.reload()
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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {savedUsers.length === 0 ? (
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
                  {savedUsers.map((user, idx) => (
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
                            className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold text-xs"
                          >
                            <Trash2 size={14} /> Sil
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
