import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Briefcase, MessageCircle, User, LayoutDashboard, Sparkles, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const customerTabs = [
  { path: '/home', icon: Home, label: 'Ana Sayfa' },
  { path: '/my-jobs', icon: Briefcase, label: 'İşlerim' },
  { type: 'action', path: '/create-job?mode=ai', label: 'AI Asistan' },
  { path: '/messages', icon: MessageCircle, label: 'Mesajlar', badgeKey: 'messages' },
  { path: '/profile', icon: User, label: 'Profil' },
]

const professionalTabs = [
  { path: '/professional', icon: Home, label: 'Ana Sayfa' },
  { path: '/my-jobs', icon: Briefcase, label: 'İşlerim' },
  { type: 'spacer' },
  { path: '/messages', icon: MessageCircle, label: 'Mesajlar', badgeKey: 'messages' },
  { path: '/profile', icon: User, label: 'Profil' },
]

const adminTabs = [
  { path: '/admin', icon: LayoutDashboard, label: 'Panel' },
  { path: '/admin/users', icon: User, label: 'Kullanıcılar' },
  { type: 'spacer' },
  { path: '/admin/jobs', icon: Briefcase, label: 'İşler' },
  { path: '/admin/messages', icon: MessageCircle, label: 'Mesajlar' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, getUnreadMessageCount } = useAuth()

  let userRole = user?.role?.toLowerCase()
  if (userRole === 'usta') userRole = 'professional'

  const tabs = userRole === 'admin' ? adminTabs
    : userRole === 'professional' ? professionalTabs
    : customerTabs

  const unreadMessages = getUnreadMessageCount?.() || 0

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="bg-white dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-[#2A2A2A] relative">
        {/* Center action button for customers */}
        {userRole === 'customer' && (
          <button
            onClick={() => navigate('/create-job?mode=ai')}
            className="absolute left-1/2 -translate-x-1/2 -top-3 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-[#0A66C2]/40 active:scale-90 transition-all z-10"
            style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #0D7AE8 50%, #3B9BF5 100%)' }}
          >
            <Sparkles size={24} strokeWidth={2} className="text-white drop-shadow-sm" />
          </button>
        )}

        {/* Center map button for professionals */}
        {userRole === 'professional' && (
          <button
            onClick={() => navigate('/professional/map')}
            className="absolute left-1/2 -translate-x-1/2 -top-3 w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/40 active:scale-90 transition-transform z-10"
          >
            <MapPin size={22} strokeWidth={2} className="text-white" />
          </button>
        )}

        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          {tabs.map((tab, i) => {
            if (tab.type === 'action') {
              return <div key="action" className="w-14" />
            }
            if (tab.type === 'spacer') {
              return <div key="spacer" className="w-14" />
            }

            const isActive = location.pathname === tab.path
              || (tab.path !== '/' && location.pathname.startsWith(tab.path))
            const Icon = tab.icon
            const badge = tab.badgeKey === 'messages' ? unreadMessages : 0

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={isActive ? 'text-primary-500' : 'text-gray-400'}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 ${isActive ? 'text-primary-500 font-semibold' : 'text-gray-400 font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
