import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Send } from 'lucide-react'

function MessagesPage() {
  const { jobId: paramJobId } = useParams()
  const { user, jobs, sendMessage, getJobMessages } = useAuth()
  const navigate = useNavigate()
  const [selectedJobId, setSelectedJobId] = useState(paramJobId || null)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)

  // Get user's jobs that have communication
  const userJobs = user?.role === 'customer'
    ? jobs.filter(j => j.customer.id === user.id && j.status !== 'pending' && j.status !== 'cancelled')
    : jobs.filter(j => j.professional?.id === user?.id && j.status !== 'pending' && j.status !== 'cancelled')

  const selectedJob = jobs.find(j => j.id === selectedJobId)
  const jobMessages = selectedJobId ? getJobMessages(selectedJobId) : []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [jobMessages.length])

  const handleSend = () => {
    if (!messageText.trim() || !selectedJobId) return
    sendMessage(selectedJobId, messageText.trim(), user.role)
    setMessageText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickMessages = user?.role === 'professional'
    ? ['Yoldayim, 10 dakikaya varirim', 'Malzeme almam gerekiyor', 'Is tamamlandi', 'Gecikecegim, ozur dilerim']
    : ['Ne zaman geleceksiniz?', 'Tesekkurler', 'Adrese kolay ulasabilir misiniz?', 'Isi iptal etmek istiyorum']

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
          {userJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600 font-semibold">Henuz mesaj yok</p>
              <p className="text-gray-400 text-sm mt-2">Is kabul edildikten sonra mesajlasabilirsiniz</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userJobs.map(job => {
                const msgs = getJobMessages(job.id)
                const lastMsg = msgs[msgs.length - 1]
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
                        {lastMsg && <span className="text-xs text-gray-500">{formatTime(lastMsg.timestamp)}</span>}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{job.title}</p>
                      {lastMsg && <p className="text-xs text-gray-500 truncate mt-1">{lastMsg.text}</p>}
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
        {jobMessages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Henuz mesaj yok. Ilk mesaji gonderin!</p>
          </div>
        )}
        {jobMessages.map(msg => {
          const isMe = msg.sender === user.role
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                isMe
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-4 py-2 overflow-x-auto flex gap-2 flex-shrink-0">
        {quickMessages.map((qm, idx) => (
          <button key={idx} onClick={() => { sendMessage(selectedJobId, qm, user.role); }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 whitespace-nowrap hover:bg-gray-50 transition">
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
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleSend} disabled={!messageText.trim()}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
              messageText.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'
            }`}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
