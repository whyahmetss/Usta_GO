import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, Send, Check, CheckCheck, User, MessageCircle, ChevronRight, Phone, MoreVertical } from 'lucide-react'
import { getSocket, emitEvent } from '../utils/socket'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'

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
    if (!otherPersonId) { alert("Alici bilgisi bulunamadi!"); return }
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
      alert(`Mesaj gonderilemedi: ${err.message}`)
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
    if (!otherPersonId) { alert("Alici bilgisi bulunamadi!"); return }
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
      alert(`Mesaj gonderilemedi: ${err.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const quickMessages = user?.role === 'professional'
    ? ['Yoldayim, 10 dk', 'Malzeme almam gerekiyor', 'Is tamamlandi', 'Gecikecegim']
    : ['Ne zaman geleceksiniz?', 'Tesekkurler', 'Kolay ulasabilir misiniz?', 'Iptal etmek istiyorum']

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  // ─── Conversation List ───
  if (!selectedJobId) {
    return (
      <div>
        <PageHeader title="Mesajlar" onBack={false} />
        <div className="px-4 py-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-[3px] border-gray-300 dark:border-gray-600 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Yukleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-rose-500 text-sm mb-3">{error}</p>
              <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-sm font-medium">
                Yenile
              </button>
            </div>
          ) : userJobs.length === 0 ? (
            <EmptyState icon={MessageCircle} title="Henuz mesaj yok" description="Is kabul edildikten sonra mesajlasabilirsiniz" />
          ) : (
            <div className="space-y-2">
              {userJobs.map(job => {
                const otherPerson = user.role === 'customer' ? job.professional : job.customer
                const initials = getInitials(otherPerson?.name)
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className="w-full bg-white dark:bg-[#141414] rounded-2xl p-4 border border-gray-100 dark:border-[#262626] flex items-center gap-3 text-left active:scale-[0.98] transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-gray-900 text-[14px] truncate">{otherPerson?.name || 'Bilinmiyor'}</h3>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="text-xs text-gray-400 truncate">{job.title}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-1" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Chat View ───
  const otherPerson = user?.role === 'customer' ? selectedJob?.professional : selectedJob?.customer
  const initials = getInitials(otherPerson?.name)

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-[#f0f2f5] dark:bg-[#0b141a]">
      {/* Chat Header */}
      <header className="bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-[#262626] flex-shrink-0">
        <div className="flex items-center gap-3 h-16 px-4">
          <button
            onClick={() => setSelectedJobId(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 truncate">{otherPerson?.name || 'Bilinmiyor'}</h2>
            <p className="text-[11px] text-gray-400 truncate">{selectedJob?.title}</p>
          </div>
          <button
            onClick={() => navigate(`/job/${selectedJobId}`)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors"
          >
            <MoreVertical size={18} className="text-gray-500" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMessages ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-[3px] border-gray-300 dark:border-gray-600 border-t-primary-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-400">Mesajlar yukleniyor...</p>
          </div>
        ) : jobMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-[#141414] flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={28} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium mb-1">Henuz mesaj yok</p>
            <p className="text-xs text-gray-300">Ilk mesaji gonderin!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {jobMessages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id
              const prevMsg = idx > 0 ? jobMessages[idx - 1] : null
              const showGap = prevMsg && prevMsg.senderId !== msg.senderId

              return (
                <div key={msg.id}>
                  {showGap && <div className="h-2" />}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] relative group ${
                      isMe
                        ? 'bg-[#005c4b] dark:bg-[#005c4b] text-white rounded-2xl rounded-tr-md'
                        : 'bg-white dark:bg-[#1f2c34] text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md'
                    }`}>
                      <div className="px-3 pt-1.5 pb-1">
                        <p className="text-[14px] leading-[1.45]">{msg.content || msg.text}</p>
                      </div>
                      <div className={`flex items-center justify-end gap-1 px-3 pb-1.5 ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                        <span className="text-[10px]">{formatTime(msg.createdAt || msg.timestamp)}</span>
                        {isMe && (
                          msg.isRead
                            ? <CheckCheck size={14} className="text-[#53bdeb]" />
                            : <Check size={14} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Messages */}
      <div className="px-3 py-2 overflow-x-auto flex gap-1.5 flex-shrink-0 scrollbar-hide bg-[#f0f2f5] dark:bg-[#0b141a]">
        {quickMessages.map((qm, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuickMessage(qm)}
            disabled={isSending}
            className="px-3.5 py-2 bg-white dark:bg-[#1f2c34] rounded-full text-[12px] font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap active:scale-95 transition disabled:opacity-50 border border-gray-100 dark:border-[#2a3942]"
          >
            {qm}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-3 py-2.5 bg-[#f0f2f5] dark:bg-[#0b141a] flex-shrink-0 safe-bottom">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white dark:bg-[#1f2c34] rounded-3xl border border-gray-100 dark:border-[#2a3942] overflow-hidden">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mesajinizi yazin..."
              disabled={isSending}
              className="w-full px-5 py-3 bg-transparent text-[14px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
              messageText.trim() && !isSending
                ? 'bg-[#005c4b] text-white'
                : 'bg-gray-200 dark:bg-[#1f2c34] text-gray-400'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={20} className="-rotate-45 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
