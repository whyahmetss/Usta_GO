import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Mock data - Backend bağlanana kadar
const INITIAL_JOBS = [
  {
    id: '1',
    title: 'Elektrik Arızası',
    customer: { id: 'c1', name: 'Ayşe Kaya', phone: '0532 111 2233', avatar: '👩' },
    professional: null,
    location: { address: 'Kadıköy, İstanbul', lat: 40.9929, lng: 29.0260 },
    description: 'Salon prizlerinde elektrik kesintisi var.',
    price: 350,
    date: new Date().toISOString(),
    status: 'pending', // pending, accepted, in_progress, completed, rated
    urgent: true,
    category: 'electric',
    beforePhotos: [],
    afterPhotos: [],
    rating: null
  },
  {
    id: '2',
    title: 'Avize Montajı',
    customer: { id: 'c2', name: 'Mehmet Yılmaz', phone: '0533 222 3344', avatar: '👨' },
    professional: null,
    location: { address: 'Beşiktaş, İstanbul', lat: 41.0422, lng: 29.0067 },
    description: 'Yeni avize monte edilecek.',
    price: 250,
    date: new Date(Date.now() + 86400000).toISOString(),
    status: 'pending',
    urgent: false,
    category: 'electric',
    beforePhotos: [],
    afterPhotos: [],
    rating: null
  }
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedJobs = localStorage.getItem('jobs')
    const savedMessages = localStorage.getItem('messages')
    
    if (savedUser) setUser(JSON.parse(savedUser))
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs))
    } else {
      setJobs(INITIAL_JOBS)
      localStorage.setItem('jobs', JSON.stringify(INITIAL_JOBS))
    }
    if (savedMessages) setMessages(JSON.parse(savedMessages))
    
    setIsLoading(false)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!isLoading && jobs.length > 0) {
      localStorage.setItem('jobs', JSON.stringify(jobs))
    }
  }, [jobs, isLoading])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('messages', JSON.stringify(messages))
    }
  }, [messages, isLoading])

  const login = (email, password) => {
    if (email === 'admin@admin.com' && password === '1234') {
      const adminUser = {
        id: 'admin-001',
        email: 'admin@admin.com',
        name: 'Admin',
        role: 'admin'
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

    return { success: false, error: 'E-posta veya şifre hatalı' }
  }

  const register = (email, password, name, role) => {
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]')
    
    if (savedUsers.find(u => u.email === email)) {
      return { success: false, error: 'Bu e-posta zaten kayıtlı' }
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: role || 'customer',
      phone: '',
      avatar: role === 'professional' ? '⚡' : '👤',
      rating: 0,
      completedJobs: 0,
      createdAt: new Date().toISOString()
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

  // Job Management
  const acceptJob = (jobId) => {
    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { ...job, status: 'accepted', professional: user }
        : job
    ))
  }

  const startJob = (jobId, beforePhotos) => {
    setJobs(jobs.map(job =>
      job.id === jobId
        ? { ...job, status: 'in_progress', beforePhotos, startedAt: new Date().toISOString() }
        : job
    ))
  }

  const completeJob = (jobId, afterPhotos) => {
    setJobs(jobs.map(job =>
      job.id === jobId
        ? { ...job, status: 'completed', afterPhotos, completedAt: new Date().toISOString() }
        : job
    ))
  }

  const rateJob = (jobId, rating, review) => {
    setJobs(jobs.map(job =>
      job.id === jobId
        ? { ...job, status: 'rated', rating: { ...rating, review } }
        : job
    ))
  }

  // Messaging
  const sendMessage = (jobId, text, sender) => {
    const newMessage = {
      id: Date.now().toString(),
      jobId,
      text,
      sender,
      timestamp: new Date().toISOString()
    }
    setMessages([...messages, newMessage])
  }

  const getJobMessages = (jobId) => {
    return messages.filter(m => m.jobId === jobId)
  }

  const getUserJobs = (userId, userRole) => {
    if (userRole === 'customer') {
      return jobs.filter(j => j.customer.id === userId)
    } else if (userRole === 'professional') {
      return jobs.filter(j => j.professional?.id === userId)
    }
    return jobs
  }

  const getPendingJobs = () => {
    return jobs.filter(j => j.status === 'pending')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading,
      jobs,
      acceptJob,
      startJob,
      completeJob,
      rateJob,
      sendMessage,
      getJobMessages,
      getUserJobs,
      getPendingJobs
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
