import { useNavigate } from 'react-router-dom'
import { Bell, MessageCircle, Briefcase, CheckCircle, XCircle, Rocket, Star, Coins, Sparkles, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

const ICON_MAP = {
  message: { Icon: MessageCircle, bg: 'bg-blue-50', color: 'text-blue-500' },
  bell: { Icon: Bell, bg: 'bg-amber-50', color: 'text-amber-500' },
  check: { Icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-500' },
  cancel: { Icon: XCircle, bg: 'bg-rose-50', color: 'text-rose-500' },
  rocket: { Icon: Rocket, bg: 'bg-violet-50', color: 'text-violet-500' },
  party: { Icon: Sparkles, bg: 'bg-emerald-50', color: 'text-emerald-500' },
  star: { Icon: Star, bg: 'bg-amber-50', color: 'text-amber-500' },
  coins: { Icon: Coins, bg: 'bg-emerald-50', color: 'text-emerald-500' },
  sparkle: { Icon: Sparkles, bg: 'bg-primary-50', color: 'text-primary-500' },
  new: { Icon: PlusCircle, bg: 'bg-blue-50', color: 'text-blue-500' },
  job: { Icon: Briefcase, bg: 'bg-primary-50', color: 'text-primary-500' },
}

function NotifIcon({ type }) {
  const entry = ICON_MAP[type] || ICON_MAP.bell
  const { Icon, bg, color } = entry
  return (
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon size={20} className={color} />
    </div>
  )
}

function NotificationsPage() {
  const navigate = useNavigate()
  const { getUserNotifications, markNotificationRead, markAllNotificationsRead } = useAuth()

  const notifications = getUserNotifications()
  const unreadCount = notifications.filter(n => !n.read).length

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Simdi'
    if (diffMin < 60) return `${diffMin} dk once`
    if (diffHour < 24) return `${diffHour} saat once`
    if (diffDay < 7) return `${diffDay} gun once`
    return date.toLocaleDateString('tr-TR')
  }

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id)
    if (notif.jobId) {
      if (notif.type === 'message') {
        navigate(`/messages/${notif.jobId}`)
      } else {
        navigate(`/job/${notif.jobId}`)
      }
    }
  }

  return (
    <div className="bg-gray-50">
      <PageHeader
        title="Bildirimler"
        onBack={() => navigate(-1)}
        rightAction={
          unreadCount > 0 ? (
            <span className="text-sm text-gray-500">{unreadCount} okunmamis</span>
          ) : null
        }
      />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Henuz bildirim yok"
            description="Is olusturulunca veya mesaj gelince bildirimler burada gorunur"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <Card
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                padding="p-4"
                className={!notif.read ? 'border-l-4 border-l-primary-500' : ''}
              >
                <div className="flex items-start gap-3">
                  <NotifIcon type={notif.icon || notif.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900 text-sm">{notif.title}</h3>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{notif.message}</p>
                    <p className="text-[10px] text-gray-400">{formatTime(notif.time)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="w-full mt-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
          >
            Tumunu Okundu Olarak Isaretle
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
