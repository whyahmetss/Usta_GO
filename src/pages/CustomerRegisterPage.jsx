import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { CreditCard, MapPin, Upload, CheckCircle, ChevronLeft, AlertCircle, ShieldCheck } from 'lucide-react'

const DOCS = [
  { id: 'kimlikOn', label: 'TC Kimlik Ön Yüz', desc: 'Kimliğinizin ön yüzünün fotoğrafı', icon: CreditCard, color: 'blue', required: true },
  { id: 'kimlikArka', label: 'TC Kimlik Arka Yüz', desc: 'Kimliğinizin arka yüzünün fotoğrafı', icon: CreditCard, color: 'blue', required: true },
  { id: 'ikametgah', label: 'İkametgah / Sicil Kaydı', desc: 'E-devlet veya belediyeden alınan adres belgesi', icon: MapPin, color: 'violet', required: true },
]

const COLORS = {
  blue: { card: 'border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-500/10', icon: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  violet: { card: 'border-violet-300 dark:border-violet-700 bg-violet-50/80 dark:bg-violet-500/10', icon: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400' },
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

export default function CustomerRegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [docs, setDocs] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const allRequired = DOCS.filter(d => d.required).every(d => docs[d.id])
  const count = DOCS.filter(d => d.required && docs[d.id]).length
  const total = DOCS.filter(d => d.required).length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allRequired) { setError('Tüm zorunlu belgeleri yükleyin'); return }
    setLoading(true)
    setError('')
    try {
      for (const d of DOCS) {
        const file = docs[d.id]
        if (!file) continue
        const up = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, file, 'photo')
        const url = up?.data?.url || up?.url
        if (url) {
          await fetchAPI(API_ENDPOINTS.CERTIFICATES.UPLOAD, {
            method: 'POST',
            body: { fileUrl: url, type: d.id, label: d.label },
          })
        }
      }
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Belge yükleme hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => navigate('/home')

  if (!user) return null

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[#0d0d0d] dark:via-[#111111] dark:to-[#0d0d0d]">
      {/* Decorative */}
      <div className="absolute top-[-100px] right-[-60px] w-[280px] h-[280px] rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-[-80px] left-[-40px] w-[220px] h-[220px] rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative pt-6 pb-8 px-5">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur flex items-center justify-center border border-slate-200/60 dark:border-white/10 shadow-sm mb-6"
        >
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white">Hesap Doğrulama</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Kimlik ve ikametgah belgelerinizi yükleyin</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-5 pb-10">
        <div className="bg-white dark:bg-[#141414] rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-black/30 border border-slate-200/60 dark:border-white/[0.06] p-6">

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 mb-5 flex gap-3">
            <AlertCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Zorunlu Belgeler</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5 leading-relaxed">
                Güvenliğiniz için kimlik ve adres belgelerinizi yüklemeniz gerekmektedir. PDF, JPG veya PNG kabul edilir.
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">İlerleme</span>
              <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400">{count}/{total}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </div>

          {/* Documents */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {DOCS.map(d => (
              <DocCard
                key={d.id}
                field={d}
                file={docs[d.id] || null}
                onChange={file => setDocs(p => ({ ...p, [d.id]: file }))}
              />
            ))}

            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl px-4 py-3">
                <p className="text-rose-600 dark:text-rose-400 text-sm font-medium text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allRequired}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 mt-2"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Yükleniyor...</span>
                : 'Kaydet ve Devam Et'
              }
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-3 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Şimdilik Atla →
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
