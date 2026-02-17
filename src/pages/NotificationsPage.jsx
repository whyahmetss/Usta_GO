import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function NotificationsPage() {
  const navigate = useNavigate()

  // Mock bildirimler (backend'e bağlanınca gerçek olacak)
  const notifications = [
    {
      id: 1,
      type: 'job',
      title: 'Yeni İş Talebi',
      message: 'Kadıköy bölgesinde elektrik arızası işi',
      time: '5 dk önce',
      read: false,
      icon: '⚡'
    },
    {
      id: 2,
      type: 'message',
      title: 'Yeni Mesaj',
      message: 'Ahmet Yılmaz: "Yoldayım, 10 dakikaya varırım"',
      time: '15 dk önce',
      read: false,
      icon: '💬'
    },
    {
      id: 3,
      type: 'rating',
      title: 'Yeni Değerlendirme',
      message: 'Mehmet Demir size 5 yıldız verdi!',
      time: '1 saat önce',
      read: true,
      icon: '⭐'
    },
    {
      id: 4,
      type: 'status',
      title: 'İş Durumu Değişti',
      message: 'Avize montajı işi tamamlandı',
      time: '2 saat önce',
      read: true,
      icon: '✅'
    }
  ]

  const unreadCount = notifications.filter(n => !n.read).length

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
              <p className="text-white/80 text-sm">{unreadCount} okunmamış bildirim</p>
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
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div 
                key={notif.id}
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
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                    <p className="text-xs text-gray-500">{notif.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
            Tümünü Okundu Olarak İşaretle
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
