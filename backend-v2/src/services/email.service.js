import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

export const sendVerificationEmail = async (email) => {
  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 dakika

  // Eski OTP'leri sil
  await prisma.otpCode.deleteMany({ where: { email, type: 'EMAIL_VERIFY' } })

  // Yeni OTP kaydet
  await prisma.otpCode.create({
    data: { email, code, type: 'EMAIL_VERIFY', expiresAt },
  })

  // Email gönder
  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS
  if (smtpConfigured) {
    await transporter.sendMail({
      from: `"Usta Go" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Usta Go - E-posta Doğrulama Kodu',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 40px; margin-bottom: 8px;">🔧</div>
            <h1 style="color: #1e293b; font-size: 22px; margin: 0;">Usta Go</h1>
            <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Profesyonel Ev Hizmetleri</p>
          </div>
          <div style="background: white; border-radius: 12px; padding: 28px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="color: #475569; font-size: 15px; margin: 0 0 20px;">E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
            <div style="background: #eff6ff; border-radius: 10px; padding: 20px; margin: 0 auto; display: inline-block; min-width: 180px;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #2563eb;">${code}</span>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0;">Bu kod 10 dakika geçerlidir. Kimseyle paylaşmayın.</p>
          </div>
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 20px 0 0;">Bu emaili siz talep etmediyseniz dikkate almayın.</p>
        </div>
      `,
    })
  } else {
    // SMTP yapılandırılmamışsa kodu logla (geliştirme ortamı)
    console.log(`[OTP DEV] ${email} → ${code}`)
  }

  return { success: true }
}

export const verifyEmailOtp = async (email, code) => {
  const otp = await prisma.otpCode.findFirst({
    where: { email, code, type: 'EMAIL_VERIFY', used: false },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return { valid: false, error: 'Geçersiz doğrulama kodu' }
  if (new Date() > otp.expiresAt) return { valid: false, error: 'Kod süresi dolmuş, yeni kod isteyin' }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } })
  return { valid: true }
}
