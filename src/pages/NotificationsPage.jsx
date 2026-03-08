import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MessageCircle, Briefcase, CheckCircle, XCircle, Rocket, Star, Coins, Sparkles, PlusCircle, Trash2, Archive, Pin, PinOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

const ICON_MAP = {
  message: { Icon: MessageCircle, bg: 'bg-blue-500/15', color: 'text-blue-400' },
  bell: { Icon: Bell, bg: 'bg-amber-500/15', color: 'text-amber-400' },
  check: { Icon: CheckCircle, bg: 'bg-emerald-500/15', color: 'text-emerald-400' },
  cancel: { Icon: XCircle, bg: 'bg-rose-500/15', color: 'text-rose-400' },
  rocket: { Icon: Rocket, bg: 'bg-violet-500/15', color: 'text-violet-400' },
  party: { Icon: Sparkles, bg: 'bg-emerald-500/15', color: 'text-emerald-400' },
  star: { Icon: Star, bg: 'bg-amber-500/15', color: 'text-amber-400' },
  coins: { Icon: Coins, bg: 'bg-emerald-500/15', color: 'text-emerald-400' },
  sparkle: { Icon: Sparkles, bg: 'bg-primary-500/15', color: 'text-primary-400' },
  new: { Icon: PlusCircle, bg: 'bg-blue-500/15', color: 'text-blue-400' },
  job: { Icon: Briefcase, bg: 'bg-primary-500/15', color: 'text-primary-400' },
}

function NotifIcon({ type }) {
  const entry = ICON_MAP[type] || ICON_MAP.bell
  const { Icon, bg, color } = entry
  return (
    <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className={color} strokeWidth={1.8} />
    </div>
  )
}

function SwipeableNotif({ notif, onPress, onDelete, onArchive, onPin, onUnpin, isPinned, formatTime, NotifIcon }) {
  const [swipe, setSwipe] = useState(0)
  const startX = useRef(0)

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX - swipe
  }
  const handleTouchMove = (e) => {
    const x = e.touches[0].clientX - startX.current
    setSwipe(Math.max(0, Math.min(140, x)))
  }
  const handleTouchEnd = () => {
    setSwipe(swipe > 70 ? 120 : 0)
  }

  const actionW = 120
  return (
    <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] mb-2">
      <div className="relative flex" style={{ overflow: 'hidden' }}>
        {/* Actions behind (left - sag kaydirinca acilir) */}
        <div className="absolute left-0 top-0 bottom-0 flex" style={{ width: actionW }}>
          <button
            onClick={() => { isPinned ? onUnpin(notif.id) : onPin(notif.id); setSwipe(0) }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-w-[40px] active:opacity-80 ${isPinned ? 'bg-primary-500 text-white' : 'bg-gray-600 text-white'}`}
          >
            {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
            <span className="text-[10px] font-medium">{isPinned ? 'Coz' : 'Sabitle'}</span>
          </button>
          <button
            onClick={() => { onArchive(notif.id); setSwipe(0) }}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-amber-500 text-white min-w-[40px] active:bg-amber-600"
          >
            <Archive size={18} />
            <span className="text-[10px] font-medium">Arsivle</span>
          </button>
          <button
            onClick={() => { onDelete(notif.id); setSwipe(0) }}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-rose-500 text-white min-w-[40px] active:bg-rose-600"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-medium">Sil</span>
          </button>
        </div>
        {/* Card - saga kaydirinca sol butonlar acilir */}
        <div
          onClick={() => onPress(notif)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 flex items-start gap-3 p-4 cursor-pointer active:bg-gray-200/50 dark:active:bg-white/5 transition-colors min-w-0 relative z-10 bg-white dark:bg-[#141414]"
          style={{ transform: `translateX(${swipe}px)` }}
        >
          <NotifIcon type={notif.icon || notif.type} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{notif.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isPinned && <Pin size={12} className="text-primary-500" fill="currentColor" />}
                {!notif.read && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">{notif.message}</p>
            <p className="text-[10px] text-gray-400">{formatTime(notif.time)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsPage() {
  const navigate = useNavigate()
  const {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
    archiveNotification,
    pinNotification,
    unpinNotification,
    notifPinned = [],
  } = useAuth()

  const notifications = getUserNotifications()
  const unreadCount = notifications.filter(n => !n.read).length
  const pinnedIds = new Set(notifPinned)

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
      if (notif.type === 'message') navigate(`/messages/${notif.jobId}`)
      else navigate(`/job/${notif.jobId}`)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-[#0c0c0c] min-h-screen">
      <PageHeader
        title="Bildirimler"
        onBack={() => navigate(-1)}
        rightAction={
          unreadCount > 0 ? (
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{unreadCount} okunmamis</span>
          ) : null
        }
      />

      <div className="px-4 py-5 max-w-lg mx-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Henuz bildirim yok"
            description="Is olusturulunca veya mesaj gelince bildirimler burada gorunur. Saga kaydirarak Sil, Arsivle veya Sabitle yapabilirsiniz."
          />
        ) : (
          <div className="space-y-0">
            {notifications.map(notif => (
              <SwipeableNotif
                key={notif.id}
                notif={notif}
                onPress={handleNotificationClick}
                onDelete={removeNotification}
                onArchive={archiveNotification}
                onPin={pinNotification}
                onUnpin={unpinNotification}
                isPinned={pinnedIds.has(notif.id)}
                formatTime={formatTime}
                NotifIcon={NotifIcon}
              />
            ))}
          </div>
        )}

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="w-full mt-6 py-3.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-semibold hover:opacity-90 active:scale-[0.98] transition"
          >
            Tumunu Okundu Isaretle
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
