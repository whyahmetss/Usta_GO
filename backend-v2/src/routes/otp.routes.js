import { Router } from 'express'
import { sendOtp, verifyOtp, sendSmsOtpHandler, verifySmsOtpHandler } from '../controllers/otp.controller.js'

const router = Router()

// Public - kayıt sırasında kullanılır
router.post('/send', sendOtp)
router.post('/verify', verifyOtp)
router.post('/sms/send', sendSmsOtpHandler)
router.post('/sms/verify', verifySmsOtpHandler)

export default router
