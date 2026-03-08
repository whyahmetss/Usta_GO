import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react'
import { getSocket, emitEvent } from '../utils/socket'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

function MessagesPage() {
  const { jobId: paramJobId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedJobId, setSelectedJobId] = useState(paramJobId || null)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)

  const [userJobs, setUserJobs] = useState([])
  const [jobMessages, setJobMessages] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const loadUserJobs = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
        if (response.data && Array.isArray(response.data)) {
          const mapped = mapJobsFromBackend(response.data)
          const filtered = user?.role === 'customer'
            ? mapped.filter(j => j.customer?.id === user.id && j.status !== 'pending' && j.status !== 'cancelled')
            : mapped.filter(j => j.professional?.id === user?.id && j.status !== 'pending' && j.status !== 'cancelled')
          setUserJobs(filtered)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (user) loadUserJobs()
  }, [user])

  useEffect(() => {
    const loadJobMessages = async () => {
      if (!selectedJobId || userJobs.length === 0) {
        setJobMessages([])
        setSelectedJob(null)
        return
      }
      try {
        setLoadingMessages(true)
        const job = userJobs.find(j => j.id === selectedJobId)
        if (!job) return
        setSelectedJob(job)
        const otherPersonId = user?.role === 'customer' ? job.professional?.id : job.customer?.id
        if (otherPersonId) {
          const response = await fetchAPI(API_ENDPOINTS.MESSAGES.GET_CONVERSATION(otherPersonId))
          if (response.data && Array.isArray(response.data)) {
            setJobMessages(response.data)
            const toMark = response.data.filter(m => m.receiverId === user?.id && !m.isRead)
            toMark.forEach(m => {
              fetchAPI(API_ENDPOINTS.MESSAGES.MARK_READ(m.id), { method: 'PATCH' })
                .then(() => {
                  setJobMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg))
                })
                .catch(() => {})
            })
          }
        }
      } catch (err) {
        console.error('Load messages error:', err)
      } finally {
        setLoadingMessages(false)
      }
    }
    loadJobMessages()
  }, [selectedJobId, userJobs, user])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [jobMessages.length])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleReceiveMessage = (message) => {
      if (selectedJobId) {
        setJobMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev
          return [...prev, message]
        })
        if (message?.receiverId === user?.id && !message?.isRead) {
          fetchAPI(API_ENDPOINTS.MESSAGES.MARK_READ(message.id), { method: 'PATCH' })
            .then(() => {
              setJobMessages(prev => prev.map(m => m.id === message.id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m))
            })
            .catch(() => {})
        }
      }
    }
    const handleMessageRead = (payload) => {
      const { messageId, readAt } = payload || {}
      if (!messageId) return
      setJobMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true, readAt: readAt || new Date().toISOString() } : m))
    }
    socket.on('receive_message', handleReceiveMessage)
    socket.on('message_read', handleMessageRead)
    return () => {
      socket.off('receive_message', handleReceiveMessage)
      socket.off('message_read', handleMessageRead)
    }
  }, [selectedJobId, user?.id])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && selectedJobId && userJobs.length > 0) {
        const job = userJobs.find(j => j.id === selectedJobId)
        if (!job) return
        const otherPersonId = user?.role === 'customer' ? job.professional?.id : job.customer?.id
        if (otherPersonId) {
          try {
            const response = await fetchAPI(API_ENDPOINTS.MESSAGES.GET_CONVERSATION(otherPersonId))
            if (response.data && Array.isArray(response.data)) setJobMessages(response.data)
          } catch (err) { console.error('Refetch messages error:', err) }
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [selectedJobId, userJobs, user])

  const handleSend = async () => {
    if (!messageText.trim() || !selectedJobId || isSending) return
    const otherPersonId = user?.role === 'customer'
      ? selectedJob?.professional?.id
      : selectedJob?.customer?.id
    if (!otherPersonId) { alert("Alıcı bilgisi bulunamadı!"); return }
    const messageToSend = messageText.trim()
    setMessageText('')
    setIsSending(true)
    try {
      const response = await fetchAPI(API_ENDPOINTS.MESSAGES.SEND, {
        method: 'POST',
        body: { jobId: selectedJobId, content: messageToSend, receiverId: otherPersonId }
      })
      if (response.data) {
        setJobMessages(prev => [...prev, response.data])
        emitEvent('send_message', { receiverId: otherPersonId, message: response.data })
      }
    } catch (err) {
      setMessageText(messageToSend)
      alert(`Mesaj gönderilemedi: ${err.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSendQuickMessage = async (text) => {
    if (!text.trim() || !selectedJobId || isSending) return
    const otherPersonId = user?.role === 'customer'
      ? selectedJob?.professional?.id
      : selectedJob?.customer?.id
    if (!otherPersonId) { alert("Alıcı bilgisi bulunamadı!"); return }
    setIsSending(true)
    try {
      const response = await fetchAPI(API_ENDPOINTS.MESSAGES.SEND, {
        method: 'POST',
        body: { content: text.trim(), receiverId: otherPersonId }
      })
      if (response.data) {
        setJobMessages(prev => [...prev, response.data])
        emitEvent('send_message', { receiverId: otherPersonId, message: response.data })
      }
    } catch (err) {
      alert(`Mesaj gönderilemedi: ${err.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const quickMessages = user?.role === 'professional'
    ? ['Yoldayım, 10 dk', 'Malzeme almam gerekiyor', 'İş tamamlandı', 'Gecikeceğim']
    : ['Ne zaman geleceksiniz?', 'Teşekkürler', 'Kolay ulaşabilir misiniz?', 'İptal etmek istiyorum']

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  // Job list view
  if (!selectedJobId) {
    return (
      <div>
        <PageHeader title="Mesajlar" onBack={false} />
        <div className="px-4 py-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-rose-500 text-sm mb-3">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">
                Yenile
              </button>
            </div>
          ) : userJobs.length === 0 ? (
            <EmptyState icon="💬" title="Henüz mesaj yok" description="İş kabul edildikten sonra mesajlaşabilirsiniz" />
          ) : (
            <div className="space-y-2">
              {userJobs.map(job => {
                const otherPerson = user.role === 'customer' ? job.professional : job.customer
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card cursor-pointer hover:shadow-card-hover transition-all flex items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {otherPerson?.avatar || '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{otherPerson?.name || 'Bilinmiyor'}</h3>
                      <p className="text-xs text-gray-400 truncate">{job.title}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const otherPerson = user?.role === 'customer' ? selectedJob?.professional : selectedJob?.customer
  const ChevronRight2 = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center gap-3 h-14 px-4">
          <button
            onClick={() => setSelectedJobId(null)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors -ml-1"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            {otherPerson?.avatar || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">{otherPerson?.name || 'Bilinmiyor'}</h2>
            <p className="text-[11px] text-gray-400 truncate">{selectedJob?.title}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {loadingMessages ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-400">Mesajlar yükleniyor...</p>
          </div>
        ) : jobMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">Henüz mesaj yok. İlk mesajı gönderin!</p>
          </div>
        ) : (
          jobMessages.map(msg => {
            const isMe = msg.senderId === user?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl ${
                  isMe
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-white text-gray-900 rounded-bl-md border border-gray-100 shadow-card'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content || msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/50' : 'text-gray-300'}`}>
                    <span className="text-[10px]">{formatTime(msg.createdAt || msg.timestamp)}</span>
                    {isMe && (msg.isRead ? <CheckCheck size={12} /> : <Check size={12} />)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-4 py-2 overflow-x-auto flex gap-2 flex-shrink-0 scrollbar-hide">
        {quickMessages.map((qm, idx) => (
          <button key={idx} onClick={() => handleSendQuickMessage(qm)} disabled={isSending}
            className="px-3 py-2 bg-white border border-gray-200 rounded-full text-[11px] font-medium text-gray-600 whitespace-nowrap hover:bg-gray-50 transition disabled:opacity-50">
            {qm}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın..."
            disabled={isSending}
            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm disabled:opacity-50"
          />
          <button onClick={handleSend} disabled={!messageText.trim() || isSending}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
              messageText.trim() && !isSending ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-100 text-gray-300'
            }`}>
            {isSending ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
