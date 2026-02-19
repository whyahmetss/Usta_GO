import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [role, setRole] = useState('customer') // customer veya professional
  const [error, setError] = useState('')
  
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (isLogin) {
      // Giriş
      const result = login(email, password)
      if (result.success) {
        // Role'e göre yönlendir
        if (result.role === 'admin') {
          navigate('/admin')
        } else if (result.role === 'professional') {
          navigate('/professional')
        } else {
          navigate('/home')
        }
      } else {
        setError(result.error || 'Giriş başarısız')
      }
    } else {
      // Kayıt
      if (!name || !email || !password || !phone) {
        setError('Lütfen tüm alanları doldurun')
        return
      }

      // Phone format validation (05XX XXX XX XX)
      const phoneRegex = /^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        setError('Telefon formatı: 05XX XXX XX XX')
        return
      }

      const result = register(email, password, name, role, phone, referralCode || null)
      if (result.success) {
        // Role'e göre yönlendir
        if (result.role === 'professional') {
          navigate('/professional')
        } else {
          navigate('/home')
        }
      } else {
        setError(result.error || 'Kayıt başarısız')
      }
    }
  }

  return (
    <div className="min-h-screen blue-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-xl">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Usta Go</h1>
          <p className="text-white/80">Profesyonel Ev Hizmetleri</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsLogin(true)
                setError('')
              }}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                isLogin
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setError('')
              }}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                !isLogin
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />

                {/* Role Seçimi */}
                <div className="space-y-2">
                  <label className="text-white text-sm font-semibold">Nasıl kayıt olmak istersiniz?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`p-4 rounded-xl border-2 transition ${
                        role === 'customer'
                          ? 'bg-white border-white'
                          : 'bg-white/20 border-white/30'
                      }`}
                    >
                      <div className="text-3xl mb-2">👤</div>
                      <div className={`font-bold text-sm ${role === 'customer' ? 'text-blue-600' : 'text-white'}`}>
                        Müşteri
                      </div>
                      <div className={`text-xs ${role === 'customer' ? 'text-blue-600/70' : 'text-white/60'}`}>
                        Hizmet almak için
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setRole('professional')}
                      className={`p-4 rounded-xl border-2 transition ${
                        role === 'professional'
                          ? 'bg-white border-white'
                          : 'bg-white/20 border-white/30'
                      }`}
                    >
                      <div className="text-3xl mb-2">⚡</div>
                      <div className={`font-bold text-sm ${role === 'professional' ? 'text-blue-600' : 'text-white'}`}>
                        Usta
                      </div>
                      <div className={`text-xs ${role === 'professional' ? 'text-blue-600/70' : 'text-white/60'}`}>
                        Hizmet vermek için
                      </div>
                    </button>
                  </div>
                </div>

                {/* Telefon Numarası */}
                <input
                  type="tel"
                  placeholder="Telefon (05XX XXX XX XX)"
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '')
                    if (val.length > 10) val = val.slice(0, 10)
                    if (val.startsWith('5')) val = '0' + val
                    // Format: 05XX XXX XX XX
                    if (val.length === 10) {
                      val = `${val.slice(0, 4)} ${val.slice(4, 7)} ${val.slice(7, 9)} ${val.slice(9)}`
                    } else if (val.length > 4 && val.length <= 7) {
                      val = `${val.slice(0, 4)} ${val.slice(4)}`
                    } else if (val.length > 7) {
                      val = `${val.slice(0, 4)} ${val.slice(4, 7)} ${val.slice(7)}`
                    }
                    setPhone(val)
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />

                {/* Davet Kodu */}
                <input
                  type="text"
                  placeholder="Davet Kodun Var Mı? (Opsiyonel)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </>
            )}

            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-white/90 transition shadow-xl"
            >
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>

          {isLogin && (
            <p className="text-white/60 text-xs text-center mt-4">
              Admin: admin@admin.com / 1234
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
