import { Search, Bell, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Card from '../components/Card'

function HomePage() {
  const { user, getUnreadNotificationCount } = useAuth()
  const navigate = useNavigate()

  const unreadNotifs = getUnreadNotificationCount()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Günaydın'
    if (h < 18) return 'İyi Günler'
    return 'İyi Akşamlar'
  })()

  const categories = [
    { id: 'electric', name: 'Elektrik', icon: '⚡', active: true, path: '/create-job' },
    { id: 'plumbing', name: 'Tesisat', icon: '🔧', active: false },
    { id: 'renovation', name: 'Tadilat', icon: '🔨', active: false },
    { id: 'cleaning', name: 'Temizlik', icon: '🧹', active: false },
    { id: 'painting', name: 'Boyacı', icon: '🎨', active: false },
    { id: 'carpentry', name: 'Marangoz', icon: '🪚', active: false },
  ]

  const handleCategoryClick = (category) => {
    if (category.active && category.path) {
      navigate(category.path)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <p className="text-xs text-gray-400 font-medium">{greeting}</p>
              <h1 className="text-lg font-bold text-gray-900">{user?.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center relative transition-colors hover:bg-gray-100"
            >
              <Bell size={18} className="text-gray-600" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center transition-colors hover:bg-gray-100"
            >
              <Settings size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <button
          onClick={() => navigate('/create-job')}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-gray-200 shadow-card text-left"
        >
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-400">Hangi hizmete ihtiyacınız var?</span>
        </button>
      </div>

      {/* Promo Banner */}
      <div className="px-4 mb-6">
        <Card
          onClick={() => navigate('/create-job')}
          className="!bg-gradient-to-br from-primary-500 to-accent-500 !border-0 relative overflow-hidden"
          padding="p-5"
        >
          <div className="absolute right-3 top-3 opacity-20 text-6xl">👷</div>
          <div className="relative z-10">
            <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white mb-2">
              20% İndirim
            </span>
            <h2 className="text-xl font-bold text-white mb-1">İlk Siparişinizde!</h2>
            <p className="text-white/80 text-sm mb-3">Hemen ilan açın, profesyonel hizmet alın</p>
            <span className="inline-block px-5 py-2.5 bg-white text-primary-600 rounded-xl text-sm font-semibold shadow-sm">
              Hemen Başla
            </span>
          </div>
        </Card>
      </div>

      {/* Categories */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Kategoriler</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {categories.map(category => (
            <div key={category.id} className="relative">
              {!category.active && (
                <span className="coming-soon-badge">Yakında</span>
              )}
              <button
                onClick={() => handleCategoryClick(category)}
                disabled={!category.active}
                className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  category.active
                    ? 'bg-white border border-gray-100 shadow-card hover:shadow-card-hover active:scale-95'
                    : 'bg-gray-100/60 blur-card'
                }`}
              >
                <span className="text-3xl">{category.icon}</span>
                <span className={`text-xs font-semibold ${category.active ? 'text-gray-700' : 'text-gray-400'}`}>
                  {category.name}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomePage
