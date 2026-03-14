import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  fetchAPI,
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  uploadFiles
} from '../utils/api'
import { API_ENDPOINTS } from '../config'
import {
  mapUserFromBackend,
  mapJobFromBackend,
  mapJobsFromBackend,
  mapJobToBackend,
} from '../utils/fieldMapper'
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket'

// Convert data URL to File object for upload
function dataURLtoFile(dataUrl, filename) {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [notifArchived, setNotifArchived] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem('ustago_notif_archived') || '[]')
      return Array.isArray(v) ? v : []
    } catch { return [] }
  })
  const [notifPinned, setNotifPinned] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem('ustago_notif_pinned') || '[]')
      return Array.isArray(v) ? v : []
    } catch { return [] }
  })
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [error, setError] = useState(null)
  const [useLocalStorage, setUseLocalStorage] = useState(false) // Transition flag

  // Initialize: Load from token and fetch user data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        const token = getToken()

        if (token) {
          try {
            // Try to fetch user from API
            const userData = await fetchAPI(API_ENDPOINTS.AUTH.ME)
            if (userData.data) {
              const mappedUser = mapUserFromBackend(userData.data)
              setUser(mappedUser)
              setStoredUser(mappedUser)
              setUseLocalStorage(false)
            }
          } catch (err) {
            // Fallback to localStorage if API fails
            console.warn('API fetch failed, falling back to localStorage:', err)
            const storedUser = getStoredUser()
            if (storedUser) {
              setUser(mapUserFromBackend(storedUser))
              setUseLocalStorage(true)
            }
          }
        } else {
          // No token, try localStorage for transition period
          const storedUser = getStoredUser()
          if (storedUser) {
            setUser(mapUserFromBackend(storedUser))
            setUseLocalStorage(true)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Socket.IO: Connect when user is authenticated, disconnect on logout
  useEffect(() => {
    if (user && !useLocalStorage) {
      const socket = connectSocket(user.id)

      // Listen for real-time message notifications
      socket.on('receive_message', (message) => {
        setMessages(prev => [...prev, message])
        // Collapse message notifications: single unread notif per sender
        setNotifications(prev => {
          const senderId = message?.senderId || 'unknown'
          const id = `msg_${senderId}`
          const baseNotif = {
            id,
            type: 'message',
            title: 'Yeni Mesaj',
            message: message.content?.substring(0, 80) || 'Yeni bir mesaj aldınız',
            icon: 'message',
            read: false,
            time: new Date().toISOString(),
            targetUserId: user.id,
            senderId,
            lastMessageId: message?.id,
          }
          const withoutThisSender = prev.filter(n => n.id !== id)
          return [baseNotif, ...withoutThisSender]
        })
      })

      // Listen for job updates
      socket.on('job_updated', (data) => {
        setJobs(prev => prev.map(job =>
          job.id === data.jobId ? { ...job, status: data.status } : job
        ))
        if (data.message) {
          addNotification({
            type: 'job',
            title: 'İş Güncellendi',
            message: data.message,
            icon: 'bell',
            targetUserId: user.id,
          })
        }
      })

      // Listen for new jobs (for professionals)
      socket.on('new_job_available', (jobData) => {
        if (user.role === 'professional') {
          addNotification({
            type: 'job',
            title: 'Yeni İş!',
            message: `${jobData.title || 'Yeni bir iş'} oluşturuldu`,
            icon: 'new',
            targetUserId: user.id,
          })
        }
      })

      // Emit online status
      socket.emit('user_online', user.id)

      return () => {
        socket.off('receive_message')
        socket.off('job_updated')
        socket.off('new_job_available')
        socket.emit('user_offline', user.id)
      }
    }
  }, [user?.id, useLocalStorage])

  // --- AUTH ---
  const login = useCallback(async (email, password) => {
    try {
      setError(null)
      const response = await fetchAPI(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: { email, password },
        includeAuth: false
      })

      if (response.data && response.data.token) {
        setToken(response.data.token)
        const mappedUser = mapUserFromBackend(response.data.user)
        setStoredUser(mappedUser)
        setUser(mappedUser)
        setUseLocalStorage(false)
        return { success: true, role: mappedUser.role }
      }

      return { success: false, error: response.message || 'Login failed' }
    } catch (err) {
      const errorMsg = err.message || 'E-posta veya şifre hatalı'
      setError(errorMsg)
      console.error('Login error:', err)
      return { success: false, error: errorMsg }
    }
  }, [])

  const register = useCallback(async (email, password, name, role, phone = '', referralCode, birthDate) => {
    try {
      setError(null)
      const cleanedReferralCode =
        typeof referralCode === 'string' && referralCode.trim()
          ? referralCode.trim().toUpperCase()
          : undefined
      const body = {
        email,
        password,
        name,
        role: role?.toUpperCase() || 'CUSTOMER',
        phone,
        ...(cleanedReferralCode ? { referralCode: cleanedReferralCode } : {}),
        ...(birthDate ? { birthDate } : {}),
      }
      const response = await fetchAPI(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body,
        includeAuth: false
      })

      if (response.data && response.data.token) {
        setToken(response.data.token)
        const mappedUser = mapUserFromBackend(response.data.user)
        setStoredUser(mappedUser)
        setUser(mappedUser)
        setUseLocalStorage(false)

        return { success: true, role: mappedUser.role }
      }

      return { success: false, error: response.message || 'Kayıt başarısız oldu' }
    } catch (err) {
      const errorMsg = err.message || 'Kayıt başarısız oldu'
      setError(errorMsg)
      console.error('Register error:', err)
      return { success: false, error: errorMsg }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Disconnect socket
      disconnectSocket()

      // Call logout endpoint if user is authenticated
      if (user && getToken()) {
        await fetchAPI(API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' }).catch(err => {
          console.warn('Logout API call failed:', err)
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      removeToken()
      removeStoredUser()
      setUser(null)
      setJobs([])
      setMessages([])
      setNotifications([])
      setTransactions([])
      setWithdrawals([])
    }
  }, [user])

  // --- LOAD PERSISTENT NOTIFICATIONS ---
  useEffect(() => {
    if (!user || useLocalStorage) return

    const loadNotifications = async () => {
      try {
        const response = await fetchAPI(API_ENDPOINTS.NOTIFICATIONS.LIST)
        if (response.data && Array.isArray(response.data)) {
          const mapped = response.data.map(n => ({
            id: n.id,
            type: n.type || 'system',
            title: n.title,
            message: n.message,
            icon: n.icon || 'bell',
            read: n.read,
            time: n.createdAt || n.readAt || new Date().toISOString(),
            targetUserId: user.id,
            jobId: n.jobId,
          }))
          setNotifications(mapped)
        }
      } catch (err) {
        console.warn('Could not load notifications:', err)
      }
    }

    loadNotifications()
  }, [user?.id, useLocalStorage])

  // --- NOTIFICATIONS ---
  const addNotification = useCallback(async (notif) => {
    const baseNotif = { ...notif, read: false, time: new Date().toISOString(), targetUserId: user?.id }
    if (useLocalStorage || !user) {
      setNotifications(prev => [{ id: Date.now().toString(), ...baseNotif }, ...prev])
      return
    }
    try {
      const res = await fetchAPI(API_ENDPOINTS.NOTIFICATIONS.CREATE, {
        method: 'POST',
        body: {
          type: notif.type || 'system',
          title: notif.title,
          message: notif.message,
          icon: notif.icon || 'bell',
          jobId: notif.jobId,
          targetUrl: notif.targetUrl,
        },
      })
      if (res.data) {
        setNotifications(prev => [{ id: res.data.id, ...baseNotif }, ...prev])
      }
    } catch {
      setNotifications(prev => [{ id: Date.now().toString(), ...baseNotif }, ...prev])
    }
  }, [user?.id, useLocalStorage])

  const markNotificationRead = useCallback(async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    if (!useLocalStorage && notifId && !String(notifId).startsWith('msg_')) {
      try {
        await fetchAPI(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notifId), { method: 'PATCH' })
      } catch (err) {
        console.warn('Mark notification read:', err)
      }
    }
  }, [useLocalStorage])

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (!useLocalStorage) {
      try {
        await fetchAPI(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, { method: 'PATCH' })
      } catch (err) {
        console.warn('Mark all read:', err)
      }
    }
  }, [useLocalStorage])

  const getUnreadNotificationCount = useCallback(() => {
    if (!user) return 0
    return notifications.filter(n => !n.read).length
  }, [notifications, user])

  const getUserNotifications = useCallback(() => {
    if (!user) return []
    const list = Array.isArray(notifications) ? notifications : []
    const archived = Array.isArray(notifArchived) ? notifArchived : []
    const pinnedIds = Array.isArray(notifPinned) ? notifPinned : []
    const excludeArchived = list.filter(n => n && !archived.includes(n.id))
    const pinned = excludeArchived.filter(n => pinnedIds.includes(n.id))
    const unpinned = excludeArchived.filter(n => !pinnedIds.includes(n.id))
    return [...pinned, ...unpinned]
  }, [notifications, user, notifArchived, notifPinned])

  const removeNotification = useCallback(async (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId))
    setNotifArchived(prev => { const arr = Array.isArray(prev) ? prev : []; const next = arr.filter(id => id !== notifId); try { localStorage.setItem('ustago_notif_archived', JSON.stringify(next)) } catch {}; return next })
    setNotifPinned(prev => { const arr = Array.isArray(prev) ? prev : []; const next = arr.filter(id => id !== notifId); try { localStorage.setItem('ustago_notif_pinned', JSON.stringify(next)) } catch {}; return next })
    if (!useLocalStorage && notifId && !String(notifId).startsWith('msg_')) {
      try { await fetchAPI(API_ENDPOINTS.NOTIFICATIONS.DELETE(notifId), { method: 'DELETE' }) } catch {}
    }
  }, [useLocalStorage])

  const archiveNotification = useCallback((notifId) => {
    setNotifArchived(prev => {
      const arr = Array.isArray(prev) ? prev : []
      const next = arr.includes(notifId) ? arr : [...arr, notifId]
      try { localStorage.setItem('ustago_notif_archived', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const unarchiveNotification = useCallback((notifId) => {
    setNotifArchived(prev => {
      const arr = Array.isArray(prev) ? prev : []
      const next = arr.filter(id => id !== notifId)
      try { localStorage.setItem('ustago_notif_archived', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const getArchivedNotifications = useCallback(() => {
    if (!user) return []
    const list = Array.isArray(notifications) ? notifications : []
    const archived = Array.isArray(notifArchived) ? notifArchived : []
    return list.filter(n => n && archived.includes(n.id))
  }, [notifications, user, notifArchived])

  const pinNotification = useCallback((notifId) => {
    setNotifPinned(prev => {
      const arr = Array.isArray(prev) ? prev : []
      const next = arr.includes(notifId) ? arr : [...arr, notifId]
      try { localStorage.setItem('ustago_notif_pinned', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const unpinNotification = useCallback((notifId) => {
    setNotifPinned(prev => {
      const arr = Array.isArray(prev) ? prev : []
      const next = arr.filter(id => id !== notifId)
      try { localStorage.setItem('ustago_notif_pinned', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // --- JOBS ---
  const createJob = useCallback(async (jobData) => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        const newJob = {
          id: Date.now().toString(),
          ...jobData,
          status: 'pending',
          beforePhotos: [],
          afterPhotos: [],
          rating: null,
          createdAt: new Date().toISOString(),
        }
        setJobs(prev => [...prev, newJob])
        return newJob
      }

      const response = await fetchAPI(API_ENDPOINTS.JOBS.CREATE, {
        method: 'POST',
        body: mapJobToBackend(jobData)
      })

      if (response.data) {
        const mapped = mapJobFromBackend(response.data)
        setJobs(prev => [...prev, mapped])
        addNotification({
          type: 'job',
          title: 'İş Oluşturuldu',
          message: `${mapped.title} Başarıyla oluşturuldu`,
          icon: 'sparkle'
        })
        return mapped
      }

      throw new Error('İş oluşturulurken Hata Oluştu')
    } catch (err) {
      const errorMsg = err.message || 'İş oluşturma hatası'
      setError(errorMsg)
      console.error('Create job error:', err)
      throw err
    }
  }, [useLocalStorage, addNotification])

  const acceptJob = useCallback(async (jobId) => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'accepted', professional: user, acceptedAt: new Date().toISOString() }
            : job
        ))
        return
      }

      // Try PATCH to update job status directly
      const response = await fetchAPI(API_ENDPOINTS.JOBS.ACCEPT(jobId), {
        method: 'PATCH',
        body: {
          status: 'ACCEPTED',
          professionalId: user?.id
        }
      })

      if (response.data) {
        const mapped = mapJobFromBackend(response.data)
        setJobs(prev => prev.map(job => job.id === jobId ? mapped : job))
        addNotification({
          type: 'status',
          title: 'İş Kabul Edildi',
          message: 'İş başarıyla kabul edildi',
          icon: 'check'
        })
        return response.data
      }
    } catch (err) {
      const errorMsg = err.message || 'Job acceptance failed'
      setError(errorMsg)
      console.error('Accept job error:', err)
      throw err
    }
  }, [user, useLocalStorage, addNotification])

  const startJob = useCallback(async (jobId, beforePhotos = []) => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'in_progress', beforePhotos, startedAt: new Date().toISOString() }
            : job
        ))
        return
      }

      // Upload photos if provided - convert data URLs to File objects
      let photoUrls = []
      if (beforePhotos && beforePhotos.length > 0) {
        const files = beforePhotos.map((photo, i) => {
          if (typeof photo === 'string' && photo.startsWith('data:')) {
            return dataURLtoFile(photo, `before_${Date.now()}_${i}.jpg`)
          }
          return photo
        })
        const uploadResponse = await uploadFiles(API_ENDPOINTS.UPLOAD.MULTIPLE, files, 'photos')
        photoUrls = uploadResponse.data?.urls || []
      }

      const response = await fetchAPI(API_ENDPOINTS.JOBS.START(jobId), {
        method: 'PUT',
        body: { beforePhotos: photoUrls }
      })

      if (response.data) {
        const mapped = mapJobFromBackend(response.data)
        setJobs(prev => prev.map(job => job.id === jobId ? mapped : job))
        addNotification({
          type: 'status',
          title: 'İş Başladı',
          message: 'İş başarıyla başlatıldı',
          icon: 'rocket'
        })
      }
    } catch (err) {
      const errorMsg = err.message || 'Job start failed'
      setError(errorMsg)
      console.error('Start job error:', err)
      throw err
    }
  }, [user, useLocalStorage, addNotification])

  const completeJob = useCallback(async (jobId, afterPhotos = []) => {
    try {
      setError(null)

      if (useLocalStorage) {
        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'pending_approval', afterPhotos, completedAt: new Date().toISOString() }
            : job
        ))
        return
      }

      // Upload photos if provided - convert data URLs to File objects
      let photoUrls = []
      if (afterPhotos && afterPhotos.length > 0) {
        const files = afterPhotos.map((photo, i) => {
          if (typeof photo === 'string' && photo.startsWith('data:')) {
            return dataURLtoFile(photo, `after_${Date.now()}_${i}.jpg`)
          }
          return photo
        })
        const uploadResponse = await uploadFiles(API_ENDPOINTS.UPLOAD.MULTIPLE, files, 'photos')
        photoUrls = uploadResponse.data?.urls || []
      }

      const response = await fetchAPI(API_ENDPOINTS.JOBS.COMPLETE(jobId), {
        method: 'PUT',
        body: { afterPhotos: photoUrls }
      })

      if (response.data) {
        const mapped = mapJobFromBackend(response.data)
        setJobs(prev => prev.map(job => job.id === jobId ? mapped : job))
        addNotification({
          type: 'status',
          title: 'İş Tamamlandı',
          message: 'İş tamamlandı. Müşteri onayı bekleniyor.',
          icon: 'party'
        })
      }
    } catch (err) {
      const errorMsg = err.message || 'Job completion failed'
      setError(errorMsg)
      console.error('Complete job error:', err)
      throw err
    }
  }, [useLocalStorage, addNotification])

  const cancelJob = useCallback(async (jobId, reason = '', penalty = 0) => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'cancelled', cancelReason: reason, cancelPenalty: penalty, cancelledAt: new Date().toISOString() }
            : job
        ))
        return
      }

      const response = await fetchAPI(API_ENDPOINTS.JOBS.CANCEL(jobId), {
        method: 'PUT',
        body: { reason, penalty }
      })

      if (response.data) {
        const mapped = mapJobFromBackend(response.data)
        setJobs(prev => prev.map(job => job.id === jobId ? mapped : job))
        addNotification({
          type: 'status',
          title: 'İş İptal Edildi',
          message: 'İş başarıyla iptal edildi',
          icon: 'cancel'
        })
      }
    } catch (err) {
      const errorMsg = err.message || 'Job cancellation failed'
      setError(errorMsg)
      console.error('Cancel job error:', err)
      throw err
    }
  }, [useLocalStorage, addNotification])

  const rateJob = useCallback(async (jobId, ratingData, review = '') => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'rated', rating: { ...ratingData, review } }
            : job
        ))
        return
      }

      const response = await fetchAPI(API_ENDPOINTS.JOBS.RATE(jobId), {
        method: 'PUT',
        body: { ...ratingData, review }
      })

      if (response.data) {
        const mapped = mapJobFromBackend(response.data)
        setJobs(prev => prev.map(job => job.id === jobId ? mapped : job))
        addNotification({
          type: 'status',
          title: 'Değerlendirme Yapıldı',
          message: 'Teşekkürler! Değerlendirmeniz kaydedildi.',
          icon: 'star'
        })
      }
    } catch (err) {
      const errorMsg = err.message || 'Job rating failed'
      setError(errorMsg)
      console.error('Rate job error:', err)
      throw err
    }
  }, [useLocalStorage, addNotification])

  // --- FINANCIAL ---
  const getWalletBalance = useCallback(async (professionalId) => {
    try {
      const pid = professionalId || user?.id
      if (!pid) return 0

      if (useLocalStorage) {
        // Fallback to localStorage
        const userTransactions = transactions.filter(t => t.professionalId === pid)
        return userTransactions.reduce((sum, t) => sum + t.amount, 0)
      }

      const response = await fetchAPI(API_ENDPOINTS.WALLET.GET)
      if (response.data) {
        return response.data.balance || 0
      }
      return 0
    } catch (err) {
      console.error('Get wallet balance error:', err)
      // Fallback to calculating from transactions
      const userTransactions = transactions.filter(t => t.professionalId === (professionalId || user?.id))
      return userTransactions.reduce((sum, t) => sum + t.amount, 0)
    }
  }, [user, useLocalStorage, transactions])

  const getThisMonthEarnings = useCallback(async (professionalId) => {
    try {
      const pid = professionalId || user?.id
      if (!pid) return 0

      if (useLocalStorage) {
        // Fallback to localStorage
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()
        return transactions
          .filter(t => t.professionalId === pid && t.type === 'earning')
          .filter(t => {
            const d = new Date(t.date)
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear
          })
          .reduce((sum, t) => sum + t.amount, 0)
      }

      const response = await fetchAPI(API_ENDPOINTS.WALLET.GET_EARNINGS)
      if (response.data) {
        return response.data.thisMonth || 0
      }
      return 0
    } catch (err) {
      console.error('Get this month earnings error:', err)
      return 0
    }
  }, [user, useLocalStorage, transactions])

  const getLastMonthEarnings = useCallback(async (professionalId) => {
    try {
      const pid = professionalId || user?.id
      if (!pid) return 0

      if (useLocalStorage) {
        // Fallback to localStorage
        const now = new Date()
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
        const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        return transactions
          .filter(t => t.professionalId === pid && t.type === 'earning')
          .filter(t => {
            const d = new Date(t.date)
            return d.getMonth() === lastMonth && d.getFullYear() === lastYear
          })
          .reduce((sum, t) => sum + t.amount, 0)
      }

      const response = await fetchAPI(API_ENDPOINTS.WALLET.GET_EARNINGS)
      if (response.data) {
        return response.data.lastMonth || 0
      }
      return 0
    } catch (err) {
      console.error('Get last month earnings error:', err)
      return 0
    }
  }, [user, useLocalStorage, transactions])

  const getPendingWithdrawals = useCallback(async (professionalId) => {
    try {
      const pid = professionalId || user?.id
      if (!pid) return 0

      if (useLocalStorage) {
        // Fallback to localStorage
        return withdrawals
          .filter(w => w.professionalId === pid && w.status === 'pending')
          .reduce((sum, w) => sum + w.amount, 0)
      }

      const response = await fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS)
      if (response.data && Array.isArray(response.data)) {
        return response.data
          .filter(t => t.type === 'withdrawal' && t.status === 'pending')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      }
      return 0
    } catch (err) {
      console.error('Get pending withdrawals error:', err)
      return 0
    }
  }, [user, useLocalStorage, withdrawals])

  const getUserTransactions = useCallback(async (professionalId) => {
    try {
      const pid = professionalId || user?.id
      if (!pid) return []

      if (useLocalStorage) {
        // Fallback to localStorage
        return transactions.filter(t => t.professionalId === pid)
      }

      const response = await fetchAPI(API_ENDPOINTS.WALLET.GET_TRANSACTIONS)
      if (response.data && Array.isArray(response.data)) {
        return response.data
      }
      return []
    } catch (err) {
      console.error('Get user transactions error:', err)
      return transactions.filter(t => t.professionalId === (professionalId || user?.id))
    }
  }, [user, useLocalStorage, transactions])

  const requestWithdrawal = useCallback(async (amount, bankName, iban, accountHolder) => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        const balance = transactions
          .filter(t => t.professionalId === user.id)
          .reduce((sum, t) => sum + t.amount, 0)
        const pendingAmount = withdrawals
          .filter(w => w.professionalId === user.id && w.status === 'pending')
          .reduce((sum, w) => sum + w.amount, 0)
        const available = balance - pendingAmount

        if (amount > available) {
          return { success: false, error: 'Yetersiz bakiye' }
        }
        if (amount < 100) {
          return { success: false, error: 'Minimum Çekim tutarı 100 TL' }
        }

        const withdrawal = {
          id: Date.now().toString(),
          professionalId: user.id,
          amount,
          bankName,
          iban,
          accountHolder,
          requestDate: new Date().toISOString(),
          status: 'pending'
        }
        setWithdrawals(prev => [withdrawal, ...prev])
        return { success: true }
      }

      const response = await fetchAPI(API_ENDPOINTS.WALLET.WITHDRAW, {
        method: 'POST',
        body: { amount, bankName, iban, accountHolder }
      })

      if (response.data) {
        setWithdrawals(prev => [response.data, ...prev])
        addNotification({
          type: 'status',
          title: 'Para Çekme Talebi',
          message: `${amount} Para çekme talebiniz gönderildi`,
          icon: 'coins'
        })
        return { success: true }
      }

      return { success: false, error: 'Withdrawal request failed' }
    } catch (err) {
      const errorMsg = err.message || 'Withdrawal request failed'
      setError(errorMsg)
      console.error('Withdrawal request error:', err)
      return { success: false, error: errorMsg }
    }
  }, [user, useLocalStorage, transactions, withdrawals, addNotification])

  const approveWithdrawal = useCallback(async (withdrawalId) => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        setWithdrawals(prev => prev.map(w =>
          w.id === withdrawalId ? { ...w, status: 'approved', processedDate: new Date().toISOString() } : w
        ))
        return
      }

      // In API mode, admin approval would be handled via admin API
      console.warn('Withdrawal approval should be handled via admin API')
    } catch (err) {
      console.error('Approve withdrawal error:', err)
    }
  }, [useLocalStorage])

  const rejectWithdrawal = useCallback(async (withdrawalId, rejectionReason = '') => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        setWithdrawals(prev => prev.map(w =>
          w.id === withdrawalId ? { ...w, status: 'rejected', processedDate: new Date().toISOString(), rejectionReason } : w
        ))
        return
      }

      // In API mode, admin rejection would be handled via admin API
      console.warn('Withdrawal rejection should be handled via admin API')
    } catch (err) {
      console.error('Reject withdrawal error:', err)
    }
  }, [useLocalStorage])

  // --- MESSAGING ---
  const sendMessage = useCallback(async (jobId, text, sender) => {
    try {
      setError(null)

      if (useLocalStorage) {
        // Fallback to localStorage
        const newMessage = {
          id: Date.now().toString(),
          jobId,
          text,
          sender,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, newMessage])
        addNotification({
          type: 'message',
          title: 'Mesaj Gönderildi',
          message: text.substring(0, 50),
          icon: 'message'
        })
        return newMessage
      }

      const response = await fetchAPI(API_ENDPOINTS.MESSAGES.SEND, {
        method: 'POST',
        body: { jobId, text, sender }
      })

      if (response.data) {
        setMessages(prev => [...prev, response.data])
        addNotification({
          type: 'message',
          title: 'Mesaj Gönderildi',
          message: text.substring(0, 50),
          icon: 'message'
        })
        return response.data
      }

      throw new Error('Failed to send message')
    } catch (err) {
      const errorMsg = err.message || 'Message send failed'
      setError(errorMsg)
      console.error('Send message error:', err)
      throw err
    }
  }, [useLocalStorage, addNotification])

  const getJobMessages = useCallback(async (jobId) => {
    try {
      if (useLocalStorage) {
        // Fallback to localStorage
        return messages.filter(m => m.jobId === jobId)
      }

      const response = await fetchAPI(API_ENDPOINTS.MESSAGES.GET_JOB_MESSAGES(jobId))
      if (response.data && Array.isArray(response.data)) {
        setMessages(response.data)
        return response.data
      }
      return []
    } catch (err) {
      console.error('Get job messages error:', err)
      return messages.filter(m => m.jobId === jobId)
    }
  }, [useLocalStorage, messages])

  const getUserJobs = useCallback(async (userId, userRole) => {
    try {
      // Normalize role to lowercase for comparison
      const role = userRole?.toLowerCase()
      const isUsta = role === 'professional' || role === 'usta'
      const isCustomer = role === 'customer'

      if (useLocalStorage) {
        // Fallback to localStorage
        if (isCustomer) {
          return jobs.filter(j => j.customer?.id === userId)
        } else if (isUsta) {
          return jobs.filter(j => j.professional?.id === userId || j.usta?.id === userId)
        }
        return jobs
      }

      const endpoint = isCustomer || isUsta
        ? API_ENDPOINTS.JOBS.BY_USER(userId)
        : API_ENDPOINTS.JOBS.LIST

      const response = await fetchAPI(endpoint)
      if (response.data && Array.isArray(response.data)) {
        const mapped = mapJobsFromBackend(response.data)
        setJobs(mapped)
        return mapped
      }
      return []
    } catch (err) {
      console.error('Get user jobs error:', err)
      const role = userRole?.toLowerCase()
      if (role === 'customer') {
        return jobs.filter(j => j.customer?.id === userId)
      } else if (role === 'professional' || role === 'usta') {
        return jobs.filter(j => j.professional?.id === userId || j.usta?.id === userId)
      }
      return jobs
    }
  }, [useLocalStorage, jobs])

  const getPendingJobs = useCallback(async () => {
    try {
      if (useLocalStorage) {
        // Fallback to localStorage (status already lowercase after mapping)
        return jobs.filter(j => j.status === 'pending')
      }

      const response = await fetchAPI(API_ENDPOINTS.JOBS.LIST)
      if (response.data && Array.isArray(response.data)) {
        const mapped = mapJobsFromBackend(response.data)
        // After mapping, statuses are lowercase
        const pendingJobs = mapped.filter(j => j.status === 'pending')
        setJobs(mapped)
        return pendingJobs
      }
      return []
    } catch (err) {
      console.error('Get pending jobs error:', err)
      return jobs.filter(j => j.status === 'pending')
    }
  }, [useLocalStorage, jobs])

  const getCancellationCount = useCallback((userId) => {
    // This would ideally come from the API in production
    // For now, tracking locally
    try {
      const stored = localStorage.getItem(`cancellations_${userId || user?.id}`)
      return stored ? JSON.parse(stored).count : 0
    } catch (err) {
      return 0
    }
  }, [user])

  const getUnreadMessageCount = useCallback(() => {
    if (!user) return 0
    return notifications.filter(n => !n.read && n.targetUserId === user.id && n.type === 'message').length
  }, [notifications, user])

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading,
      error,
      setError,
      useLocalStorage,
      // Jobs
      jobs,
      createJob,
      acceptJob,
      startJob,
      completeJob,
      cancelJob,
      rateJob,
      getUserJobs,
      getPendingJobs,
      // Messages
      messages,
      sendMessage,
      getJobMessages,
      getUnreadMessageCount,
      // Notifications
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      getUnreadNotificationCount,
      getUserNotifications,
      removeNotification,
      archiveNotification,
      unarchiveNotification,
      pinNotification,
      unpinNotification,
      notifPinned,
      getArchivedNotifications,
      // Financial
      transactions,
      withdrawals,
      getWalletBalance,
      getThisMonthEarnings,
      getLastMonthEarnings,
      getPendingWithdrawals,
      getUserTransactions,
      requestWithdrawal,
      approveWithdrawal,
      rejectWithdrawal,
      // Cancellation
      getCancellationCount,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
