import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

const INITIAL_JOBS = [
  {
    id: '1',
    title: 'Elektrik Arizasi',
    customer: { id: 'c1', name: 'Ayse Kaya', phone: '0532 111 2233', avatar: '👩' },
    professional: null,
    location: { address: 'Kadikoy, Istanbul', lat: 40.9929, lng: 29.0260 },
    description: 'Salon prizlerinde elektrik kesintisi var.',
    price: 350,
    date: new Date().toISOString(),
    status: 'pending',
    urgent: true,
    category: 'electric',
    beforePhotos: [],
    afterPhotos: [],
    rating: null,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Avize Montaji',
    customer: { id: 'c2', name: 'Mehmet Yilmaz', phone: '0533 222 3344', avatar: '👨' },
    professional: null,
    location: { address: 'Besiktas, Istanbul', lat: 41.0422, lng: 29.0067 },
    description: 'Yeni avize monte edilecek.',
    price: 250,
    date: new Date(Date.now() + 86400000).toISOString(),
    status: 'pending',
    urgent: false,
    category: 'electric',
    beforePhotos: [],
    afterPhotos: [],
    rating: null,
    createdAt: new Date().toISOString()
  }
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedJobs = localStorage.getItem('jobs')
    const savedMessages = localStorage.getItem('messages')
    const savedNotifications = localStorage.getItem('notifications')
    const savedTransactions = localStorage.getItem('transactions')
    const savedWithdrawals = localStorage.getItem('withdrawals')

    if (savedUser) setUser(JSON.parse(savedUser))
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs))
    } else {
      setJobs(INITIAL_JOBS)
      localStorage.setItem('jobs', JSON.stringify(INITIAL_JOBS))
    }
    if (savedMessages) setMessages(JSON.parse(savedMessages))
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications))
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions))
    if (savedWithdrawals) setWithdrawals(JSON.parse(savedWithdrawals))

    setIsLoading(false)
  }, [])

  // Persist to localStorage on changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('jobs', JSON.stringify(jobs))
    }
  }, [jobs, isLoading])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('messages', JSON.stringify(messages))
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }
  }, [notifications, isLoading])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('transactions', JSON.stringify(transactions))
    }
  }, [transactions, isLoading])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('withdrawals', JSON.stringify(withdrawals))
    }
  }, [withdrawals, isLoading])

  // --- AUTH ---
  const login = (email, password) => {
    if (email === 'admin@admin.com' && password === '1234') {
      const adminUser = {
        id: 'admin-001',
        email: 'admin@admin.com',
        name: 'Admin',
        role: 'admin',
        avatar: '👑',
        createdAt: new Date().toISOString()
      }

      // Add admin to users list if not already there
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')
      if (!savedUsers.find(u => u.id === 'admin-001')) {
        savedUsers.push(adminUser)
        localStorage.setItem('users', JSON.stringify(savedUsers))
      }

      setUser(adminUser)
      localStorage.setItem('user', JSON.stringify(adminUser))
      return { success: true, role: 'admin' }
    }

    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const foundUser = savedUsers.find(u => u.email === email && u.password === password)

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem('user', JSON.stringify(userWithoutPassword))
      return { success: true, role: foundUser.role }
    }

    return { success: false, error: 'E-posta veya sifre hatali' }
  }

  const register = (email, password, name, role, referralCode = null) => {
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')

    if (savedUsers.find(u => u.email === email)) {
      return { success: false, error: 'Bu e-posta zaten kayitli' }
    }

    // Generate unique referral code
    const generateReferralCode = () => {
      return `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: role || 'customer',
      phone: '',
      avatar: role === 'professional' ? '⚡' : '👤',
      profilePhoto: null,
      rating: 0,
      completedJobs: 0,
      createdAt: new Date().toISOString(),
      // Financial
      balance: 0,
      escrowBalance: 0,
      totalSpent: 0,
      // Referral System
      referralCode: generateReferralCode(),
      referredBy: null,
      referralCount: 0,
      // Coupons & Loyalty
      coupons: [],
      loyaltyPoints: 0,
      // Professional Verification
      verificationStatus: 'unverified', // unverified, pending, verified
      licenseCertificate: null,
      verificationDocuments: [],
      // Complaints & Warnings
      warnings: [],
      // Settings
      reminderSettings: {
        electricalCheck: true,
        plumbingMaintenance: true
      }
    }

    // Process referral if provided
    if (referralCode) {
      const referrer = savedUsers.find(u => u.referralCode === referralCode)
      if (referrer) {
        newUser.referredBy = referrer.id
        // Add ₺50 coupon to both
        newUser.coupons.push({
          id: Date.now().toString(),
          code: `REF-${Date.now()}`,
          amount: 50,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          used: false,
          usedOn: null
        })
        // Update referrer
        referrer.referralCount += 1
        referrer.coupons.push({
          id: Date.now().toString() + '1',
          code: `REF-${Date.now()}-1`,
          amount: 50,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          used: false,
          usedOn: null
        })
        // Update referrer in users array
        const referrerIndex = savedUsers.findIndex(u => u.id === referrer.id)
        savedUsers[referrerIndex] = referrer
      }
    }

    savedUsers.push(newUser)
    localStorage.setItem('users', JSON.stringify(savedUsers))

    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem('user', JSON.stringify(userWithoutPassword))

    return { success: true, role: newUser.role }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

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

  const markNotificationRead = useCallback((notifId) => {
    setNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    ))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const getUnreadNotificationCount = useCallback(() => {
    if (!user) return 0
    return notifications.filter(n => !n.read && n.targetUserId === user.id).length
  }, [notifications, user])

  const getUserNotifications = useCallback(() => {
    if (!user) return []
    return notifications.filter(n => n.targetUserId === user.id)
  }, [notifications, user])

  // --- JOBS ---
  // Helper function to get region multiplier
  const getRegionMultiplier = (address) => {
    if (!address) return 1.0
    const premiumZones = ['Kadikoy', 'Besiktas', 'Nisantasi']
    const economyZones = ['Esenyurt', 'Sultanbeyli']

    const upperAddress = address.toUpperCase()
    if (premiumZones.some(zone => upperAddress.includes(zone.toUpperCase()))) {
      return 1.3
    }
    if (economyZones.some(zone => upperAddress.includes(zone.toUpperCase()))) {
      return 1.0
    }
    return 1.15 // Default for other zones
  }

  const createJob = useCallback((jobData) => {
    // Calculate regional pricing
    const basePrice = jobData.price
    const regionMultiplier = getRegionMultiplier(jobData.location?.address)
    const finalPrice = Math.round(basePrice * regionMultiplier)

    const newJob = {
      id: Date.now().toString(),
      ...jobData,
      price: finalPrice,
      basePrice: basePrice,
      regionMultiplier: regionMultiplier,
      status: 'pending',
      beforePhotos: [],
      afterPhotos: [],
      rating: null,
      createdAt: new Date().toISOString(),
      // Escrow System
      escrowAmount: 0,
      escrowStatus: 'pending', // pending, released, refunded
      // Complaint System
      complaint: null
    }

    setJobs(prev => [...prev, newJob])

    // Immediately save to localStorage (don't wait for state update)
    const currentJobs = JSON.parse(localStorage.getItem('jobs') || '[]')
    currentJobs.push(newJob)
    localStorage.setItem('jobs', JSON.stringify(currentJobs))

    // Auto-match: notify all professionals about the new job
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const professionals = savedUsers.filter(u => u.role === 'professional')

    professionals.forEach(pro => {
      const notif = {
        type: 'job',
        title: 'Yeni Is Talebi',
        message: `${newJob.title} - ${newJob.location.address} (${newJob.price} TL)`,
        icon: '⚡',
        targetUserId: pro.id,
        jobId: newJob.id,
      }
      // Directly add to notifications state
      const newNotif = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5) + pro.id,
        ...notif,
        read: false,
        time: new Date().toISOString(),
      }
      setNotifications(prev => [newNotif, ...prev])
    })

    return newJob
  }, [])

  const acceptJob = useCallback((jobId) => {
    setJobs(prev => {
      const updated = prev.map(job => {
        if (job.id === jobId) {
          // Hold escrow: deduct from customer's balance
          const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')
          const customerIndex = savedUsers.findIndex(u => u.id === job.customer.id)
          if (customerIndex !== -1) {
            const finalPrice = job.price || job.basePrice
            savedUsers[customerIndex].escrowBalance += finalPrice
            savedUsers[customerIndex].balance = Math.max(0, savedUsers[customerIndex].balance - finalPrice)
            localStorage.setItem('users', JSON.stringify(savedUsers))
          }

          // Notify customer
          const notif = {
            id: Date.now().toString() + 'accept',
            type: 'status',
            title: 'Is Kabul Edildi',
            message: `${user.name} isinizi kabul etti: ${job.title}`,
            icon: '✅',
            targetUserId: job.customer.id,
            jobId: job.id,
            read: false,
            time: new Date().toISOString(),
          }
          setNotifications(prev => [notif, ...prev])

          const finalPrice = job.price || job.basePrice
          return {
            ...job,
            status: 'accepted',
            professional: user,
            acceptedAt: new Date().toISOString(),
            escrowAmount: finalPrice,
            escrowStatus: 'pending'
          }
        }
        return job
      })
      // Immediately save to localStorage
      localStorage.setItem('jobs', JSON.stringify(updated))
      return updated
    })
  }, [user])

  const startJob = useCallback((jobId, beforePhotos) => {
    setJobs(prev => {
      const updated = prev.map(job => {
        if (job.id === jobId) {
          // Notify customer
          const notif = {
            id: Date.now().toString() + 'start',
            type: 'status',
            title: 'Is Basladi',
            message: `${user.name} isinize basladi: ${job.title}`,
            icon: '🚀',
            targetUserId: job.customer.id,
            jobId: job.id,
            read: false,
            time: new Date().toISOString(),
          }
          setNotifications(prev => [notif, ...prev])

          return { ...job, status: 'in_progress', beforePhotos, startedAt: new Date().toISOString() }
        }
        return job
      })
      // Immediately save to localStorage
      localStorage.setItem('jobs', JSON.stringify(updated))
      return updated
    })
  }, [user])

  const completeJob = useCallback((jobId, afterPhotos) => {
    setJobs(prev => {
      const updated = prev.map(job => {
        if (job.id === jobId) {
          // Add earning to professional wallet
          const earning = {
            id: Date.now().toString(),
            type: 'earning',
            title: `${job.title} - ${job.location.address}`,
            amount: job.price,
            date: new Date().toISOString(),
            status: 'completed',
            jobId: job.id,
            professionalId: job.professional?.id || user.id,
          }
          setTransactions(prev => [earning, ...prev])

          // Update professional's completedJobs count in users list
          const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')
          const proId = job.professional?.id || user.id
          const updatedUsers = savedUsers.map(u => {
            if (u.id === proId) {
              return { ...u, completedJobs: (u.completedJobs || 0) + 1 }
            }
            return u
          })
          localStorage.setItem('users', JSON.stringify(updatedUsers))

          // Notify customer
          const notif = {
            id: Date.now().toString() + 'complete',
            type: 'status',
            title: 'Is Tamamlandi',
            message: `${job.title} tamamlandi. Lutfen degerlendirin.`,
            icon: '🎉',
            targetUserId: job.customer.id,
            jobId: job.id,
            read: false,
            time: new Date().toISOString(),
          }
          setNotifications(prev => [notif, ...prev])

          return { ...job, status: 'completed', afterPhotos, completedAt: new Date().toISOString() }
        }
        return job
      })
      // Immediately save to localStorage
      localStorage.setItem('jobs', JSON.stringify(updated))
      return updated
    })
  }, [user])

  const cancelJob = useCallback((jobId, reason, penalty) => {
    setJobs(prev => {
      const updated = prev.map(job => {
        if (job.id === jobId) {
          // Track cancellations in localStorage
          const cancellations = JSON.parse(localStorage.getItem('cancellations') || '{}')
          const userId = user.id
          if (!cancellations[userId]) {
            cancellations[userId] = { count: 0, history: [] }
          }
          cancellations[userId].count += 1
          cancellations[userId].history.push({
            jobId,
            reason,
            penalty,
            date: new Date().toISOString()
          })
          localStorage.setItem('cancellations', JSON.stringify(cancellations))

          // Apply penalty - deduct from balance
          if (penalty > 0) {
            const penaltyTransaction = {
              id: Date.now().toString() + 'penalty',
              type: 'penalty',
              title: `Iptal Cezasi - ${job.title}`,
              amount: -penalty,
              date: new Date().toISOString(),
              status: 'completed',
              professionalId: user.role === 'professional' ? user.id : (job.professional?.id || null),
            }
            setTransactions(prev => [penaltyTransaction, ...prev])
          }

          // If customer cancels an accepted/in_progress job, refund can happen
          if (user.role === 'customer' && job.status !== 'pending') {
            const refundNotif = {
              id: Date.now().toString() + 'refund',
              type: 'status',
              title: 'Is Iptal Edildi',
              message: `${job.title} musteri tarafindan iptal edildi.`,
              icon: '❌',
              targetUserId: job.professional?.id,
              jobId: job.id,
              read: false,
              time: new Date().toISOString(),
            }
            if (job.professional?.id) {
              setNotifications(prev => [refundNotif, ...prev])
            }
          }

          // If professional cancels, notify customer
          if (user.role === 'professional') {
            const cancelNotif = {
              id: Date.now().toString() + 'cancel',
              type: 'status',
              title: 'Is Iptal Edildi',
              message: `${user.name} isinizi iptal etti: ${job.title}`,
              icon: '❌',
              targetUserId: job.customer.id,
              jobId: job.id,
              read: false,
              time: new Date().toISOString(),
            }
            setNotifications(prev => [cancelNotif, ...prev])
          }

          return {
            ...job,
            status: 'cancelled',
            cancelledBy: user.role,
            cancelReason: reason,
            cancelPenalty: penalty,
            cancelledAt: new Date().toISOString()
          }
        }
        return job
      })
      // Immediately save to localStorage
      localStorage.setItem('jobs', JSON.stringify(updated))
      return updated
    })
  }, [user])

  const rateJob = useCallback((jobId, ratingData, review) => {
    setJobs(prev => {
      const updated = prev.map(job => {
        if (job.id === jobId) {
          // Notify the rated person
          const targetId = user.role === 'customer'
            ? job.professional?.id
            : job.customer.id
          const stars = ratingData.customerRating || ratingData.professionalRating

          if (targetId) {
            const ratingNotif = {
              id: Date.now().toString() + 'rate',
              type: 'rating',
              title: 'Yeni Degerlendirme',
              message: `${user.name} size ${stars} yildiz verdi!`,
              icon: '⭐',
              targetUserId: targetId,
              jobId: job.id,
              read: false,
              time: new Date().toISOString(),
            }
            setNotifications(prev => [ratingNotif, ...prev])
          }

          // Update professional's rating in users list and release escrow
          if (user.role === 'customer' && job.professional?.id) {
            const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')
            const proId = job.professional.id
            const proJobs = updated.filter(j =>
              j.professional?.id === proId && j.rating && (j.rating.customerRating || j.rating.professionalRating)
            )
            const totalRatings = proJobs.reduce((sum, j) => {
              return sum + (j.rating.customerRating || j.rating.professionalRating || 0)
            }, 0) + stars
            const avgRating = totalRatings / (proJobs.length + 1)

            const updatedUsers = savedUsers.map(u => {
              if (u.id === proId) {
                // Release escrow: add to professional's wallet
                const escrowAmount = job.escrowAmount || job.price || job.basePrice
                return {
                  ...u,
                  rating: Math.round(avgRating * 10) / 10,
                  balance: (u.balance || 0) + escrowAmount,
                  completedJobs: (u.completedJobs || 0) + 1
                }
              }
              // Release customer's escrow hold & award loyalty coupons
              if (u.id === job.customer.id) {
                const escrowAmount = job.escrowAmount || job.price || job.basePrice
                const newCompletedJobs = (u.completedJobs || 0) + 1
                const newCoupons = [...(u.coupons || [])]

                // Award loyalty coupons on milestones
                if (newCompletedJobs === 5) {
                  newCoupons.push({
                    id: Date.now().toString(),
                    code: `LOYAL5-${Date.now()}`,
                    amount: 25,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    used: false,
                    usedOn: null,
                    reason: '5 işe ulaştığınız için teşekkürler!'
                  })
                }
                if (newCompletedJobs === 10) {
                  newCoupons.push({
                    id: Date.now().toString() + '1',
                    code: `LOYAL10-${Date.now()}`,
                    amount: 50,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    used: false,
                    usedOn: null,
                    reason: '10 işe ulaştığınız için teşekkürler!'
                  })
                }
                if (newCompletedJobs === 20) {
                  newCoupons.push({
                    id: Date.now().toString() + '2',
                    code: `LOYAL20-${Date.now()}`,
                    amount: 100,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    used: false,
                    usedOn: null,
                    reason: '20 işe ulaştığınız için teşekkürler!'
                  })
                }

                return {
                  ...u,
                  escrowBalance: Math.max(0, (u.escrowBalance || 0) - escrowAmount),
                  totalSpent: (u.totalSpent || 0) + escrowAmount,
                  completedJobs: newCompletedJobs,
                  coupons: newCoupons
                }
              }
              return u
            })
            localStorage.setItem('users', JSON.stringify(updatedUsers))
          }

          return {
            ...job,
            status: 'rated',
            rating: { ...ratingData, review },
            escrowStatus: 'completed'
          }
        }
        return job
      })
      // Immediately save to localStorage
      localStorage.setItem('jobs', JSON.stringify(updated))
      return updated
    })
  }, [user])

  // --- FINANCIAL ---
  const getWalletBalance = useCallback((professionalId) => {
    const pid = professionalId || user?.id
    if (!pid) return 0
    const userTransactions = transactions.filter(t => t.professionalId === pid)
    return userTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [transactions, user])

  const getThisMonthEarnings = useCallback((professionalId) => {
    const pid = professionalId || user?.id
    if (!pid) return 0
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
  }, [transactions, user])

  const getLastMonthEarnings = useCallback((professionalId) => {
    const pid = professionalId || user?.id
    if (!pid) return 0
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
  }, [transactions, user])

  const getPendingWithdrawals = useCallback((professionalId) => {
    const pid = professionalId || user?.id
    if (!pid) return 0
    return withdrawals
      .filter(w => w.professionalId === pid && w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0)
  }, [withdrawals, user])

  const getUserTransactions = useCallback((professionalId) => {
    const pid = professionalId || user?.id
    if (!pid) return []
    return transactions.filter(t => t.professionalId === pid)
  }, [transactions, user])

  const requestWithdrawal = useCallback((amount, bankName, iban, accountHolder) => {
    const balance = getWalletBalance()
    const pendingAmount = getPendingWithdrawals()
    const available = balance - pendingAmount

    if (amount > available) {
      return { success: false, error: 'Yetersiz bakiye' }
    }
    if (amount < 100) {
      return { success: false, error: 'Minimum cekim tutari 100 TL' }
    }

    const withdrawal = {
      id: Date.now().toString(),
      professionalId: user.id,
      professional: { name: user.name, avatar: user.avatar || '⚡' },
      amount,
      bankName,
      iban,
      accountHolder,
      requestDate: new Date().toISOString(),
      status: 'pending'
    }

    setWithdrawals(prev => {
      const updated = [withdrawal, ...prev]
      // Immediately save to localStorage
      localStorage.setItem('withdrawals', JSON.stringify(updated))
      return updated
    })

    // Notify admin
    const adminNotif = {
      id: Date.now().toString() + 'withdraw',
      type: 'withdrawal',
      title: 'Yeni Para Cekme Talebi',
      message: `${user.name} - ${amount} TL cekim talebi`,
      icon: '💰',
      targetUserId: 'admin-001',
      read: false,
      time: new Date().toISOString(),
    }
    setNotifications(prev => [adminNotif, ...prev])

    return { success: true }
  }, [user, getWalletBalance, getPendingWithdrawals])

  const approveWithdrawal = useCallback((withdrawalId) => {
    setWithdrawals(prev => {
      const updated = prev.map(w => {
        if (w.id === withdrawalId) {
          // Create withdrawal transaction
          const withdrawalTx = {
            id: Date.now().toString() + 'wd',
            type: 'withdrawal',
            title: 'Para Cekme - Onaylandi',
            amount: -w.amount,
            date: new Date().toISOString(),
            status: 'completed',
            professionalId: w.professionalId,
          }
          setTransactions(prev => [withdrawalTx, ...prev])

          // Notify professional
          const notif = {
            id: Date.now().toString() + 'wdapprove',
            type: 'status',
            title: 'Cekim Onaylandi',
            message: `${w.amount} TL cekim talebiniz onaylandi.`,
            icon: '✅',
            targetUserId: w.professionalId,
            read: false,
            time: new Date().toISOString(),
          }
          setNotifications(prev => [notif, ...prev])

          return { ...w, status: 'approved', processedDate: new Date().toISOString() }
        }
        return w
      })
      // Immediately save to localStorage
      localStorage.setItem('withdrawals', JSON.stringify(updated))
      return updated
    })
  }, [])

  const rejectWithdrawal = useCallback((withdrawalId, rejectionReason) => {
    setWithdrawals(prev => {
      const updated = prev.map(w => {
        if (w.id === withdrawalId) {
          // Notify professional
          const notif = {
            id: Date.now().toString() + 'wdreject',
            type: 'status',
            title: 'Cekim Reddedildi',
            message: `${w.amount} TL cekim talebiniz reddedildi. Neden: ${rejectionReason || 'Belirtilmedi'}`,
            icon: '❌',
            targetUserId: w.professionalId,
            read: false,
            time: new Date().toISOString(),
          }
          setNotifications(prev => [notif, ...prev])

          return { ...w, status: 'rejected', processedDate: new Date().toISOString(), rejectionReason }
        }
        return w
      })
      // Immediately save to localStorage
      localStorage.setItem('withdrawals', JSON.stringify(updated))
      return updated
    })
  }, [])

  // --- MESSAGING ---
  const sendMessage = useCallback((jobId, text, sender) => {
    const newMessage = {
      id: Date.now().toString(),
      jobId,
      text,
      sender,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => {
      const updated = [...prev, newMessage]
      // Immediately save to localStorage
      localStorage.setItem('messages', JSON.stringify(updated))
      return updated
    })

    // Find the job to notify the other party
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      const targetId = sender === 'customer' ? job.professional?.id : job.customer.id
      const senderName = sender === 'customer' ? job.customer.name : (job.professional?.name || 'Usta')
      if (targetId) {
        const msgNotif = {
          id: Date.now().toString() + 'msg' + Math.random().toString(36).substr(2, 3),
          type: 'message',
          title: 'Yeni Mesaj',
          message: `${senderName}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          icon: '💬',
          targetUserId: targetId,
          jobId,
          read: false,
          time: new Date().toISOString(),
        }
        setNotifications(prev => [msgNotif, ...prev])
      }
    }
  }, [jobs])

  const getJobMessages = useCallback((jobId) => {
    return messages.filter(m => m.jobId === jobId)
  }, [messages])

  const getUserJobs = useCallback((userId, userRole) => {
    if (userRole === 'customer') {
      return jobs.filter(j => j.customer.id === userId)
    } else if (userRole === 'professional') {
      return jobs.filter(j => j.professional?.id === userId)
    }
    return jobs
  }, [jobs])

  const getPendingJobs = useCallback(() => {
    return jobs.filter(j => j.status === 'pending')
  }, [jobs])

  const getCancellationCount = useCallback((userId) => {
    const cancellations = JSON.parse(localStorage.getItem('cancellations') || '{}')
    return cancellations[userId || user?.id]?.count || 0
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
