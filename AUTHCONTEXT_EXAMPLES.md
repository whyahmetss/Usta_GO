# AuthContext API Integration - Usage Examples

## Basic Usage Examples

### 1. Login Implementation
```javascript
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const { login, error, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const result = await login(email, password)

    if (result.success) {
      // Navigate based on role
      if (result.role === 'admin') {
        navigate('/admin')
      } else if (result.role === 'professional') {
        navigate('/professional/dashboard')
      } else {
        navigate('/customer/dashboard')
      }
    } else {
      // Error is automatically in context.error
      alert(result.error)
    }
  }

  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
```

### 2. Register Implementation
```javascript
function RegisterPage() {
  const { register, error, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async () => {
    const result = await register(
      'user@example.com',
      'password123',
      'John Doe',
      'professional',
      '05321234567',
      'REFERRAL_CODE' // optional
    )

    if (result.success) {
      navigate('/professional/dashboard')
    } else {
      alert(result.error)
    }
  }

  return (
    <div>
      <button onClick={handleRegister} disabled={isLoading}>
        Register
      </button>
      {error && <p>{error}</p>}
    </div>
  )
}
```

### 3. Create Job
```javascript
function CreateJobPage() {
  const { createJob, error, user } = useAuth()
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    location: { address: '', lat: 0, lng: 0 },
    category: 'electric',
    price: 0,
    urgent: false
  })

  const handleCreateJob = async () => {
    try {
      const newJob = await createJob({
        ...jobData,
        customerId: user.id
      })
      console.log('Job created:', newJob)
      // Redirect to job details
    } catch (err) {
      alert('Failed to create job')
    }
  }

  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); handleCreateJob() }}>
        <input
          value={jobData.title}
          onChange={e => setJobData({...jobData, title: e.target.value})}
          placeholder="Job Title"
        />
        <input
          value={jobData.price}
          onChange={e => setJobData({...jobData, price: Number(e.target.value)})}
          type="number"
          placeholder="Price"
        />
        <button type="submit">Create Job</button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
```

### 4. Accept Job (Professional)
```javascript
function JobCard({ job }) {
  const { acceptJob, error, user } = useAuth()
  const [isAccepting, setIsAccepting] = useState(false)

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await acceptJob(job.id)
      alert('Job accepted!')
      // Refresh job data or redirect
    } catch (err) {
      alert(error || 'Failed to accept job')
    } finally {
      setIsAccepting(false)
    }
  }

  if (job.status !== 'pending') {
    return null
  }

  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p>{job.location.address}</p>
      <p className="price">{job.price} TL</p>
      <button onClick={handleAccept} disabled={isAccepting}>
        {isAccepting ? 'Accepting...' : 'Accept Job'}
      </button>
    </div>
  )
}
```

### 5. Start Job with Before Photos
```javascript
function StartJobPage({ jobId }) {
  const { startJob, error, user } = useAuth()
  const [beforePhotos, setBeforePhotos] = useState([])
  const [isStarting, setIsStarting] = useState(false)

  const handleFileChange = (e) => {
    setBeforePhotos([...e.target.files])
  }

  const handleStartJob = async () => {
    setIsStarting(true)
    try {
      // beforePhotos are File objects, uploadFiles handles them
      await startJob(jobId, beforePhotos)
      alert('Job started with photos!')
      // Redirect to job tracking
    } catch (err) {
      alert(error || 'Failed to start job')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div>
      <h2>Start Job</h2>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        accept="image/*"
      />
      <p>{beforePhotos.length} photos selected</p>
      <button onClick={handleStartJob} disabled={isStarting}>
        {isStarting ? 'Starting...' : 'Start Job'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
```

### 6. Complete Job with After Photos
```javascript
function CompleteJobPage({ jobId }) {
  const { completeJob, error } = useAuth()
  const [afterPhotos, setAfterPhotos] = useState([])
  const [isCompleting, setIsCompleting] = useState(false)

  const handleCompleteJob = async () => {
    setIsCompleting(true)
    try {
      await completeJob(jobId, Array.from(afterPhotos))
      alert('Job completed! Waiting for customer rating.')
    } catch (err) {
      alert(error || 'Failed to complete job')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div>
      <h2>Complete Job</h2>
      <input
        type="file"
        multiple
        onChange={e => setAfterPhotos(e.target.files)}
        accept="image/*"
      />
      <button onClick={handleCompleteJob} disabled={isCompleting}>
        {isCompleting ? 'Submitting...' : 'Complete Job'}
      </button>
    </div>
  )
}
```

### 7. Rate Job (Release Escrow)
```javascript
function RateJobPage({ jobId, job }) {
  const { rateJob, error, user } = useAuth()
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [isRating, setIsRating] = useState(false)

  const handleRateJob = async () => {
    setIsRating(true)
    try {
      const ratingData = {
        customerRating: user.role === 'customer' ? rating : null,
        professionalRating: user.role === 'professional' ? rating : null
      }
      await rateJob(jobId, ratingData, review)
      alert('Thank you for your rating! Escrow released.')
    } catch (err) {
      alert(error || 'Failed to rate job')
    } finally {
      setIsRating(false)
    }
  }

  return (
    <div>
      <h2>Rate {user.role === 'customer' ? 'Professional' : 'Customer'}</h2>
      <div>
        <label>Rating:</label>
        <select value={rating} onChange={e => setRating(Number(e.target.value))}>
          <option value={5}>5 Stars</option>
          <option value={4}>4 Stars</option>
          <option value={3}>3 Stars</option>
          <option value={2}>2 Stars</option>
          <option value={1}>1 Star</option>
        </select>
      </div>
      <textarea
        value={review}
        onChange={e => setReview(e.target.value)}
        placeholder="Write your review..."
      />
      <button onClick={handleRateJob} disabled={isRating}>
        Submit Rating
      </button>
    </div>
  )
}
```

### 8. Get Wallet Balance
```javascript
function WalletWidget() {
  const { user, getWalletBalance, error } = useAuth()
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'professional') {
      const fetchBalance = async () => {
        setIsLoading(true)
        try {
          const bal = await getWalletBalance()
          setBalance(bal)
        } catch (err) {
          console.error('Failed to fetch balance:', err)
        } finally {
          setIsLoading(false)
        }
      }
      fetchBalance()
    }
  }, [user, getWalletBalance])

  if (user?.role !== 'professional') return null

  return (
    <div className="wallet-widget">
      <h3>Wallet Balance</h3>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <p className="balance">{balance} TL</p>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

### 9. Request Withdrawal
```javascript
function WithdrawalForm() {
  const { requestWithdrawal, error, user } = useAuth()
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [iban, setIban] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRequestWithdrawal = async () => {
    setIsSubmitting(true)
    try {
      const result = await requestWithdrawal(
        Number(amount),
        bankName,
        iban,
        accountHolder
      )

      if (result.success) {
        alert('Withdrawal request submitted!')
        // Reset form
        setAmount('')
        setBankName('')
        setIban('')
        setAccountHolder('')
      } else {
        alert(result.error)
      }
    } catch (err) {
      alert(error || 'Failed to request withdrawal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleRequestWithdrawal() }}>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount (TL)"
        min="100"
      />
      <input
        value={bankName}
        onChange={e => setBankName(e.target.value)}
        placeholder="Bank Name"
      />
      <input
        value={iban}
        onChange={e => setIban(e.target.value)}
        placeholder="IBAN"
      />
      <input
        value={accountHolder}
        onChange={e => setAccountHolder(e.target.value)}
        placeholder="Account Holder"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Request Withdrawal'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
```

### 10. Send Message
```javascript
function JobChat({ jobId }) {
  const { sendMessage, getJobMessages, error, user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await getJobMessages(jobId)
        setMessages(msgs)
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }
    loadMessages()
  }, [jobId, getJobMessages])

  const handleSendMessage = async () => {
    if (!text.trim()) return

    setIsLoading(true)
    try {
      const message = await sendMessage(jobId, text, user.role)
      setMessages([...messages, message])
      setText('')
    } catch (err) {
      alert(error || 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <div className="input">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type message..."
          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

### 11. Error Handling Pattern
```javascript
function ErrorBoundary() {
  const { error, setError, useLocalStorage } = useAuth()

  useEffect(() => {
    if (error) {
      console.error('Auth context error:', error)

      // Show error notification
      // toast.error(error)

      // Auto-clear after 5 seconds
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  return (
    <>
      {useLocalStorage && (
        <div className="warning-banner">
          Using local storage mode. Backend API is unavailable.
        </div>
      )}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </>
  )
}
```

### 12. Get User's Jobs
```javascript
function UserJobsPage() {
  const { user, getUserJobs, error } = useAuth()
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      const loadJobs = async () => {
        setIsLoading(true)
        try {
          const userJobs = await getUserJobs(user.id, user.role)
          setJobs(userJobs)
        } catch (err) {
          console.error('Failed to load jobs:', err)
        } finally {
          setIsLoading(false)
        }
      }
      loadJobs()
    }
  }, [user, getUserJobs])

  if (!user) return <p>Please login first</p>

  return (
    <div>
      <h2>My Jobs</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : jobs.length === 0 ? (
        <p>No jobs found</p>
      ) : (
        <div className="jobs-grid">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

### 13. Cancel Job
```javascript
function CancelJobModal({ jobId, onClose }) {
  const { cancelJob, error } = useAuth()
  const [reason, setReason] = useState('')
  const [penalty, setPenalty] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCancel = async () => {
    setIsSubmitting(true)
    try {
      await cancelJob(jobId, reason, penalty)
      alert('Job cancelled')
      onClose()
    } catch (err) {
      alert(error || 'Failed to cancel job')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal">
      <h2>Cancel Job</h2>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Reason for cancellation"
      />
      <input
        type="number"
        value={penalty}
        onChange={e => setPenalty(Number(e.target.value))}
        placeholder="Penalty amount (TL)"
      />
      <button onClick={handleCancel} disabled={isSubmitting}>
        Confirm Cancellation
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### 14. Pending Jobs List
```javascript
function PendingJobsList() {
  const { getPendingJobs, error } = useAuth()
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPendingJobs = async () => {
      try {
        const pendingJobs = await getPendingJobs()
        setJobs(pendingJobs)
      } catch (err) {
        console.error('Failed to load pending jobs:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadPendingJobs()

    // Refresh every 30 seconds
    const interval = setInterval(loadPendingJobs, 30000)
    return () => clearInterval(interval)
  }, [getPendingJobs])

  return (
    <div>
      <h2>Available Jobs</h2>
      {isLoading ? <p>Loading...</p> : (
        <div>
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
```

## Best Practices

1. **Always await API calls**: The new functions are async
   ```javascript
   const result = await login(email, password)
   ```

2. **Handle errors**: Check both return object and context error
   ```javascript
   if (!result.success) { /* handle error */ }
   if (error) { /* show user feedback */ }
   ```

3. **Use loading states**: Provide user feedback during operations
   ```javascript
   <button disabled={isSubmitting}>
     {isSubmitting ? 'Loading...' : 'Submit'}
   </button>
   ```

4. **Clean up on unmount**: Cancel pending operations
   ```javascript
   useEffect(() => {
     return () => setError(null)
   }, [])
   ```

5. **Don't leak sensitive data**: Never console.log user passwords or tokens

