import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Bildirimler</h1>
            {unreadCount > 0 && (
              <p className="text-white/80 text-sm">{unreadCount} Okunmamış Bildirimler</p>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-600 font-semibold">Henüz bildirim yok</p>
            <p className="text-gray-400 text-sm mt-2">İş oluşturulunca veya mesaj gelince bildirimler burada görünür</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`bg-white rounded-2xl p-5 shadow-lg cursor-pointer hover:shadow-xl transition ${
                  !notif.read ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{notif.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-gray-900">{notif.title}</h3>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                    <p className="text-xs text-gray-500">{formatTime(notif.time)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Tümunü Okundu Olarak İşaretle
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
