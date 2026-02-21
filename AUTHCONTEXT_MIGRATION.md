# AuthContext.jsx API Integration - Migration Guide

## Overview
The new `AuthContext.jsx` has been completely refactored to use the backend API instead of localStorage, while maintaining full backward compatibility and supporting a smooth transition period.

## Key Features

### 1. API-Integrated Design
- All operations now call the backend API using `fetchAPI()` helper
- JWT token management via `getToken()`, `setToken()`, `removeToken()`
- Automatic token inclusion in Authorization headers
- 401 Unauthorized handling with automatic redirect to `/auth`

### 2. Hybrid Mode with Fallback Support
- **useLocalStorage flag**: Tracks whether the app is using API or localStorage
- Automatic fallback: If API fails, falls back to localStorage
- Smooth transition: Existing localStorage data works during migration
- Production-ready: Apps can run with either backend or localStorage

### 3. Comprehensive Error Handling
- Try-catch blocks on all API operations
- Meaningful error messages stored in `error` state
- Console logging for debugging
- User-friendly error notifications
- Automatic token clearing on 401 responses

### 4. Loading States
- Global `isLoading` state during app initialization
- Per-function error handling and recovery
- Network timeout protection (30 seconds default)

## Implementation Details

### Authentication (API Endpoints)
```javascript
login(email, password)
  → POST /api/auth/login
  → Returns: { token, user }
  → Sets JWT token and user data

register(email, password, name, role, phone, referralCode)
  → POST /api/auth/register
  → Returns: { token, user }
  → Handles referral system on backend

logout()
  → POST /api/auth/logout
  → Clears token and all cached data
  → Redirects to /auth on 401
```

### Job Management (API Endpoints)
```javascript
createJob(jobData)
  → POST /api/jobs
  → Accepts: job details, location, pricing

acceptJob(jobId)
  → PUT /api/jobs/:id/accept
  → Holds escrow amount

startJob(jobId, beforePhotos)
  → PUT /api/jobs/:id/start
  → Uploads photos via /api/upload/photos

completeJob(jobId, afterPhotos)
  → PUT /api/jobs/:id/complete
  → Uploads completion photos

cancelJob(jobId, reason, penalty)
  → PUT /api/jobs/:id/cancel
  → Handles penalty deduction

rateJob(jobId, ratingData, review)
  → PUT /api/jobs/:id/rate
  → Releases escrow to professional
```

### Wallet & Financial (API Endpoints)
```javascript
getWalletBalance(professionalId?)
  → GET /api/wallet
  → Returns: { balance }

getThisMonthEarnings(professionalId?)
  → GET /api/wallet/earnings
  → Returns: { thisMonth, lastMonth }

getPendingWithdrawals(professionalId?)
  → GET /api/wallet/transactions
  → Filters pending withdrawal transactions

requestWithdrawal(amount, bankName, iban, accountHolder)
  → POST /api/wallet/withdraw
  → Returns: withdrawal request object

getUserTransactions(professionalId?)
  → GET /api/wallet/transactions
  → Returns: array of transaction objects
```

### Messaging (API Endpoints)
```javascript
sendMessage(jobId, text, sender)
  → POST /api/messages
  → Returns: message object with ID

getJobMessages(jobId)
  → GET /api/messages/job/:jobId
  → Returns: array of messages
```

## State Management

### New State Variables
```javascript
const [error, setError] = useState(null)           // Error message from last operation
const [useLocalStorage, setUseLocalStorage] = useState(false) // Transition flag
```

### Existing State (Preserved for Backward Compatibility)
```javascript
const [user, setUser] = useState(null)
const [isLoading, setIsLoading] = useState(true)
const [jobs, setJobs] = useState([])
const [messages, setMessages] = useState([])
const [notifications, setNotifications] = useState([])
const [transactions, setTransactions] = useState([])
const [withdrawals, setWithdrawals] = useState([])
```

## API Response Format Expected

All API responses should follow this format:
```javascript
{
  success: boolean,
  data: {...},           // Actual response data
  message: string,       // Human-readable message
  error?: string        // Error details if applicable
}
```

## Migration Path for Frontend Components

### Before (localStorage-based)
```javascript
const { user, login } = useAuth()
const result = login('email@example.com', 'password')
// Returns: { success: true/false, role: string, error: string }
```

### After (API-based) - No Component Changes Needed!
```javascript
const { user, login, error } = useAuth()
const result = await login('email@example.com', 'password')
// Returns: { success: true/false, role: string, error: string }
// Same interface, but now calls API
```

**Key Point**: All function signatures remain identical. Components don't need to change!

## Error Handling in Components

```javascript
const { error, setError } = useAuth()

// Check for errors
useEffect(() => {
  if (error) {
    console.error('Auth error:', error)
    // Show user-friendly error message
    // toast.error(error)
  }
}, [error])

// Clear errors
useEffect(() => {
  return () => setError(null)
}, [])
```

## File Uploads Integration

Photos are automatically uploaded via:
- `startJob()`: Uploads before photos
- `completeJob()`: Uploads after photos
- Uses `uploadFiles()` helper from `/utils/api.js`
- Returns photo URLs to backend in job update

## Initialization Flow

1. App mounts
2. `AuthProvider` attempts to fetch auth data via `useEffect`
3. If token exists:
   - Try API call to `/api/auth/me`
   - Success: Use API mode
   - Failure: Fall back to localStorage
4. If no token but localStorage user exists:
   - Use localStorage mode for transition
5. `setIsLoading(false)` when complete

## Backward Compatibility Features

1. **localStorage Fallback**: If API is down, app still works with localStorage
2. **Function Signatures**: All function names and return types unchanged
3. **Error Recovery**: Graceful degradation with meaningful error messages
4. **Transition Flag**: `useLocalStorage` boolean for monitoring during migration

## New Context Properties (Available in useAuth())

```javascript
{
  // Existing
  user,
  login,
  register,
  logout,
  isLoading,

  // New
  error,                    // Last error message
  setError,                 // Clear error manually
  useLocalStorage,          // Indicates if using localStorage fallback

  // All other functions remain the same...
  jobs,
  createJob,
  acceptJob,
  startJob,
  completeJob,
  cancelJob,
  rateJob,
  getUserJobs,
  getPendingJobs,
  messages,
  sendMessage,
  getJobMessages,
  getUnreadMessageCount,
  notifications,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  getUserNotifications,
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
  getCancellationCount,
}
```

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Register new user
- [ ] Create job
- [ ] Accept job (escrow system)
- [ ] Start job with photos
- [ ] Complete job with photos
- [ ] Rate job (releases escrow)
- [ ] Cancel job (applies penalty)
- [ ] Send messages
- [ ] Request withdrawal
- [ ] Check wallet balance
- [ ] Verify error messages appear correctly
- [ ] Test fallback to localStorage (disable backend)
- [ ] Token persistence on refresh
- [ ] Automatic logout on 401 response

## Performance Considerations

1. **Reduced localStorage Writes**: Only on transition period
2. **Optimized API Calls**: Only when necessary
3. **Photo Upload Optimization**: Batch upload support
4. **Error Recovery**: Doesn't spam API on repeated failures
5. **Memory Efficient**: No redundant state duplication

## Security Features

1. **Token Management**: Automatic JWT handling
2. **Authorization Headers**: Automatic Bearer token injection
3. **401 Handling**: Auto redirect to /auth on unauthorized
4. **No Sensitive Data in State**: Passwords never stored
5. **HTTPS Ready**: Works with secured API endpoints

## Dependencies

- React 17+ (hooks support)
- `/utils/api.js` (fetchAPI, token helpers, upload functions)
- `/config.js` (API_ENDPOINTS, STORAGE_KEYS)

## Configuration

Set these environment variables:
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Future Enhancements

1. Real-time updates via WebSocket/Socket.IO
2. Offline support with service workers
3. Optimistic updates for faster UX
4. Caching strategy with TTL
5. Request deduplication
6. Rate limiting protection

## Support & Debugging

Enable debug logging:
```javascript
// Check if using API or localStorage
console.log('Using localStorage:', context.useLocalStorage)

// Check current error
console.log('Current error:', context.error)

// Monitor token
console.log('Token:', getToken())

// Check user data
console.log('User:', context.user)
```

