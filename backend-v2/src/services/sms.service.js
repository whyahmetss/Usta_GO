import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

// Twilio client - sadece env var varsa oluştur
let twilioClient = null
const getTwilioClient = async () => {
  if (twilioClient) return twilioClient
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const twilio = (await import('twilio')).default
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  }
  return twilioClient
}

export const sendSmsOtp = async (phone) => {
  // Telefon numarasını normalize et (başına +90 ekle)
  const raw = phone.replace(/\D/g, '')
  const normalized = raw.startsWith('90') ? '+' + raw : '+90' + raw.replace(/^0/, '')

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.otpCode.deleteMany({ where: { email: normalized, type: 'SMS_VERIFY' } })
  await prisma.otpCode.create({
    data: { email: normalized, code, type: 'SMS_VERIFY', expiresAt },
  })

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER

  if (twilioSid && twilioToken && twilioFrom) {
    const twilio = (await import('twilio')).default
    const client = twilio(twilioSid, twilioToken)
    await client.messages.create({
      body: `Usta Go doğrulama kodunuz: ${code}\nBu kodu kimseyle paylaşmayın. (10 dk geçerli)`,
      from: twilioFrom,
      to: normalized,
    })
  } else {
    console.log(`[SMS OTP DEV] ${normalized} → ${code}`)
  }

  return { success: true }
}

export const verifySmsOtp = async (phone, code) => {
  const raw = phone.replace(/\D/g, '')
  const normalized = raw.startsWith('90') ? '+' + raw : '+90' + raw.replace(/^0/, '')

  const otp = await prisma.otpCode.findFirst({
    where: { email: normalized, code, type: 'SMS_VERIFY', used: false },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return { valid: false, error: 'Geçersiz doğrulama kodu' }
  if (new Date() > otp.expiresAt) return { valid: false, error: 'Kod süresi dolmuş' }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } })
  return { valid: true }
}
