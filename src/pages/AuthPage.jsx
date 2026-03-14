import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Eye, EyeOff, Phone, Mail, Lock, Gift, Calendar, ShieldCheck, Clock, BadgeCheck, ArrowLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'

function Input({ icon: Icon, suffix, ...props }) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-3 h-[52px] rounded-2xl px-4 bg-[#f0f4f8] dark:bg-white/[0.06] border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-white/[0.1] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-all duration-200">
        <Icon size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors flex-shrink-0" />
        <input
          {...props}
          className="flex-1 bg-transparent text-[15px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none h-full font-medium"
        />
        {suffix}
      </div>
    </div>
  )
}

// OTP giriş kutuları (6 hane)
function OtpInput({ value, onChange }) {
  const inputs = useRef([])
  const digits = (value || '').split('').concat(Array(6).fill('')).slice(0, 6)

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (!digits[i] && i > 0) inputs.current[i - 1]?.focus()
      const next = digits.map((d, idx) => idx === i ? '' : d).join('')
      onChange(next)
      return
    }
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, idx) => idx === i ? v : d).join('')
    onChange(next)
    if (v && i < 5) inputs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    const nextIdx = Math.min(pasted.length, 5)
    inputs.current[nextIdx]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className={`w-12 h-14 rounded-2xl text-center text-xl font-black bg-[#f0f4f8] dark:bg-white/[0.06] border-2 transition-all outline-none ${
            d ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'border-transparent focus:border-blue-400'
          } text-slate-800 dark:text-white`}
        />
      ))}
    </div>
  )
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState('form') // 'form' | 'otp'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [role, setRole] = useState('CUSTOMER')
  const [showPw, setShowPw] = useState(false)

  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [otpVerifying, setOtpVerifying] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(null) // kayıt için saklanan veri

  const navigate = useNavigate()
  const { login, register } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const ref = new URLSearchParams(location.search).get('ref')
    if (ref) { setReferralCode(ref.toUpperCase()); setIsLogin(false) }
  }, [location])

  // OTP geri sayım
  useEffect(() => {
    if (otpCountdown <= 0) return
    const t = setInterval(() => setOtpCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [otpCountdown])

  const handlePhoneChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11)
    let f = v.slice(0, 4)
    if (v.length > 4) f += ' ' + v.slice(4, 7)
    if (v.length > 7) f += ' ' + v.slice(7, 9)
    if (v.length > 9) f += ' ' + v.slice(9, 11)
    setPhone(f)
  }

  const isUnder18 = () => {
    if (!birthDate) return false
    const d = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - d.getFullYear()
    const m = today.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
    return age < 18
  }

  const sendOtp = async (emailToSend) => {
    setOtpSending(true)
    setError('')
    try {
      await fetchAPI(API_ENDPOINTS.OTP.SEND, { method: 'POST', body: { email: emailToSend }, includeAuth: false })
      setOtpCountdown(60)
    } catch (e) {
      setError(e.message || 'Kod gönderilemedi')
    } finally {
      setOtpSending(false)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isLogin) {
      setLoading(true)
      try {
        const r = await login(email, password)
        if (r?.success) {
          // navigate() çağırmıyoruz — setUser state güncellenince
          // App.jsx'teki "/" route'u kullanıcıyı otomatik doğru sayfaya yönlendirir
        } else setError(r?.error || 'E-posta veya şifre hatalı')
      } catch { setError('Bağlantı hatası oluştu') }
      finally { setLoading(false) }
      return
    }

    // Kayıt validasyonları
    if (!name || !email || !password || !confirmPassword || !phone)
      { setError('Lütfen tüm alanları doldurun'); return }
    if (!birthDate) { setError('Doğum tarihi zorunludur'); return }
    if (isUnder18()) { setError('18 yaş altı kayıt olamaz'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    if (password !== confirmPassword) { setError('Şifreler eşleşmiyor'); return }
    if (!/^05\d{9}$/.test(phone.replace(/\s/g, '')))
      { setError('Telefon formatı: 05XX XXX XX XX'); return }

    // Form verisini sakla, OTP adımına geç
    setFormData({ email, password, name, role, phone, referralCode, birthDate })
    setOtp('')
    setStep('otp')
    await sendOtp(email)
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) { setError('6 haneli kodu tam girin'); return }
    setError('')
    setOtpVerifying(true)

    try {
      // OTP doğrula
      await fetchAPI(API_ENDPOINTS.OTP.VERIFY, {
        method: 'POST',
        body: { email: formData.email, code: otp },
        includeAuth: false,
      })

      // OTP doğru - kayıt işlemini yap
      setLoading(true)
      const r = await register(
        formData.email, formData.password, formData.name, formData.role,
        formData.phone, formData.referralCode?.trim() || undefined, formData.birthDate
      )
      if (r?.success) {
        const rl = (r.role || formData.role).toLowerCase()
        if (rl === 'usta' || rl === 'professional') navigate('/professional')
        else if (rl === 'customer') navigate('/register/customer')
        else navigate('/home')
      } else {
        setError(r?.error || 'Kayıt başarısız')
        setStep('form')
      }
    } catch (e) {
      setError(e.message || 'Doğrulama başarısız')
    } finally {
      setOtpVerifying(false)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[#0a1628] dark:via-[#0f1d35] dark:to-[#0a1628]">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[250px] h-[250px] rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-3xl" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-3xl">🔧</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Usta Go</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Profesyonel Ev Hizmetleri</p>
        </div>

        <div className="bg-white dark:bg-[#1a2332] rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-black/30 border border-slate-200/60 dark:border-white/[0.06] p-7">

          {/* ── OTP Adımı ── */}
          {step === 'otp' ? (
            <div>
              <button
                onClick={() => { setStep('form'); setError('') }}
                className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mb-5 hover:text-slate-700 transition"
              >
                <ArrowLeft size={15} /> Geri dön
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={26} className="text-blue-500" />
                </div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white">E-posta Doğrulama</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formData?.email}</span> adresine
                  <br />6 haneli doğrulama kodu gönderdik
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <OtpInput value={otp} onChange={setOtp} />

                {error && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl px-4 py-3">
                    <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpVerifying || loading || otp.length !== 6}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
                >
                  {(otpVerifying || loading) ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Doğrulanıyor...
                    </span>
                  ) : 'Doğrula ve Kayıt Ol'}
                </button>

                <div className="text-center">
                  {otpCountdown > 0 ? (
                    <p className="text-sm text-slate-400">Yeniden gönder: <span className="font-bold text-blue-500">{otpCountdown}s</span></p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendOtp(formData?.email)}
                      disabled={otpSending}
                      className="flex items-center gap-1.5 text-sm text-blue-500 font-semibold mx-auto hover:text-blue-700 transition"
                    >
                      <RefreshCw size={14} className={otpSending ? 'animate-spin' : ''} />
                      {otpSending ? 'Gönderiliyor...' : 'Kodu tekrar gönder'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* ── Ana Form ── */
            <>
              {/* Toggle */}
              <div className="flex gap-2 mb-7 bg-slate-100 dark:bg-white/[0.06] p-1.5 rounded-2xl">
                {[{ label: 'Giriş Yap', val: true }, { label: 'Kayıt Ol', val: false }].map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => { setIsLogin(t.val); setError('') }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      isLogin === t.val
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <Input icon={User} type="text" placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} />

                    <div>
                      <Input icon={Calendar} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                      {birthDate && isUnder18() && (
                        <p className="text-xs text-rose-500 font-medium mt-1 ml-1">18 yaş altı kayıt yapılamaz</p>
                      )}
                    </div>

                    {/* Role */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { r: 'CUSTOMER', emoji: '👤', label: 'Müşteri', sub: 'Hizmet Al' },
                        { r: 'USTA', emoji: '⚡', label: 'Usta', sub: 'Hizmet Ver', nav: '/register/usta' },
                      ].map(item => (
                        <button
                          key={item.r}
                          type="button"
                          onClick={() => item.nav ? navigate(item.nav) : setRole(item.r)}
                          className={`flex flex-col items-center gap-1.5 py-5 rounded-2xl border-2 transition-all duration-200 ${
                            role === item.r && !item.nav
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-md shadow-blue-500/10'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                        >
                          <span className="text-2xl">{item.emoji}</span>
                          <span className={`text-sm font-bold ${role === item.r && !item.nav ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{item.label}</span>
                          <span className="text-[10px] text-slate-400">{item.sub}</span>
                        </button>
                      ))}
                    </div>

                    <Input icon={Phone} type="tel" placeholder="05XX XXX XX XX" value={phone} onChange={handlePhoneChange} />
                    <Input icon={Gift} type="text" placeholder="Davet Kodu (İsteğe Bağlı)" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} />
                  </>
                )}

                <Input icon={Mail} type="email" placeholder="E-posta adresi" value={email} onChange={e => setEmail(e.target.value)} />
                <Input
                  icon={Lock}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Şifre"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  suffix={
                    <button type="button" onClick={() => setShowPw(s => !s)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                {!isLogin && (
                  <Input icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Şifre (Tekrar)" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                )}

                {error && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl px-4 py-3">
                    <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!isLogin && (!birthDate || isUnder18()))}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isLogin ? 'Giriş yapılıyor...' : 'Devam ediliyor...'}
                    </span>
                  ) : isLogin ? 'Giriş Yap' : 'Devam Et →'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Trust Badges */}
        {step === 'form' && (
          <div className="flex items-center justify-center gap-5 mt-6 flex-wrap">
            {[
              { icon: ShieldCheck, text: 'Güvenli Giriş' },
              { icon: Clock, text: '7/24 Hizmet' },
              { icon: BadgeCheck, text: 'Doğrulanmış Ustalar' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <b.icon size={13} />
                <span className="text-[11px] font-medium">{b.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
