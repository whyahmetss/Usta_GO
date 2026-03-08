import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

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
            <span className="text-sm text-gray-500">{unreadCount} okunmamış</span>
          ) : null
        }
      />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Henüz bildirim yok"
            description="İş oluşturulunca veya mesaj gelince bildirimler burada görünür"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <Card
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                padding="p-5"
                className={!notif.read ? 'border-l-4 border-l-primary-500' : ''}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{notif.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{notif.title}</h3>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                    <p className="text-xs text-gray-500">{formatTime(notif.time)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="w-full mt-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition"
          >
            Tümunü Okundu Olarak İşaretle
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
