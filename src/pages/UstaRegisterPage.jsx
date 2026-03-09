import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import {
  User, Phone, Mail, Lock, Gift, Eye, EyeOff, Calendar,
  CreditCard, FileText, MapPin, Building2, Camera,
  CheckCircle, ChevronLeft, Upload, AlertCircle,
} from 'lucide-react'

const DOC_FIELDS = [
  { id: 'kimlikOn', label: 'TC Kimlik Ön Yüz', desc: 'Kimliğinizin ön yüzünün fotoğrafı', icon: CreditCard, color: 'blue', required: true },
  { id: 'kimlikArka', label: 'TC Kimlik Arka Yüz', desc: 'Kimliğinizin arka yüzünün fotoğrafı', icon: CreditCard, color: 'blue', required: true },
  { id: 'meslek', label: 'Mesleki Sertifika / Yetki Belgesi', desc: 'Meslek belgeniz, ustalık veya yetki sertifikanız', icon: FileText, color: 'emerald', required: true },
  { id: 'adres', label: 'Adres / İkametgah Belgesi', desc: 'Son 3 aya ait fatura veya ikametgah belgesi', icon: MapPin, color: 'violet', required: true },
  { id: 'adliSicil', label: 'Adli Sicil Kaydı', desc: 'E-devlet\'ten alınan güncel adli sicil kaydı belgesi', icon: FileText, color: 'rose', required: true },
  { id: 'vergi', label: 'Vergi Levhası', desc: 'Vergi levhanız (opsiyonel)', icon: Building2, color: 'amber', required: false },
  { id: 'profil', label: 'Profil Fotoğrafı', desc: 'Net, yüzünüzün göründüğü bir fotoğraf', icon: Camera, color: 'cyan', required: false },
]

const COLORS = {
  blue:    { card: 'border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-500/10', icon: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { card: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-500/10', icon: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  violet:  { card: 'border-violet-300 dark:border-violet-700 bg-violet-50/80 dark:bg-violet-500/10', icon: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400' },
  amber:   { card: 'border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-500/10', icon: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  rose:    { card: 'border-rose-300 dark:border-rose-700 bg-rose-50/80 dark:bg-rose-500/10', icon: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  cyan:    { card: 'border-cyan-300 dark:border-cyan-700 bg-cyan-50/80 dark:bg-cyan-500/10', icon: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
}

function Input({ icon: Icon, suffix, ...props }) {
  return (
    <div className="group">
      <div className="flex items-center gap-3 h-[52px] rounded-2xl px-4 bg-[#f0f4f8] dark:bg-white/[0.06] border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-white/[0.1] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] transition-all duration-200">
        <Icon size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors flex-shrink-0" />
        <input
          {...props}
          className="flex-1 bg-transparent text-[15px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none h-full font-medium"
        />
        {suffix}
      </div>
    </div>
  )
}

function DocCard({ field, file, onChange }) {
  const c = COLORS[field.color]
  const Icon = field.icon
  const done = Boolean(file)

  return (
    <label className="block cursor-pointer">
      <div className={`rounded-2xl border-2 p-4 transition-all duration-200 ${
        done ? c.card : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/15'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? c.icon : 'bg-slate-100 dark:bg-white/10'}`}>
            {done ? <CheckCircle size={20} className="text-white" /> : <Icon size={20} className="text-slate-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              {field.label}
              {field.required && <span className="text-rose-500 text-xs">*</span>}
            </p>
            {done
              ? <p className={`text-[11px] font-semibold mt-0.5 truncate ${c.text}`}>{file.name}</p>
              : <p className="text-[11px] text-slate-400 mt-0.5">{field.desc}</p>
            }
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? c.icon + ' opacity-80' : 'bg-slate-100 dark:bg-white/10'}`}>
            <Upload size={14} className={done ? 'text-white' : 'text-slate-400'} />
          </div>
        </div>
      </div>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
    </label>
  )
}

export default function UstaRegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [docs, setDocs] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 11)
    let fmt = val.slice(0, 4)
    if (val.length > 4) fmt += ' ' + val.slice(4, 7)
    if (val.length > 7) fmt += ' ' + val.slice(7, 9)
    if (val.length > 9) fmt += ' ' + val.slice(9, 11)
    setPhone(fmt)
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

  const handleNextStep = () => {
    setError('')
    if (!name.trim()) { setError('Ad Soyad gerekli'); return }
    if (!birthDate) { setError('Doğum tarihi zorunludur'); return }
    if (isUnder18()) { setError('18 yaş altı kayıt olamaz'); return }
    if (!phone.trim()) { setError('Telefon gerekli'); return }
    if (!email.trim()) { setError('E-posta gerekli'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    if (password !== confirmPassword) { setError('Şifreler eşleşmiyor'); return }
    if (!/^05\d{9}$/.test(phone.replace(/\s/g, ''))) { setError('Telefon formatı: 05XX XXX XX XX'); return }
    setStep(2)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const requiredDocs = DOC_FIELDS.filter(f => f.required)
    const missing = requiredDocs.filter(f => !docs[f.id])
    if (missing.length > 0) {
      setError(`Zorunlu belgeler eksik: ${missing.map(f => f.label).join(', ')}`)
      return
    }

    setLoading(true)
    try {
      const result = await register(email, password, name, 'USTA', phone, referralCode?.trim() || undefined, birthDate)
      if (!result?.success) {
        setError(result?.error || 'Kayıt başarısız')
        setLoading(false)
        return
      }

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
        } catch { /* devam */ }
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 dark:from-[#0a1628] dark:via-[#1a1a0e] dark:to-[#0a1628]">
      {/* Decorative */}
      <div className="absolute top-[-100px] right-[-60px] w-[280px] h-[280px] rounded-full bg-amber-400/20 dark:bg-amber-500/10 blur-3xl" />
      <div className="absolute bottom-[-80px] left-[-40px] w-[220px] h-[220px] rounded-full bg-orange-400/20 dark:bg-orange-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative pt-6 pb-8 px-5">
        <button
          onClick={() => step === 2 ? setStep(1) : navigate('/auth')}
          className="w-10 h-10 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur flex items-center justify-center border border-slate-200/60 dark:border-white/10 shadow-sm mb-6"
        >
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white">Usta Kayıt</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Hizmet vermeye başlayın</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-3 mt-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-400'
              }`}>
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
              {s < 2 && <div className={`w-10 h-0.5 rounded-full ${step > s ? 'bg-amber-400' : 'bg-slate-200 dark:bg-white/10'}`} />}
            </div>
          ))}
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">
            {step === 1 ? 'Kişisel Bilgiler' : 'Belgeler'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-5 pb-10">
        <div className="bg-white dark:bg-[#1a2332] rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-black/30 border border-slate-200/60 dark:border-white/[0.06] p-6">

          {step === 1 ? (
            <div className="space-y-4">
              <Input icon={User} type="text" placeholder="Adınız ve soyadınız" value={name} onChange={e => setName(e.target.value)} />
              <div>
                <Input icon={Calendar} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                {birthDate && isUnder18() && <p className="text-xs text-rose-500 font-medium mt-1 ml-1">18 yaş altı kayıt yapılamaz</p>}
              </div>
              <Input icon={Phone} type="tel" placeholder="05XX XXX XX XX" value={phone} onChange={handlePhoneChange} />
              <Input icon={Mail} type="email" placeholder="E-posta adresiniz" value={email} onChange={e => setEmail(e.target.value)} />
              <Input icon={Gift} type="text" placeholder="Davet kodu (isteğe bağlı)" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} />
              <Input
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                placeholder="Şifre (en az 6 karakter)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                suffix={
                  <button type="button" onClick={() => setShowPw(s => !s)} className="text-slate-400 hover:text-slate-600 p-1">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <Input icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Şifre tekrar" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

              {error && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl px-4 py-3">
                  <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/25 mt-2"
              >
                Devam Et →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 mb-5 flex gap-3">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Belge Yükleme</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                    Yıldızlı (*) belgeler zorunludur. Hesabınız belgeler incelendikten sonra onaylanacaktır.
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Zorunlu Belgeler</span>
                  <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400">{requiredUploaded}/{requiredTotal}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(requiredUploaded / requiredTotal) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {DOC_FIELDS.map(field => (
                  <DocCard key={field.id} field={field} file={docs[field.id] || null} onChange={file => setDocs(prev => ({ ...prev, [field.id]: file }))} />
                ))}
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl px-4 py-3 mb-4">
                  <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !allRequiredDone}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-amber-500/25"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Kaydediliyor...</span>
                  : !allRequiredDone
                    ? `Zorunlu belgeler eksik (${requiredTotal - requiredUploaded})`
                    : 'Kayıt Ol ve Başvur'
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
