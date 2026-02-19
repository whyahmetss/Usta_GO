import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Send } from 'lucide-react'

function AdminMessagesPage() {
  const navigate = useNavigate()
  const [sendMode, setSendMode] = useState('all') // all, professionals, customers, individual
  const [selectedUser, setSelectedUser] = useState('')
  const [messageText, setMessageText] = useState('')
  const [users, setUsers] = useState([])
  const [sentMessages, setSentMessages] = useState([])

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')
    setUsers(savedUsers.filter(u => u.role !== 'admin'))

    const savedMessages = JSON.parse(localStorage.getItem('adminMessages') || '[]')
    setSentMessages(savedMessages)
  }, [])

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      alert('Mesaj yazın!')
      return
    }

    let targetUsers = []

    if (sendMode === 'all') {
      targetUsers = users
    } else if (sendMode === 'professionals') {
      targetUsers = users.filter(u => u.role === 'professional')
    } else if (sendMode === 'customers') {
      targetUsers = users.filter(u => u.role === 'customer')
    } else if (sendMode === 'individual') {
      if (!selectedUser) {
        alert('Kullanıcı seçin!')
        return
      }
      targetUsers = [users.find(u => u.id === selectedUser)]
    }

    // Create message for each target user
    const newMessages = targetUsers.map(user => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      targetUserId: user.id,
      targetUserName: user.name,
      targetUserEmail: user.email,
      targetUserRole: user.role,
      message: messageText,
      sentAt: new Date().toISOString(),
      read: false
    }))

    // Save messages
    const allMessages = [...sentMessages, ...newMessages]
    localStorage.setItem('adminMessages', JSON.stringify(allMessages))
    setSentMessages(allMessages)

    // Add notifications to each user
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    const newNotifications = newMessages.map(msg => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: 'admin_message',
      title: '📢 Admin Mesajı',
      message: messageText,
      targetUserId: msg.targetUserId,
      read: false,
      time: new Date().toISOString()
    }))

    localStorage.setItem('notifications', JSON.stringify([...notifications, ...newNotifications]))

    alert(`Mesaj ${targetUsers.length} kullanıcıya gönderildi!`)
    setMessageText('')
    setSelectedUser('')
    setSendMode('all')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Mesaj Sistemi</h1>
            <p className="text-sm text-gray-500">Kullanıcılara toplu veya bireysel mesaj gönderin</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Send Message Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Mesaj Gönder</h2>

          {/* Send Mode Selection */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { id: 'all', label: 'Tüm Kullanıcılar', icon: '👥' },
              { id: 'professionals', label: 'Sadece Ustalar', icon: '⚡' },
              { id: 'customers', label: 'Sadece Müşteriler', icon: '👤' },
              { id: 'individual', label: 'Bireysel', icon: '💬' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setSendMode(mode.id)}
                className={`p-4 rounded-xl border-2 transition ${
                  sendMode === mode.id
                    ? 'bg-purple-100 border-purple-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{mode.icon}</div>
                <p className={`text-xs font-bold ${sendMode === mode.id ? 'text-purple-600' : 'text-gray-600'}`}>
                  {mode.label}
                </p>
              </button>
            ))}
          </div>

          {/* Individual User Selection */}
          {sendMode === 'individual' && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">Kullanıcı Seç</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Kullanıcı Seçin --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role === 'professional' ? 'Usta' : 'Müşteri'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">Mesaj Yazısı</label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Lütfen mesajınızı yazın..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-2">{messageText.length} karakter</p>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Send size={20} /> Mesaj Gönder
          </button>
        </div>

        {/* Sent Messages History */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Gönderilen Mesajlar ({sentMessages.length})</h2>

          {sentMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600">Henüz mesaj gönderilmedi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentMessages.slice().reverse().map((msg, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{msg.targetUserName}</p>
                      <p className="text-xs text-gray-500">{msg.targetUserEmail}</p>
                      <p className="text-xs text-gray-500">
                        {msg.targetUserRole === 'professional' ? '⚡ Usta' : '👤 Müşteri'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs px-2 py-1 rounded font-bold ${
                        msg.read ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {msg.read ? '✅ Okundu' : '📨 Gönderildi'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.sentAt).toLocaleDateString('tr-TR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mt-3 p-3 bg-white rounded border border-gray-200">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMessagesPage
