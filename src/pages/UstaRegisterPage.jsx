import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import Logo from '../components/Logo'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { Upload, Eye, EyeOff } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title="Usta Kayıt" onBack={() => navigate(-1)} />

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" className="mb-3" />
          <h1 className="text-lg font-bold text-gray-900">Profesyonel Kayıt</h1>
          <p className="text-gray-500 text-sm mt-1">Profesyonel olarak hizmet vermek için kayıt olun</p>
        </div>

        <Card padding="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Ad Soyad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm text-gray-900 placeholder-gray-400"
            />
            <input
              type="tel"
              placeholder="Telefon (05XX XXX XX XX)"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm text-gray-900 placeholder-gray-400"
            />
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm text-gray-900 placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Davet Kodu (İsteğe Bağlı)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm text-gray-900 placeholder-gray-400"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm text-gray-900 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Şifre (Tekrar)"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 text-sm text-gray-900 placeholder-gray-400"
            />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Sertifika / Meslek Belgesi (Zorunlu)</label>
              <label className="block cursor-pointer">
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition ${
                    certFile
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <Upload size={24} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-700">{certFile ? certFile.name : 'Belge yüklemek için tıklayın'}</p>
                  <p className="text-[11px] text-gray-500 mt-1">PDF, JPG veya PNG</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <p className="text-rose-700 text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold text-sm hover:bg-primary-600 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default UstaRegisterPage
