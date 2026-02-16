import { useState } from 'react'
import { Search, Bell, Menu, Home, Briefcase, MessageSquare, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import HamburgerMenu from '../components/HamburgerMenu'
function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [showMenu, setShowMenu] = useState(false)

  const categories = [
    {
      id: 'electric',
      name: 'Elektrikçi',
      icon: '⚡',
      color: 'from-yellow-400 to-orange-500',
      active: true,
      path: '/services/electric'
    },
    {
      id: 'plumbing',
      name: 'Tesisatçı',
      icon: '🔧',
      color: 'from-blue-400 to-blue-600',
      active: false
    },
    {
      id: 'renovation',
      name: 'Tadilat',
      icon: '🔨',
      color: 'from-orange-400 to-red-500',
      active: false
    },
    {
      id: 'cleaning',
      name: 'Temizlik',
      icon: '🧹',
      color: 'from-purple-400 to-pink-500',
      active: false
    },
    {
      id: 'painting',
      name: 'Boyacı',
      icon: '🎨',
      color: 'from-green-400 to-teal-500',
      active: false
    },
    {
      id: 'carpentry',
      name: 'Marangoz',
      icon: '🪚',
      color: 'from-amber-400 to-yellow-600',
      active: false
    }
  ]

  const handleCategoryClick = (category) => {
    if (category.active && category.path) {
      navigate(category.path)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Mavi Gradient */}
      <div className="blue-gradient-bg pb-6">
        <div className="px-4 pt-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black text-white">UG</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Usta Go</h1>
                <p className="text-white/70 text-xs">Merhaba, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Search size={20} className="text-white" />
              </button>
              <button
                onClick={() => navigate('/notifications')}
                className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center relative"
              >
                <Bell size={20} className="text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
              </button>
              <button
                onClick={() => setShowMenu(true)}
                className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
              >
                <Menu size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Promo Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-6 relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 opacity-20">
              <span className="text-8xl">👷</span>
            </div>
            <div className="relative z-10">
              <div className="inline-block px-3 py-1 bg-white/30 backdrop-blur rounded-full mb-2">
                <span className="text-white font-bold text-sm">🔥 20% İndirim</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                İlk Siparişinizde!
              </h2>
              <p className="text-white/90 mb-4 text-sm">
                Hemen kayıt olun, profesyonel hizmet alın
              </p>
              <button className="px-6 py-3 bg-white text-orange-600 rounded-xl font-bold shadow-lg hover:scale-105 transition">
                Hemen Başla
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Hangi hizmete ihtiyacınız var?"
              className="w-full px-5 py-4 rounded-2xl bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/30 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kategoriler */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Kategoriler</h3>
          <button className="text-blue-600 font-semibold text-sm">Tümünü Gör →</button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {categories.map(category => (
            <div key={category.id} className="relative">
              {!category.active && (
                <span className="coming-soon-badge">Yakında</span>
              )}
              <button
                onClick={() => handleCategoryClick(category)}
                disabled={!category.active}
                className={`w-full aspect-square rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition ${category.active
                  ? `bg-gradient-to-br ${category.color} hover:scale-105 active:scale-95 shadow-lg`
                  : 'bg-gray-200 blur-card'
                  }`}
              >
                <span className="text-4xl">{category.icon}</span>
                <span className={`text-sm font-bold ${category.active ? 'text-white' : 'text-gray-600'}`}>
                  {category.name}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Popüler Ustalar */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Popüler Ustalar</h3>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">Ahmet Yılmaz</h4>
              <p className="text-sm text-gray-600">Elektrik Ustası</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm font-bold">4.9</span>
                <span className="text-xs text-gray-500">(127 değerlendirme)</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
              İncele
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 shadow-xl">
        <div className="flex items-center justify-around">
          <button
            onClick={() => navigate('/home')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'
              }`}
          >
            <Home size={24} />
            <span className="text-xs font-semibold">Ana Sayfa</span>
          </button>
          <button
            onClick={() => navigate('/my-jobs')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'jobs' ? 'text-blue-600' : 'text-gray-400'
              }`}
          >
            <Briefcase size={24} />
            <span className="text-xs font-semibold">İşlerim</span>
          </button>
          <button
            onClick={() => navigate('/messages')}
            className={`flex flex-col items-center gap-1 relative ${activeTab === 'messages' ? 'text-blue-600' : 'text-gray-400'
              }`}
          >
            <MessageSquare size={24} />
            <span className="text-xs font-semibold">Mesajlar</span>
            <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              5
            </span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'
              }`}
          >
            <User size={24} />
            <span className="text-xs font-semibold">Profil</span>
          </button>
        </div>
      </div>
      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  )
}

export default HomePage
