import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import Logo from '../components/Logo'
import { ArrowLeft, Upload } from 'lucide-react'

function UstaRegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [certFile, setCertFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    if (!certFile) {
      setError('Sertifika veya meslek belgesi yüklemek zorunludur')
      return
    }

    setLoading(true)
    try {
      const result = await register(email, password, name, 'USTA', phone, referralCode?.trim() ? referralCode.trim() : undefined)
      if (!result?.success) {
        setError(result?.error || 'Kayıt başarısız')
        setLoading(false)
        return
      }
      const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, certFile, 'photo')
      const fileUrl = uploadRes.data?.url || uploadRes.url
      if (!fileUrl) throw new Error('Belge yüklenemedi')
      await fetchAPI(API_ENDPOINTS.CERTIFICATES.UPLOAD, {
        method: 'POST',
        body: { fileUrl },
      })
      navigate('/professional')
    } catch (err) {
      setError(err.message || 'Kayıt sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen blue-gradient-bg flex flex-col p-4">
      <button onClick={() => navigate(-1)} className="self-start w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
        <ArrowLeft size={20} className="text-white" />
      </button>
      <div className="flex flex-col items-center text-center mb-6">
        <Logo size="lg" className="mb-4 shadow-2xl rounded-3xl" />
        <h1 className="text-3xl font-black text-white">Usta Kayıt</h1>
        <p className="text-white/80 text-sm mt-1">Profesyonel olarak hizmet vermek için kayıt olun</p>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20 max-w-md w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
          <input type="tel" placeholder="Telefon (05XX XXX XX XX)" value={phone} onChange={handlePhoneChange}
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
          <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
          <input type="text" placeholder="Davet Kodu (İsteğe Bağlı)" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-20 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/80">Göster/Gizle</button>
          </div>
          <input type={showPassword ? 'text' : 'password'} placeholder="Şifre (Tekrar)" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />

          {/* Zorunlu belge alanı */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">Sertifika / Meslek Belgesi (Zorunlu)</label>
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition ${certFile ? 'border-green-400 bg-green-500/20' : 'border-white/40 bg-white/10 hover:bg-white/20'}`}>
                <Upload size={28} className="mx-auto mb-2 text-white/80" />
                <p className="text-white font-semibold text-sm">{certFile ? certFile.name : 'Belge yüklemek için tıklayın'}</p>
                <p className="text-white/60 text-xs mt-1">PDF, JPG veya PNG</p>
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-white/90 transition shadow-xl disabled:opacity-60">
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UstaRegisterPage
