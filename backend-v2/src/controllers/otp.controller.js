import { sendVerificationEmail, verifyEmailOtp } from '../services/email.service.js'
import { sendSmsOtp, verifySmsOtp } from '../services/sms.service.js'

// E-posta OTP gönder
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, error: 'Geçerli bir e-posta adresi girin' })
    }
    await sendVerificationEmail(email)
    res.json({ success: true, message: 'Doğrulama kodu gönderildi' })
  } catch (err) {
    console.error('OTP send error:', err)
    res.status(500).json({ success: false, error: 'Kod gönderilemedi: ' + err.message })
  }
}

// E-posta OTP doğrula
export const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'E-posta ve kod zorunludur' })
    }
    const result = await verifyEmailOtp(email, code)
    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error })
    }
    res.json({ success: true, message: 'E-posta doğrulandı' })
  } catch (err) {
    console.error('OTP verify error:', err)
    res.status(500).json({ success: false, error: 'Doğrulama başarısız' })
  }
}

// SMS OTP gönder
export const sendSmsOtpHandler = async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ success: false, error: 'Telefon numarası zorunlu' })
    await sendSmsOtp(phone)
    res.json({ success: true, message: 'SMS kodu gönderildi' })
  } catch (err) {
    console.error('SMS OTP send error:', err)
    res.status(500).json({ success: false, error: 'SMS gönderilemedi: ' + err.message })
  }
}

// SMS OTP doğrula
export const verifySmsOtpHandler = async (req, res) => {
  try {
    const { phone, code } = req.body
    if (!phone || !code) return res.status(400).json({ success: false, error: 'Telefon ve kod zorunludur' })
    const result = await verifySmsOtp(phone, code)
    if (!result.valid) return res.status(400).json({ success: false, error: result.error })
    res.json({ success: true, message: 'Telefon doğrulandı' })
  } catch (err) {
    console.error('SMS OTP verify error:', err)
    res.status(500).json({ success: false, error: 'Doğrulama başarısız' })
  }
}
