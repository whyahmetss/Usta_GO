import { useState, useEffect } from 'react' // useEffect burada MUTLAKA olmalı!
import { useNavigate, useLocation } from 'react-router-dom' // useLocation burada MUTLAKA olmalı!
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'



function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [role, setRole] = useState('CUSTOMER') 
  const [error, setError] = useState('')
  
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const location = useLocation()

  // URL'den gelen referans kodunu otomatik yakala
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get('ref')
    if (ref) {
      setReferralCode(ref.toUpperCase())
      setIsLogin(false) // Kodla gelmişse direkt Kayıt Ol sayfasını aç
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (isLogin) {
        // GİRİŞ İŞLEMİ
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
        // KAYIT İŞLEMİ
        if (!name || !email || !password || !phone) {
          setError('Lütfen tüm alanları doldurun')
          return
        }

        if (password.length < 6) {
          setError('Şifre en az 6 karakter olmalı')
          return
        }

        const phoneRegex = /^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          setError('Telefon formatı: 05XX XXX XX XX')
          return
        }

        const result = await register(email, password, name, role, phone, referralCode || null)
        
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

  return (
    <div className="min-h-screen blue-gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="xl" className="mb-4 shadow-xl" />
          <h1 className="text-4xl font-black text-white mb-2">Usta Go</h1>
          <p className="text-white/80">Profesyonel Ev Hizmetleri</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError('') }}
              className={`flex-1 py-3 rounded-xl font-bold transition ${isLogin ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError('') }}
              className={`flex-1 py-3 rounded-xl font-bold transition ${!isLogin ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}
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

                <div className="space-y-2">
                  <label className="text-white text-sm font-semibold">Nasıl kayıt olmak istersiniz?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('CUSTOMER')}
                      className={`p-4 rounded-xl border-2 transition ${role === 'CUSTOMER' ? 'bg-white border-white' : 'bg-white/20 border-white/30'}`}
                    >
                      <div className="text-3xl mb-2">👤</div>
                      <div className={`font-bold text-sm ${role === 'CUSTOMER' ? 'text-blue-600' : 'text-white'}`}>Müşteri</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('USTA')}
                      className={`p-4 rounded-xl border-2 transition ${role === 'USTA' ? 'bg-white border-white' : 'bg-white/20 border-white/30'}`}
                    >
                      <div className="text-3xl mb-2">⚡</div>
                      <div className={`font-bold text-sm ${role === 'USTA' ? 'text-blue-600' : 'text-white'}`}>Usta</div>
                    </button>
                  </div>
                </div>
<input
  type="tel"
  placeholder="Telefon (05XX XXX XX XX)"
  value={phone}
  onChange={(e) => {
    let val = e.target.value.replace(/\D/g, '') // Sadece rakamları al
    
    // 11 karakter sınırı (05XXXXXXXXX)
    if (val.length > 11) val = val.slice(0, 11)
    
    // Formatlama: 4-3-2-2 (05XX XXX XX XX)
    let formattedVal = ''
    if (val.length > 0) {
      formattedVal = val.slice(0, 4) // 05XX
      if (val.length > 4) formattedVal += ' ' + val.slice(4, 7) // XXX
      if (val.length > 7) formattedVal += ' ' + val.slice(7, 9) // XX
      if (val.length > 9) formattedVal += ' ' + val.slice(9, 11) // XX
    }
    
    setPhone(formattedVal)
  }}
  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
/>
                <input
                  type="text"
                  placeholder="Davet Kodu (İsteğe Bağlı)"
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
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-center">
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
        </div>
      </div>
    </div>
  )
}

export default AuthPage
