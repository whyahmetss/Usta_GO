import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { getSocket, connectSocket, emitEvent } from '../utils/socket'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import {
  Send, Headphones, Loader, CheckCheck, Check, RefreshCw, PhoneOff, Star,
} from 'lucide-react'

export default function LiveSupportChatPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [agent, setAgent] = useState(null)
  const [agentLoading, setAgentLoading] = useState(true)
  const [agentError, setAgentError] = useState(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const [session, setSession] = useState(null) // SupportSession

  const [messages, setMessages] = useState([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)

  // Close + rating flow
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [chatClosed, setChatClosed] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingDone, setRatingDone] = useState(false)
  const [closingSession, setClosingSession] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimerRef = useRef(null)

  // Load support agents + open/resume session
  useEffect(() => {
    const load = async () => {
      setAgentLoading(true)
      setAgentError(null)
      try {
        // Check for existing open session first
        const sessionRes = await fetchAPI(API_ENDPOINTS.SUPPORT_SESSIONS.MINE)
        const existingSession = sessionRes?.data
        if (existingSession) {
          setSession(existingSession)
          setAgent(existingSession.agent)
          setAgentLoading(false)
          return
        }
        // Otherwise pick an available agent
        const res = await fetchAPI('/support/agents')
        const agents = Array.isArray(res?.data) ? res.data : []
        if (agents.length === 0) {
          // Offline mod: gerçek destek temsilcisi yoksa bile kullanıcı talep açabilsin
          setOfflineMode(true)
          setAgent({
            id: 'offline-support',
            name: 'Destek Ekibi',
            profileImage: null,
          })
        } else {
          const picked = agents[0]
          setAgent(picked)
          // Open a new session
          const sRes = await fetchAPI(API_ENDPOINTS.SUPPORT_SESSIONS.OPEN, {
            method: 'POST',
            body: { agentId: picked.id },
          })
          if (sRes?.data) setSession(sRes.data)
        }
        if (!agents.length) {
          // Offline mod için de loading state'i kapatmamız gerekiyor
          setAgentLoading(false)
          return
        }
      } catch (e) {
        setAgentError('Bağlantı hatası: ' + e.message)
      } finally {
        setAgentLoading(false)
      }
    }
    load()
  }, [])

  // Load conversation once agent is set — only messages from current session
  const loadMessages = useCallback(async () => {
    if (!agent) return
    setMsgLoading(true)
    try {
      const sinceParam = session?.openedAt ? `?since=${encodeURIComponent(session.openedAt)}` : ''
      const res = await fetchAPI(API_ENDPOINTS.MESSAGES.GET_CONVERSATION(agent.id) + sinceParam)
      const list = Array.isArray(res?.data) ? res.data : []
      setMessages(list)
      list
        .filter(m => m.receiverId === user?.id && !m.isRead)
        .forEach(m => {
          fetchAPI(API_ENDPOINTS.MESSAGES.MARK_READ(m.id), { method: 'PATCH' }).catch(() => {})
        })
    } catch (e) {
      console.error('Load messages error:', e)
    } finally {
      setMsgLoading(false)
    }
  }, [agent, user, session])

  useEffect(() => {
    if (agent && (session || offlineMode)) loadMessages()
  }, [agent, session, offlineMode, loadMessages])

  // Socket.IO
  useEffect(() => {
    if (!user?.id || offlineMode) return
    const socket = connectSocket(user.id)

    const onReceive = (msg) => {
      if (msg.senderId !== user?.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, { ...msg, isRead: false }]
        })
        if (msg.id) {
          fetchAPI(API_ENDPOINTS.MESSAGES.MARK_READ(msg.id), { method: 'PATCH' }).catch(() => {})
        }
      }
    }

    const onTyping = ({ userId: tid }) => {
      if (tid !== user?.id) {
        setTyping(true)
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => setTyping(false), 2500)
      }
    }

    const onStopTyping = ({ userId: tid }) => {
      if (tid !== user?.id) setTyping(false)
    }

    const onSessionClose = ({ sessionId }) => {
      if (session?.id === sessionId) setChatClosed(true)
    }

    socket.on('receive_message', onReceive)
    socket.on('user_typing', onTyping)
    socket.on('user_stop_typing', onStopTyping)
    socket.on('support_session_closed', onSessionClose)

    return () => {
      socket.off('receive_message', onReceive)
      socket.off('user_typing', onTyping)
      socket.off('user_stop_typing', onStopTyping)
      socket.off('support_session_closed', onSessionClose)
    }
  }, [user, agent, session, offlineMode])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const handleInputChange = (e) => {
    setText(e.target.value)
    if (agent && !offlineMode) {
      emitEvent('typing', { receiverId: agent.id, userId: user?.id })
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        emitEvent('stop_typing', { receiverId: agent.id, userId: user?.id })
      }, 1500)
    }
  }

  const handleSend = async () => {
    if (!text.trim() || !agent || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    const optimistic = {
      id: `opt-${Date.now()}`,
      content,
      senderId: user?.id,
      receiverId: agent.id,
      isRead: false,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    }
    setMessages(prev => [...prev, optimistic])

    // Offline mod: AI ile cevap ver
    if (offlineMode) {
      setSending(false)
      setAiThinking(true)
      
      // Konuşma geçmişini hazırla (son 6 mesaj)
      const history = messages.slice(-6).map(m => ({
        content: m.content,
        isUser: m.senderId === user?.id,
      }))

      try {
        const aiRes = await fetchAPI(API_ENDPOINTS.AI.SUPPORT_CHAT, {
          method: 'POST',
          body: { message: content, conversationHistory: history },
        })
        
        const reply = aiRes?.reply || 'Yardım talebiniz alınmıştır, en kısa sürede ilgili destek ekibi sizinle iletişime geçecektir.'
        
        setTimeout(() => {
          const botMessage = {
            id: `ai-${Date.now()}`,
            content: reply,
            senderId: 'support-ai',
            receiverId: user?.id,
            isRead: true,
            createdAt: new Date().toISOString(),
            _ai: true,
          }
          setMessages(prev => [...prev, botMessage])
          setAiThinking(false)
        }, 800)
      } catch (err) {
        console.error('AI reply error:', err)
        setTimeout(() => {
          const fallbackMsg = {
            id: `bot-${Date.now()}`,
            content: 'Yardım talebiniz alınmıştır, en kısa sürede ilgili destek ekibi sizinle iletişime geçecektir.',
            senderId: 'support-bot',
            receiverId: user?.id,
            isRead: true,
            createdAt: new Date().toISOString(),
            _system: true,
          }
          setMessages(prev => [...prev, fallbackMsg])
          setAiThinking(false)
        }, 600)
      }
      return
    }
    try {
      const res = await fetchAPI(API_ENDPOINTS.MESSAGES.SEND, {
        method: 'POST',
        body: { receiverId: agent.id, content },
      })
      const saved = res?.data || res
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...saved, _sent: true } : m))
      emitEvent('send_message', { receiverId: agent.id, message: saved })
      emitEvent('stop_typing', { receiverId: agent.id, userId: user?.id })
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, _error: true } : m))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCloseChat = async () => {
    if (!session) { setChatClosed(true); setShowCloseConfirm(false); return }
    setClosingSession(true)
    try {
      await fetchAPI(API_ENDPOINTS.SUPPORT_SESSIONS.CLOSE, {
        method: 'POST',
        body: { sessionId: session.id },
      })
      // Notify agent via socket
      emitEvent('support_session_closed', { sessionId: session.id, userId: user?.id, agentId: agent?.id })
      setChatClosed(true)
      setShowCloseConfirm(false)
    } catch (e) {
      setChatClosed(true)
      setShowCloseConfirm(false)
    } finally {
      setClosingSession(false)
    }
  }

  const handleRate = async (stars) => {
    setRating(stars)
    if (!session) { setRatingDone(true); return }
    try {
      await fetchAPI(API_ENDPOINTS.SUPPORT_SESSIONS.RATE, {
        method: 'POST',
        body: { sessionId: session.id, rating: stars },
      })
    } catch (e) { /* silent */ }
    setRatingDone(true)
  }

  const fmt = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  // Group messages by date
  const groupedMessages = []
  let lastDate = null
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toLocaleDateString('tr-TR')
    if (d !== lastDate) {
      groupedMessages.push({ type: 'date', label: d })
      lastDate = d
    }
    groupedMessages.push({ type: 'msg', msg })
  }

  return (
    <Layout hideNav>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/10">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-[60px]">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            ←
          </button>

          {agentLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Headphones size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Canlı Destek</p>
                <p className="text-[11px] text-gray-400">Bağlanıyor...</p>
              </div>
            </div>
          ) : agent ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                  {agent.profileImage
                    ? <img src={agent.profileImage} alt="" className="w-full h-full rounded-xl object-cover" />
                    : <Headphones size={18} className="text-white" />
                  }
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#111] ${offlineMode ? 'bg-amber-400' : 'bg-emerald-500'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{agent.name}</p>
                <p className="text-[11px] font-medium">
                  {offlineMode
                    ? <span className="text-amber-500">Destek ekibi şu an çevrimdışı, talebiniz kaydedilecektir.</span>
                    : <span className="text-emerald-500">{typing ? 'yazıyor...' : 'Canlı Destek · Çevrimiçi'}</span>}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center">
                <Headphones size={18} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Canlı Destek</p>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button onClick={loadMessages} disabled={msgLoading || !agent}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition">
              <RefreshCw size={16} className={`text-gray-400 ${msgLoading ? 'animate-spin' : ''}`} />
            </button>
            {agent && !chatClosed && (
              <button onClick={() => setShowCloseConfirm(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                <PhoneOff size={16} className="text-rose-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Close confirm modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-3xl p-6 max-w-xs w-full shadow-2xl">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PhoneOff size={24} className="text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white text-center mb-1">Sohbeti Kapat</h3>
            <p className="text-xs text-slate-500 text-center mb-5">Destek sohbetini kapatmak istediğinizden emin misiniz? Konuşma sona erecek.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold">
                Vazgeç
              </button>
              <button onClick={handleCloseChat} disabled={closingSession}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
                {closingSession ? <Loader size={14} className="animate-spin" /> : null}
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat closed + rating screen */}
      {chatClosed && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center">
          {!ratingDone ? (
            <>
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <Headphones size={36} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2">Sohbet Sona Erdi</h2>
              <p className="text-sm text-slate-500 mb-8 max-w-xs">Destek ekibimize puan vererek deneyiminizi paylaşın.</p>
              <div className="flex gap-3 justify-center mb-8">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => handleRate(s)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition active:scale-90 ${
                      s <= rating ? 'bg-amber-400' : 'bg-slate-100 dark:bg-white/10'
                    }`}
                    onMouseEnter={() => setRating(s)}
                    onMouseLeave={() => setRating(0)}
                  >
                    <Star size={24} className={s <= rating ? 'text-white' : 'text-slate-400'} fill={s <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <button onClick={() => setRatingDone(true)} className="text-xs text-slate-400 underline">Atla</button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <CheckCheck size={36} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2">Teşekkürler!</h2>
              <p className="text-sm text-slate-500 mb-8 max-w-xs">Geri bildiriminiz için teşekkür ederiz.</p>
              <button onClick={() => navigate(-1)} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-semibold text-sm">
                Kapat
              </button>
            </>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="pt-[60px] pb-[72px] max-w-lg mx-auto px-4 min-h-screen flex flex-col">
        {agentLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader size={28} className="text-primary-500 animate-spin" />
          </div>
        ) : agentError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Headphones size={28} className="text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Destek Kullanılamıyor</p>
            <p className="text-xs text-gray-500 max-w-xs">{agentError}</p>
          </div>
        ) : (
          <div className="flex-1 py-4 space-y-1">
            {/* Welcome message */}
            {messages.length === 0 && !msgLoading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                  <Headphones size={28} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Canlı Destek</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Merhaba! Size nasıl yardımcı olabiliriz? Mesajınızı yazın, hemen yanıtlayalım.
                </p>
              </div>
            )}

            {msgLoading && (
              <div className="flex justify-center py-4">
                <Loader size={20} className="text-gray-300 animate-spin" />
              </div>
            )}

            {groupedMessages.map((item, idx) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${idx}`} className="flex items-center gap-2 py-3">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
                    <span className="text-[10px] text-gray-400 font-medium px-2">{item.label}</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-white/10" />
                  </div>
                )
              }

              const { msg } = item
              const isMine = msg.senderId === user?.id

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                  {!isMine && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                      <Headphones size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? `bg-primary-500 text-white rounded-br-sm ${msg._error ? 'opacity-50' : ''}`
                          : 'bg-white dark:bg-[#1E293B] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] text-gray-400">{fmt(msg.createdAt)}</span>
                      {isMine && (
                        msg._error ? (
                          <span className="text-[10px] text-rose-400">!</span>
                        ) : msg.isRead ? (
                          <CheckCheck size={12} className="text-primary-400" />
                        ) : (
                          <Check size={12} className="text-gray-300" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing indicator (agent) */}
            {typing && (
              <div className="flex justify-start mb-1">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mr-2 mt-1">
                  <Headphones size={12} className="text-white" />
                </div>
                <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI thinking indicator (offline mode) */}
            {aiThinking && (
              <div className="flex justify-start mb-1">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center mr-2 mt-1">
                  <svg className="w-3.5 h-3.5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                  </svg>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-100 dark:border-purple-800/30 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-300">Go düşünüyor</span>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      {agent && !agentError && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111] border-t border-gray-200 dark:border-white/10">
          <div className="max-w-lg mx-auto flex items-end gap-2 px-4 py-3">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Mesaj yazın..."
              rows={1}
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 max-h-[120px] leading-snug"
              style={{ minHeight: 42 }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-11 h-11 bg-primary-500 disabled:bg-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-all shadow-sm shadow-primary-500/30"
            >
              {sending
                ? <Loader size={16} className="text-white animate-spin" />
                : <Send size={16} className={text.trim() ? 'text-white' : 'text-gray-400'} />
              }
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
