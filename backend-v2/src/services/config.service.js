import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const CANCELLATION_KEY = 'cancellation_rates'
const DEFAULT_RATES = { pending: 5, accepted: 25, inProgress: 50 }

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
