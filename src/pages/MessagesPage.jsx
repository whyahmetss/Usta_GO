import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, Send } from 'lucide-react'

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

  // Load user's jobs
  useEffect(() => {
    const loadUserJobs = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
        if (response.data && Array.isArray(response.data)) {
          // Map from backend format; statuses become lowercase, user.role is already mapped
          const mapped = mapJobsFromBackend(response.data)
          const filtered = user?.role === 'customer'
            ? mapped.filter(j => j.customer?.id === user.id && j.status !== 'pending' && j.status !== 'cancelled')
            : mapped.filter(j => j.professional?.id === user?.id && j.status !== 'pending' && j.status !== 'cancelled')
          setUserJobs(filtered)
        }
      } catch (err) {
        console.error('Load jobs error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadUserJobs()
    }
  }, [user])

  // Load messages for selected job
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [jobMessages.length])

  const handleSend = async () => {
    if (!messageText.trim() || !selectedJobId || isSending) return

    const otherPersonId = user?.role === 'customer' 
      ? selectedJob?.professional?.id 
      : selectedJob?.customer?.id

    if (!otherPersonId) {
      alert("Alıcı bilgisi bulunamadı!")
      return
    }

    const messageToSend = messageText.trim()
    setMessageText('')
    setIsSending(true)

    try {
      const response = await fetchAPI(API_ENDPOINTS.MESSAGES.SEND, {
        method: 'POST',
        body: {
          jobId: selectedJobId,
          content: messageToSend,
          receiverId: otherPersonId
        }
      })

      if (response.data) {
        setJobMessages(prev => [...prev, response.data])
      }
    } catch (err) {
      console.error('Send message error:', err)
      setMessageText(messageToSend)
      alert(`Mesaj gonderilemedi: ${err.message}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }


  const quickMessages = user?.role === 'professional'
    ? ['Yoldayım, 10 dakikaya varırım', 'Malzeme almam gerekiyor', 'İş tamamlandı', 'Gecikeceğim, özür dilerim']
    : ['Ne zaman geleceksiniz?', 'Teşekküler', 'Adrese kolay ulaşabilir misiniz?', 'İşi iptal etmek istiyorum']

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  // Job list view
  if (!selectedJobId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="blue-gradient-bg pb-6 pt-4 px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-2xl font-black text-white">Mesajlar</h1>
          </div>
        </div>
        <div className="px-4 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">İşler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Yenile
              </button>
            </div>
          ) : userJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600 font-semibold">Henüz mesaj yok</p>
              <p className="text-gray-400 text-sm mt-2">İş kabul edildikten sonra mesajlaşabilirsiniz</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userJobs.map(job => {
                const otherPerson = user.role === 'customer' ? job.professional : job.customer
                return (
                  <div key={job.id} onClick={() => setSelectedJobId(job.id)}
                    className="bg-white rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {otherPerson?.avatar || '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{otherPerson?.name || 'Bilinmiyor'}</h3>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{job.title}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Chat view
  const otherPerson = user?.role === 'customer' ? selectedJob?.professional : selectedJob?.customer

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="blue-gradient-bg pb-4 pt-4 px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedJobId(null)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
              {otherPerson?.avatar || '👤'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{otherPerson?.name || 'Bilinmiyor'}</h2>
              <p className="text-white/70 text-xs">{selectedJob?.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loadingMessages ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Mesajlar yükleniyor...</p>
          </div>
        ) : jobMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Henüz mesaj yok. İlk mesaji gönderin!</p>
          </div>
        ) : (
          jobMessages.map(msg => {
            const isMe = msg.senderId === user?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                }`}>
                  <p className="text-sm">{msg.content || msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt || msg.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-4 py-2 overflow-x-auto flex gap-2 flex-shrink-0">
        {quickMessages.map((qm, idx) => (
          <button key={idx} onClick={() => handleSendQuickMessage(qm)} disabled={isSending}
            className="px-3 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 whitespace-nowrap hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {qm}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajinizi yazin..."
            disabled={isSending}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button onClick={handleSend} disabled={!messageText.trim() || isSending}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
              messageText.trim() && !isSending ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            {isSending ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
