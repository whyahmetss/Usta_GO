import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  User, Zap, Eye, EyeOff, Phone, Mail, Lock, Gift, Calendar,
  ShieldCheck, Clock, BadgeCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function InputField({ icon, suffix, className = '', ...props }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 h-12 border transition-all bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] focus-within:border-primary-500 dark:focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 ${className}`}>
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <input
        {...props}
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none h-full"
      />
      {suffix}
    </div>
  )
}

function TrustBadge({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
      <Icon size={13} />
      <span className="text-[11px] font-medium">{text}</span>
    </div>
  )
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [role, setRole] = useState('CUSTOMER')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const navigate = useNavigate()
  const { login, register } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const ref = new URLSearchParams(location.search).get('ref')
    if (ref) { setReferralCode(ref.toUpperCase()); setIsLogin(false) }
  }, [location])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const r = await login(email, password)
        if (r?.success) {
          const rl = r.role?.toLowerCase()
          if (rl === 'admin') navigate('/admin')
          else if (rl === 'usta' || rl === 'professional') navigate('/professional')
          else if (rl === 'support') navigate('/support')
          else navigate('/home')
        } else setError(r?.error || 'E-posta veya şifre hatalı')
      } else {
        if (!name || !email || !password || !confirmPassword || !phone)
          { setError('Lütfen tüm alanları doldurun'); setLoading(false); return }
        if (!birthDate)
          { setError('Doğum tarihi zorunludur'); setLoading(false); return }
        if (isUnder18())
          { setError('18 yaş altı kayıt olamaz'); setLoading(false); return }
        if (password.length < 6)
          { setError('Şifre en az 6 karakter olmalı'); setLoading(false); return }
        if (password !== confirmPassword)
          { setError('Şifreler eşleşmiyor'); setLoading(false); return }
        if (!/^05\d{9}$/.test(phone.replace(/\s/g, '')))
          { setError('Telefon formatı: 05XX XXX XX XX'); setLoading(false); return }

        const r = await register(email, password, name, role, phone, referralCode?.trim() || undefined, birthDate)
        if (r?.success) {
          if (role === 'USTA' || r.role === 'professional') navigate('/professional')
          else if (role === 'CUSTOMER') navigate('/register/customer')
          else navigate('/home')
        } else setError(r?.error || 'Kayıt başarısız')
      }
    } catch { setError('Bir bağlantı hatası oluştu') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-[#0F172A]">
      {/* Form kutuda, arka plandan bağımsız */}
      <div className="w-full max-w-[420px] bg-white dark:bg-[#1E293B] rounded-3xl shadow-xl border border-gray-200 dark:border-[#334155] p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl bg-primary-500 text-white">🔧</div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">Usta Go</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Profesyonel Ev Hizmetleri</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[{ label: 'Giriş Yap', val: true }, { label: 'Kayıt Ol', val: false }].map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => { setIsLogin(t.val); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isLogin === t.val ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-[#273548] text-gray-500 dark:text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Ad Soyad</label>
                <InputField icon={<User size={16}/>} type="text" placeholder="Ad Soyad" value={name} onChange={e=>setName(e.target.value)} />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Doğum Tarihi *</label>
                <InputField
                  icon={<Calendar size={16}/>}
                  type="date"
                  value={birthDate}
                  onChange={e=>setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                {birthDate && isUnder18() && (
                  <p className="text-xs text-rose-600 mt-1">18 yaş altı kayıt olamaz</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Hesap Türü</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { r: 'CUSTOMER', icon: '👤', label: 'Müşteri', sub: 'Hizmet Al' },
                    { r: 'USTA', icon: '⚡', label: 'Usta', sub: 'Hizmet Ver', nav: '/register/usta' },
                  ].map(item => (
                    <button
                      key={item.r}
                      type="button"
                      onClick={() => item.nav ? navigate(item.nav) : setRole(item.r)}
                      className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                        role === item.r && !item.nav
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                          : 'border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#273548]'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className={`text-sm font-bold ${role === item.r && !item.nav ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}>{item.label}</span>
                      <span className="text-[10px] text-gray-400">{item.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Telefon</label>
                <InputField icon={<Phone size={16}/>} type="tel" placeholder="05XX XXX XX XX" value={phone} onChange={handlePhoneChange} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Davet Kodu (İsteğe Bağlı)</label>
                <InputField icon={<Gift size={16}/>} type="text" placeholder="Davet Kodu" value={referralCode} onChange={e=>setReferralCode(e.target.value.toUpperCase())} />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">E-posta</label>
            <InputField icon={<Mail size={16}/>} type="email" placeholder="E-posta adresi" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Şifre</label>
            <InputField
              icon={<Lock size={16}/>}
              type={showPw ? 'text' : 'password'}
              placeholder="Şifre"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              suffix={
                <button type="button" onClick={()=>setShowPw(s=>!s)} className="text-gray-400 hover:text-gray-600 p-1">
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              }
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Şifre (Tekrar)</label>
              <InputField icon={<Lock size={16}/>} type={showPw?'text':'password'} placeholder="Şifre (Tekrar)" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
              <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && (!birthDate || isUnder18()))}
            className="w-full py-3.5 bg-primary-500 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                {isLogin ? 'Giriş yapılıyor...' : 'Kaydediliyor...'}
              </span>
            ) : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          <TrustBadge icon={ShieldCheck} text="Güvenli Giriş" />
          <TrustBadge icon={Clock} text="7/24 Hizmet" />
          <TrustBadge icon={BadgeCheck} text="Doğrulanmış Ustalar" />
        </div>
      </div>
    </div>
  )
}
