// API Configuration
export const API_URL = 'https://usta-go-1.onrender.com/api';

// Socket.IO Configuration
export const SOCKET_URL = 'https://usta-go-1.onrender.com';

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
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    LOGOUT: '/auth/logout',
  },

  // Jobs
  JOBS: {
    LIST: '/jobs',
    MY_JOBS: '/jobs/my-jobs',
    CREATE: '/jobs',
    GET: (id) => `/jobs/${id}`,
    ACCEPT: (id) => `/jobs/${id}`,
    START: (id) => `/jobs/${id}/start`,
    COMPLETE: (id) => `/jobs/${id}/complete`,
    CANCEL: (id) => `/jobs/${id}/cancel`,
    RATE: (id) => `/jobs/${id}/rate`,
    DELETE: (id) => `/jobs/${id}`,
    BY_USER: (userId) => `/jobs/user/${userId}`,
  },

// Admin
  ADMIN: {
    GET_USERS: '/admin/users?limit=500',
    PENDING_USTAS: '/admin/pending-ustas',
    APPROVE_USTA: (userId) => `/admin/users/${userId}/approve-usta`,
    REJECT_USTA: (userId) => `/admin/users/${userId}/reject-usta`,
    DELETE_JOB: (id) => `/admin/jobs/${id}`,
    DELETE_USER: (id) => `/admin/users/${id}`,
    COUPONS: '/admin/coupons',
    CAMPAIGNS: {
      ACTIVE: '/admin/campaigns/active',
      SET: '/admin/campaigns',
      DELETE: '/admin/campaigns',
    },
  },

// Messages
  MESSAGES: {
    SEND: '/messages',
    GET_UNREAD: '/messages/unread',
    GET_CONVERSATION: (userId) => `/messages/${userId}`,
    GET_JOB_MESSAGES: (jobId) => `/messages/${jobId}`,
    GET_CONVERSATIONS: '/messages/conversations',
    MARK_READ: (id) => `/messages/${id}/read`,
    DELETE: (id) => `/messages/${id}`,
  },

  // Wallet
  WALLET: {
    GET: '/wallet',
    GET_TRANSACTIONS: '/wallet/transactions',
    GET_EARNINGS: '/wallet/earnings',
    ADMIN_TRANSACTIONS: '/wallet/admin/transactions',
    TOPUP: '/wallet/topup',
    TOPUP_INIT: '/wallet/topup/init',
    WITHDRAW: '/wallet/withdraw',
    ADD_COUPON: '/wallet/coupon',
    RELEASE_ESCROW: (jobId) => `/wallet/escrow-release/${jobId}`,
  },

  // Sertifika
  CERTIFICATES: {
    UPLOAD: '/certificates',
    ADMIN_LIST: '/certificates/admin',
    ADMIN_UPDATE: (id) => `/certificates/admin/${id}`,
  },

  // Upload
  UPLOAD: {
    SINGLE: '/upload/photo',
    MULTIPLE: '/upload/photos',
  },

  // Offers
  OFFERS: {
    WITHDRAW: (offerId) => `/offers/${offerId}/withdraw`,
  },

  // Notifications (kalıcı)
  NOTIFICATIONS: {
    LIST: '/notifications',
    CREATE: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id) => `/notifications/${id}`,
  },

  // Reviews
  REVIEWS: {
    BY_USTA: (ustaId) => `/reviews/usta/${ustaId}`,
  },

  // Complaints
  COMPLAINTS: {
    LIST: '/complaints',
    RESOLVE: (id) => `/complaints/${id}/resolve`,
    REJECT: (id) => `/complaints/${id}/reject`,
  },

  // Kampanyalar
  CAMPAIGNS: {
    ACTIVE: '/campaigns/active',
    SET: '/campaigns',
    DELETE: '/campaigns',
  },

  // AI Fiyat Analizi
  AI: {
    ANALYZE: '/ai/analyze',
  },

  // Servis Fiyat Listesi (Admin CRUD)
  SERVICES: {
    LIST:   '/services',
    CREATE: '/services',
    UPDATE: (id) => `/services/${id}`,
    DELETE: (id) => `/services/${id}`,
  },

  // Config (admin)
  CONFIG: {
    CANCELLATION: '/admin/config/cancellation',
  },

  // Bakım Paketleri
  PACKAGES: {
    MY:               '/packages/my',
    LIST:             '/packages/list',
    BUY:              '/packages/buy',
    TOGGLE_AUTO_RENEW: '/packages/auto-renew',
    ADMIN_LIST:       '/packages/admin',
    ADMIN_UPDATE:     (packageId) => `/packages/admin/${packageId}`,
  },
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
