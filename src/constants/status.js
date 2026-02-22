/**
 * Backend job status constants (sent to / received from the API as-is).
 */
export const JOB_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ACCEPTED: 'ACCEPTED',
}

/**
 * Backend offer status constants.
 */
export const OFFER_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
}

/**
 * Frontend (display) job status constants used in UI after mapJobFromBackend.
 */
export const FRONTEND_JOB_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ACCEPTED: 'accepted',
}
