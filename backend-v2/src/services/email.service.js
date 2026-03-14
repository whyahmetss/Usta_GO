import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

/* ── HTML şablonu ── */
const buildEmailHtml = (code) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 16px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 32px; line-height: 64px; display: block;">🔧</span>
    </div>
    <h1 style="color: #1e293b; font-size: 22px; margin: 0; font-weight: 900;">Usta Go</h1>
    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Profesyonel Hizmet Platformu</p>
  </div>
  <div style="background: white; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <p style="color: #475569; font-size: 15px; margin: 0 0 8px; font-weight: 600;">E-posta Doğrulama Kodunuz</p>
    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 24px;">Aşağıdaki 6 haneli kodu uygulamaya girin:</p>
    <div style="background: linear-gradient(135deg, #eff6ff, #f5f3ff); border-radius: 12px; padding: 24px; margin: 0 auto;">
      <span style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #2563eb; font-family: monospace;">${code}</span>
    </div>
    <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0;">⏱ Bu kod <strong>10 dakika</strong> geçerlidir.</p>
    <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0;">🔒 Bu kodu kimseyle paylaşmayın.</p>
  </div>
  <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 20px 0 0;">
    Bu e-postayı siz talep etmediyseniz dikkate almayınız.
  </p>
</div>
`

/* ── Resend API ile gönder (RESEND_API_KEY varsa) ── */
const sendViaResend = async (to, subject, html) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Usta Go <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Resend gönderme hatası')
  return data
}

/* ── Gmail/SMTP ile gönder (SMTP_USER + SMTP_PASS varsa) ── */
const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

const sendViaSmtp = async (to, subject, html) => {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"Usta Go" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  })
}

/* ── Ana gönderici ── */
const sendEmail = async (to, subject, html) => {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(to, subject, html)
  }
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return sendViaSmtp(to, subject, html)
  }
  // Geliştirme ortamı: konsola yaz
  console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`)
  console.log(`[EMAIL DEV] HTML content generated (not sent — no email provider configured)`)
}

/* ── OTP Gönder ── */
export const sendVerificationEmail = async (email) => {
  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.otpCode.deleteMany({ where: { email, type: 'EMAIL_VERIFY' } })
  await prisma.otpCode.create({ data: { email, code, type: 'EMAIL_VERIFY', expiresAt } })

  await sendEmail(
    email,
    'Usta Go — E-posta Doğrulama Kodu',
    buildEmailHtml(code)
  )

  return { success: true }
}

/* ── OTP Doğrula ── */
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
