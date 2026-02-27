/**
 * Field mapping utilities for backend <-> frontend compatibility.
 *
 * Backend uses:  location, budget, status (UPPERCASE), role: USTA/CUSTOMER/ADMIN
 * Frontend uses: address,  price,  status (lowercase), role: professional/customer/admin
 */

/**
 * Maps a job object from backend format to frontend format.
 * - location  -> address
 * - budget    -> price
 * - ustaId    -> professionalId
 * - PENDING   -> pending (status lowercased)
 */
export const mapJobFromBackend = (job) => {
  if (!job) return job
  return {
    ...job,
    address: job.location,
    price: job.budget,
    professionalId: job.ustaId || job.professionalId,
    professional: job.usta || job.professional,
    status: job.status?.toLowerCase(),
  }
}

/**
 * Maps a job object from frontend format to backend format.
 * - address       -> location
 * - price         -> budget
 * - professionalId -> ustaId
 * - pending       -> PENDING (status uppercased)
 */
export const mapJobToBackend = (job) => {
  if (!job) return job
  // Strip frontend-only fields so backend validation doesn't reject them
  const { address, price, professionalId, ...rest } = job
  const result = {
    ...rest,
    location: address ?? job.location,
    budget: price ?? job.budget,
  }
  if (professionalId ?? job.ustaId) result.ustaId = professionalId ?? job.ustaId
  if (result.status) result.status = result.status.toUpperCase()
  else delete result.status
  return result
}

/**
 * Maps a user object from backend format to frontend format.
 * - USTA     -> professional
 * - CUSTOMER -> customer
 * - ADMIN    -> admin
 */
export const mapUserFromBackend = (user) => {
  if (!user) return user
  let role = user.role
  if (role === 'USTA') role = 'professional'
  else if (role) role = role.toLowerCase()
  return { ...user, role }
}

/**
 * Maps a user object from frontend format to backend format.
 * - professional -> USTA
 * - customer     -> CUSTOMER
 * - admin        -> ADMIN
 */
export const mapUserToBackend = (user) => {
  if (!user) return user
  let role = user.role
  if (role === 'professional') role = 'USTA'
  else if (role) role = role.toUpperCase()
  return { ...user, role }
}

/**
 * Convenience: map an array of jobs from backend format.
 */
export const mapJobsFromBackend = (jobs) => {
  if (!Array.isArray(jobs)) return []
  return jobs.map(mapJobFromBackend)
}

/**
 * Convenience: map an array of users from backend format.
 */
export const mapUsersFromBackend = (users) => {
  if (!Array.isArray(users)) return []
  return users.map(mapUserFromBackend)
}
