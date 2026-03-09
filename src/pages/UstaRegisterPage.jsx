import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import {
  User, Phone, Mail, Lock, Gift, Eye, EyeOff,
  CreditCard, FileText, MapPin, Building2, Camera,
  CheckCircle, ChevronLeft, Upload, AlertCircle,
} from 'lucide-react'

// Yüklenecek belge tanımları
const DOC_FIELDS = [
  {
    id: 'kimlikOn',
    label: 'TC Kimlik Ön Yüz',
    desc: 'Kimliğinizin ön yüzünün fotoğrafı',
    icon: CreditCard,
    color: 'blue',
    required: true,
  },
  {
    id: 'kimlikArka',
    label: 'TC Kimlik Arka Yüz',
    desc: 'Kimliğinizin arka yüzünün fotoğrafı',
    icon: CreditCard,
    color: 'blue',
    required: true,
  },
  {
    id: 'meslek',
    label: 'Mesleki Sertifika / Yetki Belgesi',
    desc: 'Meslek belgeniz, ustalık veya yetki sertifikanız',
    icon: FileText,
    color: 'emerald',
    required: true,
  },
  {
    id: 'adres',
    label: 'Adres / İkametgah Belgesi',
    desc: 'Son 3 aya ait fatura veya ikametgah belgesi',
    icon: MapPin,
    color: 'violet',
    required: true,
  },
  {
    id: 'adliSicil',
    label: 'Adli Sicil Kaydı',
    desc: 'E-devlet\'ten alınan güncel adli sicil kaydı belgesi',
    icon: FileText,
    color: 'rose',
    required: true,
  },
  {
    id: 'vergi',
    label: 'Vergi Levhası',
    desc: 'Vergi levhanız (opsiyonel)',
    icon: Building2,
    color: 'amber',
    required: false,
  },
  {
    id: 'profil',
    label: 'Profil Fotoğrafı',
    desc: 'Net, yüzünüzün göründüğü bir fotoğraf',
    icon: Camera,
    color: 'cyan',
    required: false,
  },
]

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200 dark:border-blue-800' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-800' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/30', icon: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-200 dark:border-violet-800' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-800' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-950/30', icon: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200 dark:border-rose-800' },
  cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-950/30', icon: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-200 dark:border-cyan-800' },
}

function DocUploadCard({ field, file, onChange }) {
  const c = COLOR_MAP[field.color]
  const Icon = field.icon
  const uploaded = Boolean(file)

  return (
    <label className="block cursor-pointer">
      <div className={`relative rounded-2xl border-2 p-4 transition-all ${
        uploaded
          ? `${c.border} ${c.bg}`
          : 'border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:border-gray-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${uploaded ? c.icon : 'bg-gray-100 dark:bg-[#273548]'}`}>
            {uploaded
              ? <CheckCircle size={20} className="text-white" />
              : <Icon size={20} className="text-gray-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              {field.label}
              {field.required && <span className="text-rose-500 text-xs">*</span>}
            </p>
            {uploaded
              ? <p className={`text-[11px] font-semibold mt-0.5 truncate ${c.text}`}>{file.name}</p>
              : <p className="text-[11px] text-gray-400 mt-0.5">{field.desc}</p>
            }
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${uploaded ? c.icon + ' opacity-80' : 'bg-gray-100 dark:bg-[#273548]'}`}>
            <Upload size={14} className={uploaded ? 'text-white' : 'text-gray-400'} />
          </div>
        </div>
      </div>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={e => onChange(e.target.files?.[0] || null)}
      />
    </label>
  )
}

function InputField({ icon, suffix, label, ...props }) {
  return (
    <div>
      {label && <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>}
      <div className="flex items-center gap-3 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-2xl px-4 h-[52px] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        {icon}
        <input
          {...props}
          className="flex-1 bg-transparent text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none h-full"
        />
        {suffix}
      </div>
    </div>
  )
}

function UstaRegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [docs, setDocs] = useState({}) // { kimlikOn: File, kimlikArka: File, ... }
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: kişisel bilgiler, 2: belgeler

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)
    let fmt = ''
    if (val.length > 0) {
      fmt = val.slice(0, 4)
      if (val.length > 4) fmt += ' ' + val.slice(4, 7)
      if (val.length > 7) fmt += ' ' + val.slice(7, 9)
      if (val.length > 9) fmt += ' ' + val.slice(9, 11)
    }
    setPhone(fmt)
  }

  const handleNextStep = () => {
    setError('')
    if (!name.trim()) { setError('Ad Soyad gerekli'); return }
    if (!phone.trim()) { setError('Telefon gerekli'); return }
    if (!email.trim()) { setError('E-posta gerekli'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    if (password !== confirmPassword) { setError('Şifreler eşleşmiyor'); return }
    const phoneRegex = /^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) { setError('Telefon formatı: 05XX XXX XX XX'); return }
    setStep(2)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Zorunlu belgeleri kontrol et
    const requiredDocs = DOC_FIELDS.filter(f => f.required)
    const missing = requiredDocs.filter(f => !docs[f.id])
    if (missing.length > 0) {
      setError(`Zorunlu belgeler eksik: ${missing.map(f => f.label).join(', ')}`)
      return
    }

    setLoading(true)
    try {
      // 1. Kullanıcı kaydı
      const result = await register(email, password, name, 'USTA', phone, referralCode?.trim() || undefined)
      if (!result?.success) {
        setError(result?.error || 'Kayıt başarısız')
        setLoading(false)
        return
      }

      // 2. Her belgeyi sırayla yükle
      for (const field of DOC_FIELDS) {
        const file = docs[field.id]
        if (!file) continue
        try {
          const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo')
          const fileUrl = uploadRes?.data?.url || uploadRes?.url
          if (fileUrl) {
            await fetchAPI(API_ENDPOINTS.CERTIFICATES.UPLOAD, {
              method: 'POST',
              body: { fileUrl, type: field.id, label: field.label },
            })
          }
        } catch {
          // Belge yükleme hatası kritik değil, devam et
        }
      }

      navigate('/professional')
    } catch (err) {
      setError(err.message || 'Kayıt sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const requiredUploaded = DOC_FIELDS.filter(f => f.required && docs[f.id]).length
  const requiredTotal = DOC_FIELDS.filter(f => f.required).length
  const allRequiredDone = requiredUploaded === requiredTotal

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] dark:bg-[#0F172A]">
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center pt-12 pb-10 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500 to-orange-500" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fde68a 0%, transparent 60%), radial-gradient(circle at 80% 70%, #fb923c 0%, transparent 50%)" }} />

        {/* Geri butonu */}
        <button
          onClick={() => step === 2 ? setStep(1) : navigate('/auth')}
          className="absolute left-5 top-5 z-20 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>

        <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
          <span className="text-2xl">⚡</span>
        </div>
        <h1 className="relative z-10 text-xl font-black text-white mb-1">Usta Kayıt</h1>
        <p className="relative z-10 text-white/75 text-sm">Hizmet vermeye başlayın</p>

        {/* Adım göstergesi */}
        <div className="relative z-10 flex items-center gap-2 mt-5">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? 'bg-white text-amber-500' : 'bg-white/30 text-white'
              }`}>
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              {s < 2 && <div className={`w-8 h-0.5 rounded-full ${step > s ? 'bg-white' : 'bg-white/30'}`} />}
            </div>
          ))}
          <p className="ml-2 text-white/80 text-xs font-medium">
            {step === 1 ? 'Kişisel Bilgiler' : 'Belgeler'}
          </p>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 -mt-6 bg-[#F5F7FB] dark:bg-[#0F172A] rounded-t-3xl px-5 pt-6 pb-10">

        {step === 1 ? (
          /* ── Adım 1: Kişisel Bilgiler ── */
          <div className="space-y-3.5">
            <InputField
              icon={<User size={16} className="text-gray-400 flex-shrink-0" />}
              label="Ad Soyad"
              type="text"
              placeholder="Adınız ve soyadınız"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <InputField
              icon={<Phone size={16} className="text-gray-400 flex-shrink-0" />}
              label="Telefon"
              type="tel"
              placeholder="05XX XXX XX XX"
              value={phone}
              onChange={handlePhoneChange}
            />
            <InputField
              icon={<Mail size={16} className="text-gray-400 flex-shrink-0" />}
              label="E-posta"
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <InputField
              icon={<Gift size={16} className="text-gray-400 flex-shrink-0" />}
              label="Davet Kodu (İsteğe Bağlı)"
              type="text"
              placeholder="Davet kodu varsa girin"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
            />
            <InputField
              icon={<Lock size={16} className="text-gray-400 flex-shrink-0" />}
              label="Şifre"
              type={showPassword ? 'text' : 'password'}
              placeholder="En az 6 karakter"
              value={password}
              onChange={e => setPassword(e.target.value)}
              suffix={
                <button type="button" onClick={() => setShowPassword(s => !s)} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <InputField
              icon={<Lock size={16} className="text-gray-400 flex-shrink-0" />}
              label="Şifre Tekrar"
              type={showPassword ? 'text' : 'password'}
              placeholder="Şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />

            {error && <ErrorBox msg={error} />}

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/25 mt-2"
            >
              Devam Et →
            </button>
          </div>
        ) : (
          /* ── Adım 2: Belgeler ── */
          <form onSubmit={handleSubmit}>
            {/* Bilgi kutusu */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-5 flex gap-3">
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Belge Yükleme</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Yıldızlı (*) belgeler zorunludur. Hesabınız belgeler incelendikten sonra onaylanacaktır. PDF, JPG veya PNG formatı kabul edilmektedir.
                </p>
              </div>
            </div>

            {/* İlerleme çubuğu */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Zorunlu Belgeler</p>
                <p className="text-[11px] font-bold text-[#2563EB]">{requiredUploaded}/{requiredTotal} yüklendi</p>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-[#273548] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all"
                  style={{ width: `${(requiredUploaded / requiredTotal) * 100}%` }}
                />
              </div>
            </div>

            {/* Belge alanları */}
            <div className="space-y-3 mb-5">
              {DOC_FIELDS.map(field => (
                <DocUploadCard
                  key={field.id}
                  field={field}
                  file={docs[field.id] || null}
                  onChange={file => setDocs(prev => ({ ...prev, [field.id]: file }))}
                />
              ))}
            </div>

            {error && <ErrorBox msg={error} />}

            <button
              type="submit"
              disabled={loading || !allRequiredDone}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-amber-500/25"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Kaydediliyor...
                  </span>
                : !allRequiredDone
                  ? `Zorunlu belgeler eksik (${requiredTotal - requiredUploaded} adet)`
                  : 'Kayıt Ol ve Başvur'
              }
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-3.5">
      <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{msg}</p>
    </div>
  )
}

export default UstaRegisterPage
