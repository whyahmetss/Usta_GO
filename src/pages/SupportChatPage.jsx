import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { getSocket, connectSocket, emitEvent } from '../utils/socket'
import Layout from '../components/Layout'
import {
  Send, Loader, CheckCheck, Check, ArrowLeft, User,
  FileText, Download, X,
} from 'lucide-react'

export default function SupportChatPage() {
  const { userId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN'
  const agentId = searchParams.get('agentId')

  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimerRef = useRef(null)

  const loadMessages = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const url = (isAdmin && agentId)
        ? `${API_ENDPOINTS.MESSAGES.GET_CONVERSATION(userId)}?asAgent=${agentId}`
        : API_ENDPOINTS.MESSAGES.GET_CONVERSATION(userId)
      const msgsRes = await fetchAPI(url).catch(() => null)
      const msgs = Array.isArray(msgsRes?.data) ? msgsRes.data : []
      setMessages(msgs)

      // Get user info from sender/receiver in messages, or fallback
      const firstMsg = msgs.find(m => m.senderId === userId || m.receiverId === userId)
      if (firstMsg) {
        const u = firstMsg.senderId === userId ? firstMsg.sender : firstMsg.receiver
        if (u) setOtherUser(u)
        else setOtherUser({ id: userId, name: 'Kullanıcı' })
      } else {
        setOtherUser({ id: userId, name: 'Kullanıcı' })
      }

      // mark unread
      msgs.filter(m => m.receiverId === user?.id && !m.isRead).forEach(m => {
        fetchAPI(API_ENDPOINTS.MESSAGES.MARK_READ(m.id), { method: 'PATCH' }).catch(() => {})
      })
    } catch (e) {
      console.error('Load error:', e)
    } finally {
      setLoading(false)
    }
  }, [userId, user, isAdmin, agentId])

  useEffect(() => { loadMessages() }, [loadMessages])

  // Socket
  useEffect(() => {
    if (!user?.id) return
    const socket = connectSocket(user.id)

    const onReceive = (msg) => {
      if (msg.senderId === userId) {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
        if (msg.id) fetchAPI(API_ENDPOINTS.MESSAGES.MARK_READ(msg.id), { method: 'PATCH' }).catch(() => {})
      }
    }
    const onTyping = ({ userId: tid }) => {
      if (tid === userId) {
        setTyping(true)
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => setTyping(false), 2500)
      }
    }
    const onStopTyping = ({ userId: tid }) => { if (tid === userId) setTyping(false) }

    socket.on('receive_message', onReceive)
    socket.on('user_typing', onTyping)
    socket.on('user_stop_typing', onStopTyping)
    return () => {
      socket.off('receive_message', onReceive)
      socket.off('user_typing', onTyping)
      socket.off('user_stop_typing', onStopTyping)
    }
  }, [user, userId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const handleInputChange = (e) => {
    setText(e.target.value)
    emitEvent('typing', { receiverId: userId, userId: user?.id })
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => emitEvent('stop_typing', { receiverId: userId, userId: user?.id }), 1500)
  }

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    const opt = { id: `opt-${Date.now()}`, content, senderId: user?.id, receiverId: userId, isRead: false, createdAt: new Date().toISOString(), _optimistic: true }
    setMessages(prev => [...prev, opt])
    try {
      const res = await fetchAPI(API_ENDPOINTS.MESSAGES.SEND, { method: 'POST', body: { receiverId: userId, content } })
      const saved = res?.data || res
      setMessages(prev => prev.map(m => m.id === opt.id ? { ...saved, _sent: true } : m))
      emitEvent('send_message', { receiverId: userId, message: saved })
      emitEvent('stop_typing', { receiverId: userId, userId: user?.id })
    } catch {
      setMessages(prev => prev.map(m => m.id === opt.id ? { ...m, _error: true } : m))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const fmt = (d) => new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  const parseFileContent = (content) => {
    if (!content) return { text: content, fileUrl: null, isImage: false, fileName: null }
    // Strip AI prefix before parsing
    const clean = content.replace(/^🤖\s*/, '')
    const imgMatch = clean.match(/^\[Fotoğraf\]\s*(.+)$/)
    if (imgMatch) return { text: null, fileUrl: imgMatch[1].trim(), isImage: true, fileName: null }
    const fileMatch = clean.match(/^\[Dosya:\s*(.+?)\]\s*(.+)$/)
    if (fileMatch) return { text: null, fileUrl: fileMatch[2].trim(), isImage: false, fileName: fileMatch[1] }
    return { text: clean, fileUrl: null, isImage: false, fileName: null }
  }

  const isAiMessage = (msg) => msg.content && msg.content.startsWith('🤖')

  const roleLabel = (role) => {
    if (!role) return ''
    const r = role.toUpperCase()
    if (r === 'CUSTOMER') return 'Müşteri'
    if (r === 'USTA') return 'Usta'
    return role
  }

  return (
    <Layout hideNav>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/10">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-[60px]">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
            {otherUser?.profileImage
              ? <img src={otherUser.profileImage} alt="" className="w-full h-full rounded-xl object-cover" />
              : <User size={18} className="text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{otherUser?.name || 'Kullanıcı'}</p>
            <p className="text-[11px] text-gray-400">
              {typing ? 'yazıyor...' : roleLabel(otherUser?.role)}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="pt-[60px] pb-[72px] max-w-lg mx-auto px-4 flex flex-col min-h-screen">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader size={24} className="text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 py-4 space-y-1">
            {messages.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-400">Henüz mesaj yok. Yanıtlamak için yazın.</div>
            )}
            {messages.map(msg => {
              const aiMsg = isAiMessage(msg)
              const isMine = msg.senderId === user?.id && !aiMsg
              const parsed = parseFileContent(msg.content)
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                  {!isMine && (
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center mr-2 mt-1 flex-shrink-0 ${
                      aiMsg ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-400 to-indigo-600'
                    }`}>
                      <User size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {aiMsg && <span className="text-[10px] text-purple-500 font-semibold mb-0.5 px-1">🤖 AI Asistan</span>}
                    {parsed.isImage ? (
                      <div className={`rounded-2xl overflow-hidden cursor-pointer ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'} ${msg._error ? 'opacity-50' : ''}`}
                        onClick={() => setPreviewFile({ url: parsed.fileUrl })}>
                        <img src={parsed.fileUrl} alt="Fotoğraf" className="max-w-full max-h-[200px] object-cover rounded-2xl" loading="lazy" />
                      </div>
                    ) : parsed.fileUrl ? (
                      <a href={parsed.fileUrl} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm ${
                          isMine
                            ? `bg-primary-500 text-white rounded-br-sm ${msg._error ? 'opacity-50' : ''}`
                            : 'bg-white dark:bg-[#1E293B] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10 rounded-bl-sm shadow-sm'
                        }`}>
                        <FileText size={18} className={isMine ? 'text-white/70' : 'text-primary-500'} />
                        <span className="flex-1 truncate">{parsed.fileName || 'Dosya'}</span>
                        <Download size={14} className={isMine ? 'text-white/50' : 'text-gray-400'} />
                      </a>
                    ) : (
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? `bg-primary-500 text-white rounded-br-sm ${msg._error ? 'opacity-50' : ''}`
                        : aiMsg
                          ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-gray-800 dark:text-gray-100 border border-purple-200 dark:border-purple-800/30 rounded-bl-sm shadow-sm'
                          : 'bg-white dark:bg-[#1E293B] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10 rounded-bl-sm shadow-sm'
                    }`}>
                      {parsed.text}
                    </div>
                    )}
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] text-gray-400">{fmt(msg.createdAt)}</span>
                      {isMine && (msg._error
                        ? <span className="text-[10px] text-rose-400">!</span>
                        : msg.isRead
                          ? <CheckCheck size={12} className="text-primary-400" />
                          : <Check size={12} className="text-gray-300" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {typing && (
              <div className="flex justify-start mb-1">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <User size={12} className="text-white" />
                </div>
                <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111] border-t border-gray-200 dark:border-white/10">
        <div className="max-w-lg mx-auto flex items-end gap-2 px-4 py-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Yanıt yazın..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 max-h-[120px]"
            style={{ minHeight: 42 }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-11 h-11 bg-primary-500 disabled:bg-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
          >
            {sending ? <Loader size={16} className="text-white animate-spin" /> : <Send size={16} className={text.trim() ? 'text-white' : 'text-gray-400'} />}
          </button>
        </div>
      </div>
      {/* Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center" onClick={() => setPreviewFile(null)}>
            <X size={20} className="text-white" />
          </button>
          <img src={previewFile.url} alt="Önizleme" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      )}
    </Layout>
  )
}
