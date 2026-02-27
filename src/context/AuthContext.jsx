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

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
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

  const register = useCallback(async (email, password, name, role, phone = '', referralCode = null) => {
    try {
      setError(null)
      const response = await fetchAPI(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: { 
  email, 
  password, 
  name, 
  role: role?.toUpperCase() || 'CUSTOMER', 
  phone, 
  referralCode 
},
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

  // --- UNREAD MESSAGE NOTIFICATIONS (on app startup) ---
  useEffect(() => {
    if (!user || useLocalStorage) return

    const loadUnreadNotifications = async () => {
      try {
        const response = await fetchAPI(API_ENDPOINTS.MESSAGES.GET_UNREAD)
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
           const notifs = response.data.map(msg => ({
            id: 'msg_' + msg.id,
            type: 'message',
            title: `${msg.sender?.name || 'Yeni Mesaj'}`,
            message: msg.content?.substring(0, 80) || 'Yeni bir mesaj aldınız',
            icon: '💬',
            targetUserId: user.id,
            read: false,
            time: msg.createdAt || new Date().toISOString(),
          }))
          setNotifications(notifs)
        }
      } catch (err) {
        console.warn('Could not load unread messages:', err)
      }
    }

    loadUnreadNotifications()
  }, [user?.id, useLocalStorage])

  // --- NOTIFICATIONS ---
  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ...notif,
      read: false,
      time: new Date().toISOString(),
    }
    setNotifications(prev => [newNotif, ...prev])
  }, [])

  const markNotificationRead = useCallback(async (notifId) => {
    try {
      if (useLocalStorage) {
        setNotifications(prev => prev.map(n =>
          n.id === notifId ? { ...n, read: true } : n
        ))
      } else {
        // API call would be handled server-side in production
        setNotifications(prev => prev.map(n =>
          n.id === notifId ? { ...n, read: true } : n
        ))
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [useLocalStorage])

  const markAllNotificationsRead = useCallback(async () => {
    try {
      if (useLocalStorage) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      } else {
        // API call would be handled server-side in production
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }, [useLocalStorage])

  const getUnreadNotificationCount = useCallback(() => {
    if (!user) return 0
    return notifications.filter(n => !n.read && n.targetUserId === user.id).length
  }, [notifications, user])

  const getUserNotifications = useCallback(() => {
    if (!user) return []
    return notifications.filter(n => n.targetUserId === user.id)
  }, [notifications, user])

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
          icon: '✨'
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
          icon: '✅'
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

      // Upload photos if provided
      let photoUrls = []
      if (beforePhotos && beforePhotos.length > 0) {
        const uploadResponse = await uploadFiles(API_ENDPOINTS.UPLOAD.MULTIPLE, beforePhotos, 'photos')
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
          icon: '🚀'
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
        // Fallback to localStorage
        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'completed', afterPhotos, completedAt: new Date().toISOString() }
            : job
        ))
        return
      }

      // Upload photos if provided
      let photoUrls = []
      if (afterPhotos && afterPhotos.length > 0) {
        const uploadResponse = await uploadFiles(API_ENDPOINTS.UPLOAD.MULTIPLE, afterPhotos, 'photos')
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
          message: 'İş tamamlandı. Lütfen değerlendiriniz.',
          icon: '🎉'
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
          icon: '❌'
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
          icon: '⭐'
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
          icon: '💰'
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
          icon: '💬'
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
          icon: '💬'
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
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
