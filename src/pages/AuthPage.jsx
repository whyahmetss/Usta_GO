import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (isLogin) {
        const result = await login(email, password)
        if (result && result.success) {
          if (result.role?.toLowerCase() === 'admin') {
            navigate('/admin')
          } else if (result.role?.toLowerCase() === 'usta' || result.role?.toLowerCase() === 'professional') {
            navigate('/professional')
          } else {
            navigate('/home')
          }
        } else {
          setError(result?.error || 'Giriş başarısız')
        }
      } else {
        if (!name || !email || !password || !confirmPassword || !phone) {
          setError('Lütfen tüm alanları doldurun')
          return
        }

        if (password.length < 6) {
          setError('Şifre en az 6 karakter olmalı')
          return
        }
        if (password !== confirmPassword) {
          setError('Şifreler eşleşmiyor')
          return
        }

        const phoneRegex = /^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          setError('Telefon formatı: 05XX XXX XX XX')
          return
        }

        const result = await register(
          email,
          password,
          name,
          role,
          phone,
          referralCode?.trim() ? referralCode.trim() : undefined
        )

        if (result && result.success) {
          if (role === 'USTA' || result.role === 'professional') {
            navigate('/professional')
          } else {
            navigate('/home')
          }
        } else {
          setError(result?.error || 'Kayıt başarısız')
        }
      }
    } catch (err) {
      setError('Bir bağlantı hatası oluştu')
    }
  }

  const inputBase = 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 transition'
  const labelBase = 'block text-xs font-semibold text-gray-600 mb-1.5'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-50/40 via-transparent to-gray-50/80 pointer-events-none" aria-hidden />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" className="mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-1">Usta Go</h1>
          <p className="text-sm text-gray-500">Profesyonel Ev Hizmetleri</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 sm:p-8">
          {/* Pill-style segment control */}
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${isLogin ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${!isLogin ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className={labelBase}>Ad Soyad</label>
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputBase}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelBase}>Nasıl kayıt olmak istersiniz?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('CUSTOMER')}
                      className={`p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${role === 'CUSTOMER' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <div className="text-2xl mb-1.5">👤</div>
                      <div className="font-semibold text-sm">Müşteri</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRole('USTA'); navigate('/register/usta') }}
                      className={`p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${role === 'USTA' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <div className="text-2xl mb-1.5">⚡</div>
                      <div className="font-semibold text-sm">Usta</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Telefon</label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '')
                      if (val.length > 11) val = val.slice(0, 11)
                      let formattedVal = ''
                      if (val.length > 0) {
                        formattedVal = val.slice(0, 4)
                        if (val.length > 4) formattedVal += ' ' + val.slice(4, 7)
                        if (val.length > 7) formattedVal += ' ' + val.slice(7, 9)
                        if (val.length > 9) formattedVal += ' ' + val.slice(9, 11)
                      }
                      setPhone(formattedVal)
                    }}
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className={labelBase}>Davet Kodu (İsteğe Bağlı)</label>
                  <input
                    type="text"
                    placeholder="Davet Kodu"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className={inputBase}
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelBase}>E-posta</label>
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label className={labelBase}>Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Şifreniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputBase} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary-500 hover:text-primary-600"
                >
                  {showPassword ? 'Gizle' : 'Göster'}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className={labelBase}>Şifre (Tekrar)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputBase}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-rose-600 text-sm font-medium text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-primary-500 text-white rounded-2xl font-semibold text-sm shadow-sm hover:bg-primary-600 active:scale-[0.98] transition-all"
            >
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
