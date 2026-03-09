import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Zap, Eye, EyeOff, Phone, Mail, Lock, Gift } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [role, setRole] = useState('CUSTOMER')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { login, register } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get('ref')
    if (ref) {
      setReferralCode(ref.toUpperCase())
      setIsLogin(false)
    }
  }, [location])

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)
    let formatted = ''
    if (val.length > 0) {
      formatted = val.slice(0, 4)
      if (val.length > 4) formatted += ' ' + val.slice(4, 7)
      if (val.length > 7) formatted += ' ' + val.slice(7, 9)
      if (val.length > 9) formatted += ' ' + val.slice(9, 11)
    }
    setPhone(formatted)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const result = await login(email, password)
        if (result?.success) {
          const r = result.role?.toLowerCase()
          if (r === 'admin') navigate('/admin')
          else if (r === 'usta' || r === 'professional') navigate('/professional')
          else navigate('/home')
        } else {
          setError(result?.error || 'E-posta veya şifre hatalı')
        }
      } else {
        if (!name || !email || !password || !confirmPassword || !phone) {
          setError('Lütfen tüm alanları doldurun')
          setLoading(false)
          return
        }
        if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); setLoading(false); return }
        if (password !== confirmPassword) { setError('Şifreler eşleşmiyor'); setLoading(false); return }
        const phoneRegex = /^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) { setError('Telefon formatı: 05XX XXX XX XX'); setLoading(false); return }

        const result = await register(email, password, name, role, phone, referralCode?.trim() || undefined)
        if (result?.success) {
          if (role === 'USTA' || result.role === 'professional') navigate('/professional')
          else navigate('/home')
        } else {
          setError(result?.error || 'Kayıt başarısız')
        }
      }
    } catch {
      setError('Bir bağlantı hatası oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] dark:bg-[#0F172A]">
      {/* Hero üst bölüm */}
      <div className="relative flex flex-col items-center justify-center pt-14 pb-10 px-6 overflow-hidden">
        {/* Arka plan degrade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2563EB] to-[#1d4ed8]" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #60a5fa 0%, transparent 60%), radial-gradient(circle at 80% 80%, #818cf8 0%, transparent 50%)" }} />

        {/* Logo dairesi */}
        <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-5 shadow-xl border border-white/30">
          <span className="text-3xl font-black text-white tracking-tight">UG</span>
        </div>

        <h1 className="relative z-10 text-2xl font-black text-white mb-1 tracking-tight">Usta Go</h1>
        <p className="relative z-10 text-white/70 text-sm font-medium">Profesyonel Ev Hizmetleri</p>
      </div>

      {/* Form kartı */}
      <div className="flex-1 -mt-6 bg-[#F5F7FB] dark:bg-[#0F172A] rounded-t-3xl px-5 pt-6 pb-10">
        {/* Tab seçimi */}
        <div className="flex p-1 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-[#334155] mb-6">
          {['Giriş Yap', 'Kayıt Ol'].map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => { setIsLogin(i === 0); setError('') }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                (i === 0) === isLogin
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              {/* Ad Soyad */}
              <InputField
                icon={<User size={16} className="text-gray-400" />}
                type="text"
                placeholder="Ad Soyad"
                value={name}
                onChange={e => setName(e.target.value)}
              />

              {/* Hesap tipi */}
              <div>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Hesap Türü</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                      role === 'CUSTOMER'
                        ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/30'
                        : 'border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === 'CUSTOMER' ? 'bg-[#2563EB]' : 'bg-gray-100 dark:bg-[#273548]'}`}>
                      <User size={20} className={role === 'CUSTOMER' ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <span className={`text-sm font-bold ${role === 'CUSTOMER' ? 'text-[#2563EB]' : 'text-gray-600 dark:text-gray-400'}`}>Müşteri</span>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">Hizmet talep edin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/register/usta')}
                    className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] transition-all active:scale-[0.97]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Zap size={20} className="text-amber-500" />
                    </div>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Usta</span>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">Hizmet verin</span>
                  </button>
                </div>
              </div>

              {/* Telefon */}
              <InputField
                icon={<Phone size={16} className="text-gray-400" />}
                type="tel"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChange={handlePhoneChange}
              />

              {/* Davet kodu */}
              <InputField
                icon={<Gift size={16} className="text-gray-400" />}
                type="text"
                placeholder="Davet Kodu (İsteğe Bağlı)"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
              />
            </>
          )}

          {/* E-posta */}
          <InputField
            icon={<Mail size={16} className="text-gray-400" />}
            type="email"
            placeholder="E-posta adresi"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          {/* Şifre */}
          <div className="relative">
            <InputField
              icon={<Lock size={16} className="text-gray-400" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              suffix={
                <button type="button" onClick={() => setShowPassword(s => !s)} className="text-gray-400 hover:text-gray-600 p-1">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          {!isLogin && (
            <InputField
              icon={<Lock size={16} className="text-gray-400" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Şifre (Tekrar)"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-3.5">
              <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-blue-500/25 mt-2"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{isLogin ? 'Giriş yapılıyor...' : 'Kaydediliyor...'}</span>
              : isLogin ? 'Giriş Yap' : 'Kayıt Ol'
            }
          </button>

          {isLogin && (
            <p className="text-center text-[12px] text-gray-400 dark:text-gray-500 pt-1">
              Hesabın yok mu?{' '}
              <button type="button" onClick={() => { setIsLogin(false); setError('') }} className="text-[#2563EB] font-semibold">
                Kayıt Ol
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

function InputField({ icon, suffix, ...props }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-2xl px-4 h-[52px] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
      {icon}
      <input
        {...props}
        className="flex-1 bg-transparent text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none h-full"
      />
      {suffix}
    </div>
  )
}

export default AuthPage
