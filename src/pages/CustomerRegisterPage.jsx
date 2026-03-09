import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { CreditCard, MapPin, Upload, CheckCircle, ChevronLeft, AlertCircle } from 'lucide-react'

const DOCS = [
  { id: 'kimlikOn', label: 'TC Kimlik Ön Yüz', desc: 'Kimliğinizin ön yüzü', icon: CreditCard, color: 'blue', required: true },
  { id: 'kimlikArka', label: 'TC Kimlik Arka Yüz', desc: 'Kimliğinizin arka yüzü', icon: CreditCard, color: 'blue', required: true },
  { id: 'ikametgah', label: 'İkametgah / Sicil Kaydı', desc: 'E-devlet veya belediyeden alınan adres belgesi', icon: MapPin, color: 'violet', required: true },
]

const COLOR = {
  blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  violet: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
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

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0F172A]">
      <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B]">
        <button onClick={() => navigate('/home')} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#273548] flex items-center justify-center">
          <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">Müşteri Belge Yükleme</h1>
          <p className="text-xs text-gray-500">Kimlik ve ikametgah belgelerinizi yükleyin</p>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-5 flex gap-3">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Zorunlu Belgeler</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">PDF, JPG veya PNG formatında yükleyin.</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] font-semibold text-gray-500">İlerleme</span>
            <span className="text-[11px] font-bold text-primary-500">{count}/{total}</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-[#273548] rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(count/total)*100}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {DOCS.map(d => {
            const Icon = d.icon
            const file = docs[d.id]
            const c = COLOR[d.color] || COLOR.blue
            return (
              <label key={d.id} className="block cursor-pointer">
                <div className={`rounded-2xl border-2 p-4 transition-all ${file ? c : 'border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B]'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${file ? 'bg-primary-500' : 'bg-gray-100 dark:bg-[#273548]'}`}>
                      {file ? <CheckCircle size={18} className="text-white" /> : <Icon size={18} className="text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{d.label} {d.required && '*'}</p>
                      {file ? <p className="text-xs text-primary-600 truncate">{file.name}</p> : <p className="text-[11px] text-gray-400">{d.desc}</p>}
                    </div>
                    <Upload size={16} className="text-gray-400" />
                  </div>
                </div>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e=>setDocs(p=>({...p,[d.id]:e.target.files?.[0]}))} />
              </label>
            )
          })}

          {error && <p className="text-sm text-rose-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !allRequired}
            className="w-full py-4 bg-primary-500 text-white rounded-2xl font-bold disabled:opacity-50"
          >
            {loading ? 'Yükleniyor...' : 'Kaydet ve Devam Et'}
          </button>
        </form>
      </div>
    </div>
  )
}
