// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Socket.IO Configuration
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'usta_go_token',
  USER: 'usta_go_user',
  REFRESH_TOKEN: 'usta_go_refresh_token',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/update-profile',
    CHANGE_PASSWORD: '/auth/change-password',
    LOGOUT: '/auth/logout',
  },

  // Jobs
  JOBS: {
    LIST: '/jobs',
    CREATE: '/jobs',
    GET: (id) => `/jobs/${id}`,
    ACCEPT: (id) => `/jobs/${id}/accept`,
    START: (id) => `/jobs/${id}/start`,
    COMPLETE: (id) => `/jobs/${id}/complete`,
    CANCEL: (id) => `/jobs/${id}/cancel`,
    RATE: (id) => `/jobs/${id}/rate`,
    DELETE: (id) => `/jobs/${id}`,
    BY_USER: (userId) => `/jobs/user/${userId}`,
  },

  // Messages
  MESSAGES: {
    SEND: '/messages',
    GET_CONVERSATION: (userId) => `/messages/${userId}`,
    GET_JOB_MESSAGES: (jobId) => `/messages/job/${jobId}`,
    GET_CONVERSATIONS: '/messages/conversations',
    MARK_READ: (id) => `/messages/${id}/read`,
    DELETE: (id) => `/messages/${id}`,
  },

  // Wallet
  WALLET: {
    GET: '/wallet',
    GET_TRANSACTIONS: '/wallet/transactions',
    GET_EARNINGS: '/wallet/earnings',
    TOPUP: '/wallet/topup',
    WITHDRAW: '/wallet/withdraw',
    ADD_COUPON: '/wallet/coupon',
    RELEASE_ESCROW: (jobId) => `/wallet/escrow-release/${jobId}`,
  },

  // Upload
  UPLOAD: {
    SINGLE: '/upload/photo',
    MULTIPLE: '/upload/photos',
  },
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
