import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Send } from 'lucide-react'

function MessagesPage() {
  const { jobId } = useParams()
  const { user, jobs, sendMessage, getJobMessages } = useAuth()
  const navigate = useNavigate()
  const [selectedJob, setSelectedJob] = useState(jobId || null)

  // Kullanıcının ilgili olduğu işler
  const userJobs = user?.role === 'customer'
    ? jobs.filter(j => j.customer.id === user.id && j.professional)
    : jobs.filter(j => j.professional?.id === user?.id)

  const currentJob = selectedJob ? jobs.find(j => j.id === selectedJob) : null
  const messages = selectedJob ? getJobMessages(selectedJob) : []

  // Hazır mesaj şablonları
  const quickMessages = user?.role === 'professional' ? [
    { text: 'Yoldayım, 10 dakikaya varırım ✅', icon: '🚗' },
    { text: 'Malzeme almam gerekiyor 🛠️', icon: '🔧' },
    { text: 'İş tamamlandı ✅', icon: '✅' },
    { text: 'Gecikeceğim, özür dilerim ⏰', icon: '⏰' },
  ] : [
    { text: 'Ne zaman geleceksiniz?', icon: '❓' },
    { text: 'Teşekkürler ⭐', icon: '⭐' },
    { text: 'Adrese kolay ulaşabilir misiniz?', icon: '📍' },
    { text: 'İşi iptal etmek istiyorum', icon: '❌' },
  ]

  const handleSendMessage = (text) => {
    if (selectedJob && text.trim()) {
      sendMessage(selectedJob, text, user.role)
    }
  }

  if (!selectedJob) {
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
            <h1 className="text-2xl font-black text-white">Mesajlar</h1>
          </div>
        </div>

        {/* Jobs List */}
        <div className="px-4 py-6">
          {userJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600 font-semibold">Henüz mesajlaşma yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userJobs.map(job => {
                const jobMessages = getJobMessages(job.id)
                const lastMessage = jobMessages[jobMessages.length - 1]
                const otherPerson = user.role === 'customer' ? job.professional : job.customer

                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job.id)}
                    className="w-full bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">{otherPerson?.avatar}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{otherPerson?.name}</h3>
                        <p className="text-sm text-gray-600">{job.title}</p>
                      </div>
                      {jobMessages.length > 0 && (
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                          {jobMessages.length}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        {lastMessage.text}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const otherPerson = user.role === 'customer' ? currentJob.professional : currentJob.customer

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="blue-gradient-bg pb-4 pt-4 px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedJob(null)}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="text-3xl">{otherPerson?.avatar}</div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">{otherPerson?.name}</h1>
            <p className="text-white/70 text-sm">{currentJob.title}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-500 text-sm">Henüz mesaj yok</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender === user.role
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  isMe 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-900'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Quick Messages */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Hızlı Mesajlar</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickMessages.map((qm, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qm.text)}
                className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition"
              >
                {qm.icon} {qm.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
