import { Search, Bell, Settings, Zap, Wrench, Hammer, Sparkles, Paintbrush, Axe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

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
    { id: 'electric', name: 'Elektrik', Icon: Zap, active: true, path: '/create-job', bgColor: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { id: 'plumbing', name: 'Tesisat', Icon: Wrench, active: false, bgColor: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'renovation', name: 'Tadilat', Icon: Hammer, active: false, bgColor: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { id: 'cleaning', name: 'Temizlik', Icon: Sparkles, active: false, bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'painting', name: 'Boyacı', Icon: Paintbrush, active: false, bgColor: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { id: 'carpentry', name: 'Marangoz', Icon: Axe, active: false, bgColor: 'bg-yellow-50', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-700' },
  ]

  return (
    <div className="bg-white dark:bg-[#0c0c0c] min-h-screen">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <Logo size="xs" />
              )}
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium leading-none mb-0.5">{greeting}</p>
              <h1 className="text-[15px] font-semibold text-gray-900 leading-tight">{user?.name || 'Müşteri'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center relative"
            >
              <Bell size={18} strokeWidth={1.8} className="text-gray-700" />
              {unreadNotifs > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"
            >
              <Settings size={18} strokeWidth={1.8} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Search */}
        <button
          onClick={() => navigate('/create-job')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 text-left"
        >
          <Search size={18} strokeWidth={1.8} className="text-gray-400 flex-shrink-0" />
          <span className="text-[13px] text-gray-400">Hangi hizmete ihtiyacınız var?</span>
        </button>
      </div>

      {/* Promo Card */}
      <div className="px-5 mb-5">
        <div
          onClick={() => navigate('/create-job')}
          className="bg-gray-900 rounded-3xl p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950 rounded-3xl" />
          <div className="absolute right-4 bottom-3 opacity-[0.06]">
            <Zap size={80} />
          </div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[11px] font-semibold text-emerald-400 mb-3 tracking-wide">
              %20 İNDİRİM
            </span>
            <h2 className="text-lg font-bold text-white mb-1 leading-snug">İlk Siparişinizde!</h2>
            <p className="text-gray-400 text-[13px] mb-4">Hemen ilan açın, profesyonel hizmet alın</p>
            <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-[13px] font-semibold">
              Hemen Başla
            </span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Kategoriler</h3>
          <span className="text-[12px] text-gray-400">Tümü</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {categories.map(category => {
            const CatIcon = category.Icon
            return (
              <button
                key={category.id}
                onClick={() => category.active && category.path && navigate(category.path)}
                disabled={!category.active}
                className={`relative rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition-all aspect-square ${
                  category.active
                    ? `${category.bgColor} active:scale-95`
                    : 'bg-gray-50 opacity-50'
                }`}
              >
                {!category.active && (
                  <span className="absolute top-2 right-2 bg-gray-900/70 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                    Yakında
                  </span>
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${category.active ? category.iconBg : 'bg-gray-100'}`}>
                  <CatIcon size={24} className={category.active ? category.iconColor : 'text-gray-400'} />
                </div>
                <span className={`text-[12px] font-medium ${category.active ? 'text-gray-700' : 'text-gray-400'}`}>
                  {category.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default HomePage
