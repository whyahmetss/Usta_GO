import { useState, useEffect, useRef } from 'react'
import mainLogo from '../assets/main-logo.png'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Eye, EyeOff, Phone, Mail, Lock, ShieldCheck, BadgeCheck, ArrowLeft, RefreshCw, Zap, UserCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'

function Input({ icon: Icon, suffix, error: fieldError, ...props }) {
  return (
    <div className="group relative">
      <div className={`flex items-center gap-3 h-[46px] rounded-xl px-4 bg-[#F8F9FA] border-2 transition-all duration-200
        ${fieldError
          ? 'border-red-400 bg-red-50'
          : 'border-transparent focus-within:border-[#0A66C2] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(10,102,194,0.08)]'
        }`}>
        <Icon size={18} className={`flex-shrink-0 transition-colors ${fieldError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#0A66C2]'}`} />
        <input
          {...props}
          className="flex-1 bg-transparent text-[15px] text-gray-800 placeholder-gray-400 outline-none h-full font-medium"
        />
        {suffix}
      </div>
      {fieldError && <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">{fieldError}</p>}
    </div>
  )
}

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
    <div className="flex gap-2.5 justify-center">
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
          className={`w-12 h-14 rounded-2xl text-center text-xl font-black border-2 transition-all outline-none ${
            d ? 'border-[#0A66C2] bg-blue-50 text-[#0A66C2]' : 'border-gray-200 bg-[#F8F9FA] focus:border-[#0A66C2]'
          } text-gray-800`}
        />
      ))}
    </div>
  )
}

function TrustBadge({ icon: Icon, title, tooltip, iconBg, iconColor }) {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative flex items-center gap-2 cursor-pointer"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
        <Icon size={14} className={iconColor} />
      </div>
      <span className="text-[11px] font-semibold text-gray-500">{title}</span>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl z-50 leading-relaxed">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  )
}

export default function AuthPage() {
  // Force light mode on this page
  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    root.setAttribute('data-force-light', 'true')
    return () => {
      root.removeAttribute('data-force-light')
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState('form')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [role, setRole] = useState('CUSTOMER')
  const [showPw, setShowPw] = useState(false)

  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [otpVerifying, setOtpVerifying] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(null)

  const navigate = useNavigate()
  const { login, register, user } = useAuth()
  const location = useLocation()
  const [pendingNav, setPendingNav] = useState(null)

  useEffect(() => {
    const ref = new URLSearchParams(location.search).get('ref')
    if (ref) { setReferralCode(ref.toUpperCase()); setIsLogin(false) }
  }, [location])

  useEffect(() => {
    if (user && pendingNav) {
      navigate(pendingNav, { replace: true })
      setPendingNav(null)
    }
  }, [user, pendingNav, navigate])

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
          // App.jsx root route handles redirect after user state updates
        } else setError(r?.error || 'E-posta veya şifre hatalı')
      } catch { setError('Bağlantı hatası oluştu') }
      finally { setLoading(false) }
      return
    }

    if (!name || !email || !password || !phone)
      { setError('Lütfen tüm alanları doldurun'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    if (!/^05\d{9}$/.test(phone.replace(/\s/g, '')))
      { setError('Telefon formatı: 05XX XXX XX XX'); return }

    setFormData({ email, password, name, role, phone, referralCode })
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
      await fetchAPI(API_ENDPOINTS.OTP.VERIFY, {
        method: 'POST',
        body: { email: formData.email, code: otp },
        includeAuth: false,
      })

      setLoading(true)
      const r = await register(
        formData.email, formData.password, formData.name, formData.role,
        formData.phone, formData.referralCode?.trim() || undefined
      )
      if (r?.success) {
        const rl = (r.role || formData.role).toLowerCase()
        if (rl === 'usta' || rl === 'professional') setPendingNav('/professional')
        else if (rl === 'customer') setPendingNav('/register/customer')
        else setPendingNav('/home')
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
    <div className="min-h-screen auth-bg flex flex-col">
      {/* ── Header ── */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src={mainLogo} alt="UstaGO" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-lg font-extrabold tracking-tight text-gray-900">Usta<span className="text-[#0A66C2]">GO</span></span>
          </a>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[#0A66C2] font-semibold text-sm rounded-xl border-2 border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all duration-200"
          >
            Giriş Yap
          </a>
        </div>
      </nav>

      {/* ── Main Content: Split Layout ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-stretch gap-8 lg:gap-12">

          {/* ── LEFT: Hero Image Panel (desktop only) ── */}
          <div className="hidden lg:flex flex-1 relative rounded-3xl overflow-hidden min-h-[600px] bg-gradient-to-br from-[#0A66C2]/5 to-[#0A66C2]/10">
            <img
              src="/ELEKTRIK.PNG"
              alt="UstaGO - Elektrik Ustası"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A66C2]/80 via-transparent to-white/20" />

            {/* Floating: AI Fiyat Tahmini */}
            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl shadow-black/10 animate-[float_3s_ease-in-out_infinite]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-[#0A66C2] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <span className="text-xs font-bold text-gray-800">AI Fiyat Tahmini</span>
              </div>
              <p className="text-[10px] text-gray-500">Piyasa fiyatıyla karşılaştır</p>
            </div>

            {/* Floating: Müşteri Yorumu */}
            <div className="absolute bottom-24 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl shadow-black/10 animate-[float_3s_ease-in-out_infinite_0.5s]">
              <p className="text-[11px] font-bold text-gray-800 mb-1">Ayşe K.</p>
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed max-w-[160px]">"10 dakikada usta geldi, fiyat tam söylendiği gibiydi."</p>
            </div>

            {/* Floating: Güvenli Ödeme - Top Left */}
            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl shadow-black/10 animate-[float_3s_ease-in-out_infinite_1s]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Güvenli Ödeme</span>
                  <span className="text-[9px] text-gray-400">iyzico koruması</span>
                </div>
              </div>
            </div>

            {/* Bottom Stats Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#0A66C2]">50,000+</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Mutlu Müşteri</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#0A66C2]">2 dk</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Ort. Eşleşme</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#0A66C2]">4.9</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Müşteri Puanı</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Form Panel ── */}
          <div className="w-full lg:w-[480px] shrink-0">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                UstaGO'ya Katıl
              </h1>
              <p className="text-sm text-gray-500">
                Hemen hesabını oluştur, yapay zeka hızıyla güvenilir hizmet al.
              </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-6">

              {/* ── OTP Step ── */}
              {step === 'otp' ? (
                <div>
                  <button
                    onClick={() => { setStep('form'); setError('') }}
                    className="flex items-center gap-1.5 text-gray-500 text-sm mb-5 hover:text-gray-700 transition"
                  >
                    <ArrowLeft size={15} /> Geri dön
                  </button>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mail size={26} className="text-[#0A66C2]" />
                    </div>
                    <h2 className="text-lg font-extrabold text-gray-900">E-posta Doğrulama</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-semibold text-gray-700">{formData?.email}</span> adresine
                      <br />6 haneli doğrulama kodu gönderdik
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-5">
                    <OtpInput value={otp} onChange={setOtp} />

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                        <p className="text-red-600 text-sm font-medium text-center">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={otpVerifying || loading || otp.length !== 6}
                      className="w-full py-4 bg-[#0A66C2] hover:bg-[#084E96] text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#0A66C2]/20 hover:shadow-[#0A66C2]/30"
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
                        <p className="text-sm text-gray-400">Yeniden gönder: <span className="font-bold text-[#0A66C2]">{otpCountdown}s</span></p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sendOtp(formData?.email)}
                          disabled={otpSending}
                          className="flex items-center gap-1.5 text-sm text-[#0A66C2] font-semibold mx-auto hover:text-[#084E96] transition"
                        >
                          <RefreshCw size={14} className={otpSending ? 'animate-spin' : ''} />
                          {otpSending ? 'Gönderiliyor...' : 'Kodu tekrar gönder'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                /* ── Main Form ── */
                <>
                  {/* Toggle */}
                  <div className="flex gap-1.5 mb-5 bg-[#F8F9FA] p-1.5 rounded-2xl">
                    {[{ label: 'Giriş Yap', val: true }, { label: 'Kayıt Ol', val: false }].map(t => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => { setIsLogin(t.val); setError('') }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                          isLogin === t.val
                            ? 'bg-[#0A66C2] text-white shadow-md shadow-[#0A66C2]/20'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-3">
                    {!isLogin && (
                      <>
                        <Input icon={User} type="text" placeholder="Adınızı giriniz" value={name} onChange={e => setName(e.target.value)} />

                        {/* Role - compact */}
                        <div className="flex gap-2">
                          {[
                            { r: 'CUSTOMER', Icon: UserCheck, label: 'Müşteri' },
                            { r: 'USTA', Icon: Zap, label: 'Usta', nav: '/register/usta' },
                          ].map(item => (
                            <button
                              key={item.r}
                              type="button"
                              onClick={() => item.nav ? navigate(item.nav) : setRole(item.r)}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-200 ${
                                role === item.r && !item.nav
                                  ? 'border-[#0A66C2] bg-blue-50 shadow-sm'
                                  : 'border-gray-200 bg-[#F8F9FA] hover:border-gray-300'
                              }`}
                            >
                              <item.Icon size={16} className={role === item.r && !item.nav ? 'text-[#0A66C2]' : 'text-gray-400'} />
                              <span className={`text-sm font-bold ${role === item.r && !item.nav ? 'text-[#0A66C2]' : 'text-gray-600'}`}>{item.label}</span>
                            </button>
                          ))}
                        </div>

                        <Input icon={Phone} type="tel" placeholder="05XX XXX XX XX" value={phone} onChange={handlePhoneChange} />
                      </>
                    )}

                    <Input icon={Mail} type="email" placeholder="E-posta adresinizi giriniz" value={email} onChange={e => setEmail(e.target.value)} />
                    <Input
                      icon={Lock}
                      type={showPw ? 'text' : 'password'}
                      placeholder={isLogin ? 'Şifreniz' : 'Güçlü bir şifre oluşturun'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      suffix={
                        <button type="button" onClick={() => setShowPw(s => !s)} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                        <p className="text-red-600 text-sm font-medium text-center">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#0A66C2] hover:bg-[#084E96] text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shadow-lg shadow-[#0A66C2]/20 hover:shadow-[#0A66C2]/30 hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {isLogin ? 'Giriş yapılıyor...' : 'Devam ediliyor...'}
                        </span>
                      ) : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">veya</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Google Sign In */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => alert('Google ile giriş şu anda sadece mobil uygulamada desteklenmektedir.')}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200 mb-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                  </button>

                  {/* Apple Sign In */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => alert('Apple ile giriş şu anda sadece iOS uygulamasında desteklenmektedir.')}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple ile {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                  </button>
                </>
              )}
            </div>

            {/* Trust Badges */}
            {step === 'form' && (
              <div className="flex items-center justify-center gap-5 mt-6 flex-wrap">
                <TrustBadge
                  icon={ShieldCheck}
                  title="Kimlik Doğrulama"
                  tooltip="Her usta TC Kimlik ve Adli Sicil doğrulamasından geçer."
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                />
                <TrustBadge
                  icon={Lock}
                  title="Güvenli Ödeme"
                  tooltip="iyzico altyapısıyla korunan cüzdan sistemi. İş bitip onay verene kadar ödeme güvende."
                  iconBg="bg-blue-50"
                  iconColor="text-[#0A66C2]"
                />
                <TrustBadge
                  icon={BadgeCheck}
                  title="Doğrulanmış Ustalar"
                  tooltip="Sadece tamamlanmış işler üzerinden yorum ve yıldız. Sahte değerlendirme yok."
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={mainLogo} alt="UstaGO" className="w-6 h-6 rounded-md object-cover" />
            <span className="text-sm font-bold text-gray-400">UstaGO</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="/legal/terms" className="hover:text-gray-600 transition-colors">Kullanım Koşulları</a>
            <a href="/legal/privacy" className="hover:text-gray-600 transition-colors">Gizlilik Politikası</a>
            <a href="/legal/kvkk" className="hover:text-gray-600 transition-colors">KVKK</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
