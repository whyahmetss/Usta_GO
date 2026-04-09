import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import mainLogo from '../assets/main-logo.png'
import {
  User, Phone, Mail, Lock, Eye, EyeOff,
  CreditCard, FileText, MapPin, Building2, Camera,
  CheckCircle, ArrowLeft, Upload, AlertCircle, ShieldCheck, Zap,
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
  blue:    { card: 'border-blue-200 bg-blue-50/80', icon: 'bg-blue-500', text: 'text-blue-600' },
  emerald: { card: 'border-emerald-200 bg-emerald-50/80', icon: 'bg-emerald-500', text: 'text-emerald-600' },
  violet:  { card: 'border-violet-200 bg-violet-50/80', icon: 'bg-violet-500', text: 'text-violet-600' },
  amber:   { card: 'border-amber-200 bg-amber-50/80', icon: 'bg-amber-500', text: 'text-amber-600' },
  rose:    { card: 'border-rose-200 bg-rose-50/80', icon: 'bg-rose-500', text: 'text-rose-600' },
  cyan:    { card: 'border-cyan-200 bg-cyan-50/80', icon: 'bg-cyan-500', text: 'text-cyan-600' },
}

function Input({ icon: Icon, suffix, ...props }) {
  return (
    <div className="group">
      <div className="flex items-center gap-3 h-[52px] rounded-2xl px-4 bg-[#F8F9FA] border-2 border-transparent focus-within:border-[#0A66C2] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(10,102,194,0.08)] transition-all duration-200">
        <Icon size={18} className="text-gray-400 group-focus-within:text-[#0A66C2] transition-colors flex-shrink-0" />
        <input
          {...props}
          className="flex-1 bg-transparent text-[15px] text-gray-800 placeholder-gray-400 outline-none h-full font-medium"
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
        done ? c.card : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? c.icon : 'bg-gray-100'}`}>
            {done ? <CheckCircle size={20} className="text-white" /> : <Icon size={20} className="text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
              {field.label}
              {field.required && <span className="text-red-500 text-xs">*</span>}
            </p>
            {done
              ? <p className={`text-[11px] font-semibold mt-0.5 truncate ${c.text}`}>{file.name}</p>
              : <p className="text-[11px] text-gray-400 mt-0.5">{field.desc}</p>
            }
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? c.icon + ' opacity-80' : 'bg-gray-100'}`}>
            <Upload size={14} className={done ? 'text-white' : 'text-gray-400'} />
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

  // Force light mode
  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    root.setAttribute('data-force-light', 'true')
    return () => {
      root.removeAttribute('data-force-light')
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
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

  const handleNextStep = () => {
    setError('')
    if (!name.trim()) { setError('Ad Soyad gerekli'); return }
    if (!phone.trim()) { setError('Telefon gerekli'); return }
    if (!/^05\d{9}$/.test(phone.replace(/\s/g, ''))) { setError('Telefon formatı: 05XX XXX XX XX'); return }
    if (!email.trim()) { setError('E-posta gerekli'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
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
      const result = await register(email, password, name, 'USTA', phone)
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
    <div className="min-h-screen auth-bg flex flex-col">
      {/* ── Header ── */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src={mainLogo} alt="UstaGO" className="w-9 h-9 rounded-xl object-cover" />
            <span className="text-lg font-extrabold tracking-tight text-gray-900">Usta<span className="text-[#0A66C2]">GO</span></span>
          </a>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[#0A66C2] font-semibold text-sm rounded-xl border-2 border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all duration-200"
          >
            Giriş Yap
          </a>
        </div>
      </nav>

      {/* ── Main Content: Split Layout ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-stretch gap-8 lg:gap-12">

          {/* ── LEFT: Hero Image Panel (desktop only) ── */}
          <div className="hidden lg:flex flex-1 relative rounded-3xl overflow-hidden min-h-[600px] bg-gradient-to-br from-[#0A66C2]/5 to-[#0A66C2]/10">
            {/* Worker Photo */}
            <img
              src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=85"
              alt="UstaGO Profesyonel Usta"
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A66C2]/80 via-transparent to-white/20" />

            {/* Floating Review Card - Top Right */}
            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl shadow-black/10 animate-[float_3s_ease-in-out_infinite]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-[#0A66C2] flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <span className="text-xs font-bold text-gray-800">Kimlik Onaylı</span>
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
                <span className="text-[10px] font-bold text-gray-500 ml-1">5.0</span>
              </div>
            </div>

            {/* Floating Review Card - Bottom Left */}
            <div className="absolute bottom-24 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl shadow-black/10 animate-[float_3s_ease-in-out_infinite_0.5s]">
              <p className="text-[11px] font-bold text-gray-800 mb-1">Murat Y.</p>
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed max-w-[160px]">"Harika bir iş, zamanında geldi ve temiz bıraktı."</p>
            </div>

            {/* Bottom Stats Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#0A66C2]">2,500+</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aktif Usta</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#0A66C2]">15,000+</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tamamlanan İş</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-lg font-extrabold text-[#0A66C2]">4.8</p>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Ortalama Puan</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Form Panel ── */}
          <div className="w-full lg:w-[480px] shrink-0">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                Hizmet Ver
              </h1>
              <p className="text-sm text-gray-500">
                Uzmanlığını paylaş, kazan. UstaGO ailesine katıl.
              </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-7 sm:p-8">
              {/* Stepper */}
              <div className="flex items-center mb-7">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= 1 ? 'bg-[#0A66C2] text-white shadow-md shadow-[#0A66C2]/20' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step > 1 ? <CheckCircle size={16} /> : '1'}
                  </div>
                  <span className={`text-[11px] font-semibold ${step >= 1 ? 'text-[#0A66C2]' : 'text-gray-400'}`}>Kişisel Bilgiler</span>
                </div>
                <div className="flex-1 mx-4 h-0.5 rounded-full relative top-[-10px]">
                  <div className={`h-full rounded-full transition-all duration-300 ${step > 1 ? 'bg-[#0A66C2]' : 'bg-gray-200'}`} />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= 2 ? 'bg-[#0A66C2] text-white shadow-md shadow-[#0A66C2]/20' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step > 2 ? <CheckCircle size={16} /> : '2'}
                  </div>
                  <span className={`text-[11px] font-semibold ${step >= 2 ? 'text-[#0A66C2]' : 'text-gray-400'}`}>Belgeler</span>
                </div>
              </div>

              {step === 1 ? (
                <div className="space-y-4">
                  <Input icon={User} type="text" placeholder="Adınız ve soyadınız" value={name} onChange={e => setName(e.target.value)} />
                  <Input icon={Phone} type="tel" placeholder="05XX XXX XX XX" value={phone} onChange={handlePhoneChange} />
                  <Input icon={Mail} type="email" placeholder="E-posta adresiniz" value={email} onChange={e => setEmail(e.target.value)} />
                  <Input
                    icon={Lock}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Şifre (en az 6 karakter)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    suffix={
                      <button type="button" onClick={() => setShowPw(s => !s)} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                      <p className="text-red-600 text-sm font-medium text-center">{error}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-4 bg-[#0A66C2] hover:bg-[#084E96] text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all shadow-lg shadow-[#0A66C2]/20 hover:shadow-[#0A66C2]/30 hover:-translate-y-0.5 mt-2"
                  >
                    Devam Et
                  </button>

                  {/* Trust signals inline */}
                  <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
                    {[
                      { icon: ShieldCheck, text: 'Kimlik Onaylı Profil' },
                      { icon: Lock, text: 'Güvenli Ödeme Sistemi' },
                    ].map(b => (
                      <div key={b.text} className="flex items-center gap-1.5 text-gray-400">
                        <b.icon size={12} />
                        <span className="text-[10px] font-semibold">{b.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
                    className="flex items-center gap-1.5 text-gray-500 text-sm mb-5 hover:text-gray-700 transition"
                  >
                    <ArrowLeft size={15} /> Geri dön
                  </button>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex gap-3">
                    <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Belge Yükleme</p>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                        Yıldızlı (*) belgeler zorunludur. Hesabınız belgeler incelendikten sonra onaylanacaktır.
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Zorunlu Belgeler</span>
                      <span className="text-[12px] font-bold text-[#0A66C2]">{requiredUploaded}/{requiredTotal}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0A66C2] rounded-full transition-all duration-500" style={{ width: `${(requiredUploaded / requiredTotal) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    {DOC_FIELDS.map(field => (
                      <DocCard key={field.id} field={field} file={docs[field.id] || null} onChange={file => setDocs(prev => ({ ...prev, [field.id]: file }))} />
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
                    <div className="flex gap-3">
                      <ShieldCheck size={18} className="text-[#0A66C2] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-blue-800">Kişisel Verilerin Korunması</p>
                        <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                          Yüklediğiniz belgeler 6698 sayılı KVKK kapsamında güvenle saklanmakta olup yalnızca hesap doğrulama amacıyla kullanılacaktır. Detaylı bilgi için{' '}
                          <a href="/legal/kvkk" target="_blank" className="underline font-semibold hover:text-blue-900 transition">
                            Aydınlatma Metni
                          </a>'ni inceleyebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
                      <p className="text-red-600 text-sm font-medium text-center">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !allRequiredDone}
                    className="w-full py-4 bg-[#0A66C2] hover:bg-[#084E96] text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#0A66C2]/20 hover:shadow-[#0A66C2]/30 hover:-translate-y-0.5"
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
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={mainLogo} alt="UstaGO" className="w-6 h-6 rounded-md object-cover" />
            <span className="text-sm font-bold text-gray-400">UstaGO</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="/legal/terms" className="hover:text-gray-600 transition-colors">Kullanım Koşulları</a>
            <a href="/legal/privacy" className="hover:text-gray-600 transition-colors">Gizlilik Politikası</a>
            <a href="/legal/kvkk" className="hover:text-gray-600 transition-colors">KVKK</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
