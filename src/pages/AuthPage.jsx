import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  User, Zap, Eye, EyeOff, Phone, Mail, Lock, Gift,
  ShieldCheck, Clock, BadgeCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/* ─── küçük yardımcılar ─── */
function InputField({ icon, suffix, ...props }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 h-12 focus-within:border-white/50 focus-within:bg-white/15 transition-all backdrop-blur-sm">
      <span className="text-white/50 flex-shrink-0">{icon}</span>
      <input
        {...props}
        className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none h-full"
      />
      {suffix && <span className="flex-shrink-0">{suffix}</span>}
    </div>
  )
}

function TrustBadge({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5 text-white/60">
      <Icon size={13} className="text-white/50" />
      <span className="text-[11px] font-medium">{text}</span>
    </div>
  )
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail]     = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [referralCode, setReferralCode]   = useState('')
  const [role, setRole]       = useState('CUSTOMER')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const navigate  = useNavigate()
  const { login, register } = useAuth()
  const location  = useLocation()

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const r = await login(email, password)
        if (r?.success) {
          const role = r.role?.toLowerCase()
          if (role === 'admin') navigate('/admin')
          else if (role === 'usta' || role === 'professional') navigate('/professional')
          else navigate('/home')
        } else setError(r?.error || 'E-posta veya şifre hatalı')
      } else {
        if (!name || !email || !password || !confirmPassword || !phone)
          { setError('Lütfen tüm alanları doldurun'); setLoading(false); return }
        if (password.length < 6)
          { setError('Şifre en az 6 karakter olmalı'); setLoading(false); return }
        if (password !== confirmPassword)
          { setError('Şifreler eşleşmiyor'); setLoading(false); return }
        if (!/^05\d{9}$/.test(phone.replace(/\s/g, '')))
          { setError('Telefon formatı: 05XX XXX XX XX'); setLoading(false); return }

        const r = await register(email, password, name, role, phone, referralCode?.trim() || undefined)
        if (r?.success) {
          if (role === 'USTA' || r.role === 'professional') navigate('/professional')
          else navigate('/home')
        } else setError(r?.error || 'Kayıt başarısız')
      }
    } catch { setError('Bir bağlantı hatası oluştu') }
    finally  { setLoading(false) }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)' }}
    >
      {/* Dekoratif daireler */}
      <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle,#56CCF2,transparent)' }} />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle,#2F80ED,transparent)' }} />

      {/* Kart */}
      <div className="w-full max-w-[420px] relative z-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2F80ED,#56CCF2)', boxShadow: '0 4px 16px rgba(47,128,237,0.45)' }}>
            🔧
          </div>
          <div>
            <h1 className="text-[18px] font-black text-white tracking-tight leading-tight">Usta Go</h1>
            <p className="text-[11px] text-white/50 font-medium leading-tight">Profesyonel Ev Hizmetleri</p>
          </div>
        </div>

        {/* ── Toggle ── */}
        <div className="flex gap-2 mb-6">
          {[{ label: 'Giriş Yap', val: true }, { label: 'Kayıt Ol', val: false }].map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => { setIsLogin(t.val); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isLogin === t.val
                  ? 'text-white border-2 border-transparent'
                  : 'text-white/50 border-2 border-white/20 bg-transparent'
              }`}
              style={isLogin === t.val
                ? { background: 'linear-gradient(135deg,#2F80ED,#56CCF2)', boxShadow: '0 4px 16px rgba(47,128,237,0.35)' }
                : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <InputField icon={<User size={16}/>} type="text" placeholder="Ad Soyad" value={name} onChange={e=>setName(e.target.value)} />

              {/* Rol seçimi */}
              <div className="grid grid-cols-2 gap-3 my-1">
                {[
                  { r: 'CUSTOMER', icon: '👤', label: 'Müşteri', sub: 'Hizmet Al', color: '#2F80ED' },
                  { r: 'USTA',     icon: '⚡', label: 'Usta',    sub: 'Hizmet Ver', color: '#F59E0B', navigate: '/register/usta' },
                ].map(item => {
                  const active = role === item.r && !item.navigate
                  return (
                    <button
                      key={item.r}
                      type="button"
                      onClick={() => item.navigate ? navigate(item.navigate) : setRole(item.r)}
                      className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                        active
                          ? 'border-[#56CCF2] bg-white/10'
                          : 'border-white/15 bg-white/5 hover:bg-white/10'
                      }`}
                      style={active ? { boxShadow: `0 0 20px ${item.color}40` } : {}}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div className="text-center">
                        <p className={`text-sm font-bold ${active ? 'text-white' : 'text-white/70'}`}>{item.label}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{item.sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <InputField icon={<Phone size={16}/>} type="tel" placeholder="05XX XXX XX XX" value={phone} onChange={handlePhoneChange} />
              <InputField icon={<Gift  size={16}/>} type="text" placeholder="Davet Kodu (İsteğe Bağlı)" value={referralCode} onChange={e=>setReferralCode(e.target.value.toUpperCase())} />
            </>
          )}

          <InputField icon={<Mail size={16}/>} type="email" placeholder="E-posta adresi" value={email} onChange={e=>setEmail(e.target.value)} />

          <InputField
            icon={<Lock size={16}/>}
            type={showPw ? 'text' : 'password'}
            placeholder="Şifre"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            suffix={
              <button type="button" onClick={()=>setShowPw(s=>!s)} className="text-white/40 hover:text-white/70 transition p-1">
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            }
          />

          {!isLogin && (
            <InputField icon={<Lock size={16}/>} type={showPw?'text':'password'} placeholder="Şifre (Tekrar)" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
          )}

          {error && (
            <div className="bg-rose-500/20 border border-rose-400/40 rounded-xl px-4 py-3 text-rose-300 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Buton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
            style={{
              background: 'linear-gradient(135deg,#2F80ED,#56CCF2)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            }}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  {isLogin ? 'Giriş yapılıyor...' : 'Kaydediliyor...'}
                </span>
              : isLogin ? 'Giriş Yap' : 'Kayıt Ol'
            }
          </button>
        </form>

        {/* ── Trust badges ── */}
        <div className="flex items-center justify-center gap-5 mt-6 flex-wrap">
          <TrustBadge icon={ShieldCheck}  text="Güvenli Giriş" />
          <TrustBadge icon={Clock}        text="7/24 Hizmet" />
          <TrustBadge icon={BadgeCheck}   text="Doğrulanmış Ustalar" />
        </div>
      </div>
    </div>
  )
}
