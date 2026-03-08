import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Briefcase, MessageCircle, User, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const customerTabs = [
  { path: '/home', icon: Home, label: 'Ana Sayfa' },
  { path: '/my-jobs', icon: Briefcase, label: 'İşlerim' },
  { path: '/messages', icon: MessageCircle, label: 'Mesajlar', badgeKey: 'messages' },
  { path: '/profile', icon: User, label: 'Profil' },
]

const professionalTabs = [
  { path: '/professional', icon: Home, label: 'Ana Sayfa' },
  { path: '/my-jobs', icon: Briefcase, label: 'İşlerim' },
  { path: '/messages', icon: MessageCircle, label: 'Mesajlar', badgeKey: 'messages' },
  { path: '/profile', icon: User, label: 'Profil' },
]

const adminTabs = [
  { path: '/admin', icon: LayoutDashboard, label: 'Panel' },
  { path: '/admin/users', icon: User, label: 'Kullanıcılar' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-nav safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
            || (tab.path !== '/' && location.pathname.startsWith(tab.path))
          const Icon = tab.icon
          const badge = tab.badgeKey === 'messages' ? unreadMessages : 0

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={isActive ? 'text-primary-500' : 'text-gray-400'}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
