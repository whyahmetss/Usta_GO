import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const CANCELLATION_KEY = 'cancellation_rates'
const DEFAULT_RATES = { pending: 5, accepted: 25, inProgress: 50 }

const REFERRAL_KEY = 'referral_bonus'
const DEFAULT_REFERRAL = { referrerBonus: 50, newUserBonus: 50 }

export const getCancellationRates = async () => {
  const row = await prisma.appConfig.findUnique({ where: { key: CANCELLATION_KEY } })
  if (!row?.value) return DEFAULT_RATES
  try {
    return { ...DEFAULT_RATES, ...JSON.parse(row.value) }
  } catch {
    return DEFAULT_RATES
  }
}

export const setCancellationRates = async ({ pending, accepted, inProgress }) => {
  const data = {}
  if (pending != null && !isNaN(Number(pending))) data.pending = Math.max(0, Math.min(100, Number(pending)))
  if (accepted != null && !isNaN(Number(accepted))) data.accepted = Math.max(0, Math.min(100, Number(accepted)))
  if (inProgress != null && !isNaN(Number(inProgress))) data.inProgress = Math.max(0, Math.min(100, Number(inProgress)))
  const value = JSON.stringify({ ...DEFAULT_RATES, ...data })
  await prisma.appConfig.upsert({
    where: { key: CANCELLATION_KEY },
    create: { key: CANCELLATION_KEY, value },
    update: { value },
  })
  return getCancellationRates()
}

export const getReferralBonus = async () => {
  const row = await prisma.appConfig.findUnique({ where: { key: REFERRAL_KEY } })
  if (!row?.value) return DEFAULT_REFERRAL
  try {
    return { ...DEFAULT_REFERRAL, ...JSON.parse(row.value) }
  } catch {
    return DEFAULT_REFERRAL
  }
}

export const setReferralBonus = async ({ referrerBonus, newUserBonus }) => {
  const data = {}
  if (referrerBonus != null && !isNaN(Number(referrerBonus))) data.referrerBonus = Math.max(0, Number(referrerBonus))
  if (newUserBonus != null && !isNaN(Number(newUserBonus))) data.newUserBonus = Math.max(0, Number(newUserBonus))
  const value = JSON.stringify({ ...DEFAULT_REFERRAL, ...data })
  await prisma.appConfig.upsert({
    where: { key: REFERRAL_KEY },
    create: { key: REFERRAL_KEY, value },
    update: { value },
  })
  return getReferralBonus()
}
