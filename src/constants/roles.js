/**
 * Backend role constants (sent to / received from the API as-is).
 */
export const USER_ROLES = {
  USTA: 'USTA',
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
}

/**
 * Frontend (display) role constants used in UI comparisons after mapUserFromBackend.
 */
export const FRONTEND_ROLES = {
  PROFESSIONAL: 'professional',
  CUSTOMER: 'customer',
  ADMIN: 'admin',
}
