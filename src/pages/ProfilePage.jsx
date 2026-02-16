import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, LogOut, User, Mail, Phone, Star, Briefcase, Settings } from 'lucide-react'

function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      logout()
      navigate('/')
    }
  }

  const stats = user?.role === 'professional' ? [
    { label: 'Tamamlanan İş', value: user?.completedJobs || 0, icon: Briefcase },
    { label: 'Ortalama Puan', value: user?.rating || '0.0', icon: Star },
  ] : [
    { label: 'Tamamlanan İş', value: '0', icon: Briefcase },
    { label: 'Harcanan', value: '₺0', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-20 pt-4 px-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {/* Avatar */}
        <div className="text-center">
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
            <span className="text-5xl">{user?.avatar || '👤'}</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">{user?.name}</h1>
          <p className="text-white/80 text-sm">
            {user?.role === 'professional' ? '⚡ Usta' : '👤 Müşteri'}
          </p>
        </div>
      </div>

      {/* Profile Info Cards */}
      <div className="px-4 -mt-12">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-lg">
                <Icon size={20} className="text-blue-600 mb-2" />
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <h3 className="font-bold text-gray-900 mb-4">Hesap Bilgileri</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User size={20} className="text-gray-600" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Ad Soyad</p>
                <p className="font-semibold text-gray-900">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail size={20} className="text-gray-600" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">E-posta</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone size={20} className="text-gray-600" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Telefon</p>
                  <p className="font-semibold text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
          <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-900">Ayarlar</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg hover:bg-red-600 transition mb-20"
        >
          <LogOut size={20} />
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}

export default ProfilePage
