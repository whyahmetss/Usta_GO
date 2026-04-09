import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Send, Loader, Users, Zap, User, MessageSquare, Inbox } from 'lucide-react'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { emitEvent } from '../utils/socket'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'

function AdminMessagesPage() {
  const navigate = useNavigate()
  const [sendMode, setSendMode] = useState('all')
  const [selectedUser, setSelectedUser] = useState('')
  const [messageText, setMessageText] = useState('')
  const [subject, setSubject] = useState('')
  const [users, setUsers] = useState([])
  const [sentMessages, setSentMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const adminGetUsers = API_ENDPOINTS?.ADMIN?.GET_USERS ?? '/admin/users?limit=500'

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const response = await fetchAPI(adminGetUsers)
        if (response.data && Array.isArray(response.data)) {
          const filtered = response.data.filter(u => u.role !== 'ADMIN')
          setUsers(filtered)
        }
      } catch (err) {
        console.error('Load users error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [adminGetUsers])

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert('Mesaj yazın!')
      return
    }

    let targetUsers = []

    if (sendMode === 'all') {
      targetUsers = users
    } else if (sendMode === 'professionals') {
      targetUsers = users.filter(u => u.role === 'USTA')
    } else if (sendMode === 'customers') {
      targetUsers = users.filter(u => u.role === 'CUSTOMER')
    } else if (sendMode === 'individual') {
      if (!selectedUser) {
        alert('Kullanıcı seçin!')
        return
      }
      const found = users.find(u => u.id === selectedUser)
      if (found) targetUsers = [found]
    }

    if (targetUsers.length === 0) {
      alert('Hedef kullanıcı bulunamadı!')
      return
    }

    setSending(true)
    let successCount = 0
    const newMessages = []

    for (const target of targetUsers) {
      try {
        const finalContent = subject.trim()
          ? `${subject.trim()}\n${messageText.trim()}`
          : messageText.trim()
        const res = await fetchAPI(API_ENDPOINTS?.MESSAGES?.SEND ?? '/messages', {
          method: 'POST',
          body: { receiverId: target.id, content: finalContent }
        })
        const saved = res?.data || res
        emitEvent('send_message', { receiverId: target.id, message: saved })
        successCount++
        newMessages.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          targetUserId: target.id,
          targetUserName: target.name,
          targetUserEmail: target.email,
          targetUserRole: target.role,
          message: messageText,
          sentAt: new Date().toISOString(),
        })
      } catch (err) {
        console.error(`Message failed for user ${target.id}:`, err)
      }
    }

    setSentMessages(prev => [...prev, ...newMessages])
    setSending(false)
    alert(`Mesaj ${successCount} kullanıcıya gönderildi!`)
    setSubject('')
    setMessageText('')
    setSelectedUser('')
    setSendMode('all')
  }

  const roleLabel = (role) => {
    if (role === 'USTA') return 'Usta'
    if (role === 'CUSTOMER') return 'Müşteri'
    return role
  }

  const modeOptions = [
    { id: 'all', label: 'Tüm Kullanıcılar', icon: Users },
    { id: 'professionals', label: 'Ustalar', icon: Zap },
    { id: 'customers', label: 'Müşteriler', icon: User },
    { id: 'individual', label: 'Bireysel', icon: MessageSquare }
  ]

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Mesaj Gönder"
        onBack={() => navigate('/admin')}
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Send Message */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Mesaj Gönder</h2>

          {loading ? (
            <div className="flex flex-col items-center py-8">
              <Loader size={28} className="text-blue-500 animate-spin mb-3" />
              <p className="text-xs text-zinc-500">Kullanıcılar yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {modeOptions.map(mode => {
                  const ModeIcon = mode?.icon || Inbox
                  return (
                  <button
                    key={mode.id}
                    onClick={() => setSendMode(mode.id)}
                    className={`p-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
                      sendMode === mode.id
                        ? 'bg-blue-500/10 border-blue-500'
                        : 'bg-white/[0.04] border-white/[0.06]'
                    }`}
                  >
                    <div className="mb-1"><ModeIcon size={20} /></div>
                    <p className={`text-[11px] font-semibold ${sendMode === mode.id ? 'text-blue-400' : 'text-zinc-400'}`}>
                      {mode.label}
                    </p>
                  </button>
                )})}
              </div>

              {/* Individual user picker */}
              {sendMode === 'individual' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Kullanıcı Seç</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  >
                    <option value="">-- Kullanıcı Seçin --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {roleLabel(user.role)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject input */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Konu Başlığı <span className="text-zinc-600 font-normal">(bildirim başlığı olur)</span></label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: Kampanya Duyurusu, Önemli Bilgi..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  maxLength={80}
                />
              </div>

              {/* Message textarea */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Mesaj</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                  rows={5}
                />
                <p className="text-[11px] text-zinc-600 mt-1">{messageText.length} karakter</p>
              </div>

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={sending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {sending ? 'Gönderiliyor...' : 'Mesaj Gönder'}
              </button>
            </>
          )}
        </Card>

        {/* Sent Messages History */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 px-1">
            Gönderilen Mesajlar ({sentMessages.length})
          </h2>

          {sentMessages.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Henüz mesaj gönderilmedi"
              description="Gönderdiğiniz mesajlar burada görünür."
            />
          ) : (
            <div className="space-y-3">
              {sentMessages.slice().reverse().map((msg, idx) => (
                <Card key={idx}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{msg.targetUserName}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{msg.targetUserEmail}</p>
                      <p className="text-[11px] text-zinc-600">{roleLabel(msg.targetUserRole)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Gönderildi
                      </span>
                      <p className="text-[11px] text-zinc-600 mt-1">
                        {new Date(msg.sentAt).toLocaleDateString('tr-TR', {
                          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 bg-white/[0.04] p-3 rounded-xl">{msg.message}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMessagesPage
