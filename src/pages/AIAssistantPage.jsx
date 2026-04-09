import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { Camera, Sparkles, MapPin, Mic, ArrowRight, MessageSquare, Send, Image, ArrowLeft, Check, X } from 'lucide-react'
import { emitEvent } from '../utils/socket'
import MapPickerModal from '../components/MapPickerModal'

const ISTANBUL_KEYWORDS = ['istanbul', 'İstanbul', 'ıstanbul', 'besiktas', 'beşiktaş', 'kadıköy', 'kadikoy',
  'şişli', 'sisli', 'üsküdar', 'uskudar', 'fatih', 'beyoglu', 'beyoğlu', 'bakırköy', 'bakirkoy',
  'maltepe', 'ataşehir', 'atasehir', 'pendik', 'kartal', 'tuzla', 'ümraniye', 'umraniye',
  'sancaktepe', 'sultanbeyli', 'çekmeköy', 'cekmekoy', 'şile', 'sile', 'beykoz', 'eyüp', 'eyup',
  'gaziosmanpaşa', 'gaziosmanpasa', 'bağcılar', 'bagcilar', 'bahçelievler', 'bahcelievler',
  'güngören', 'gungoren', 'esenler', 'sultangazi', 'arnavutköy', 'arnavutkoy', 'başakşehir',
  'basaksehir', 'avcılar', 'avcilar', 'büyükçekmece', 'buyukcekmece', 'esenyurt', 'beylikdüzü',
  'beylikduzu', 'küçükçekmece', 'kucukcekmece', 'silivri', 'çatalca', 'catalca', 'adalar',
  'sarıyer', 'sariyer', 'zeytinburnu', 'bayrampaşa', 'bayrampasa', 'kağıthane', 'kagithane',
  'levent', 'maslak', 'taksim', 'boğaziçi', 'bogazici']

function isIstanbul(addr) {
  const lower = addr.toLowerCase()
  return ISTANBUL_KEYWORDS.some(k => lower.includes(k.toLowerCase()))
}

// Phases: intro → chat → address → price → creating → done
export default function AIAssistantPage() {
  const { user, createJob } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('intro')
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [listening, setListening] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [activeCoupons, setActiveCoupons] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [description, setDescription] = useState('')

  const chatEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  const estimatedPrice = aiResult?.estimatedPrice || 0
  const finalPrice = Math.max(0, estimatedPrice - (selectedCoupon?.amount || 0))

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const response = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (response.data?.coupons) {
          const unused = response.data.coupons.filter(
            c => !c.used && new Date(c.expiresAt) > new Date()
          )
          setActiveCoupons(unused)
        }
      } catch { /* silent */ }
    }
    loadCoupons()
  }, [user])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, phase])

  const addMessage = (role, content, extra = {}) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, content, ...extra }])
  }

  const startChat = (mode) => {
    setPhase('chat')
    addMessage('ai', 'Merhaba! 👋 Ben UstaGo AI Asistan. Sorununuzu anlayıp anında fiyat hesaplıyorum.')

    if (mode === 'camera') {
      addMessage('ai', '📸 Arızanın fotoğrafını çekin, ben analiz edeyim.')
      setTimeout(() => fileInputRef.current?.click(), 300)
    } else if (mode === 'voice') {
      addMessage('ai', '🎙️ Dinliyorum... Sorununuzu sesli anlatın.')
      setTimeout(() => startVoice(), 300)
    } else {
      addMessage('ai', 'Sorununuzu yazın veya fotoğraf gönderin. Ne kadar detay verirseniz, o kadar doğru fiyat hesaplarım.')
    }
  }

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      addMessage('ai', 'Tarayıcınız sesli girişi desteklemiyor. Lütfen yazarak anlatın.')
      return
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'tr-TR'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition
    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      setInputText(text)
      // Auto-send
      handleSendMessage(text)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
      addMessage('user', '📷 Fotoğraf gönderildi', { image: reader.result })
      addMessage('ai', 'Fotoğrafı aldım! Şimdi sorunu birkaç cümleyle anlatır mısınız? (Örn: "Mutfak musluğu damlatıyor")')
    }
    reader.readAsDataURL(file)
  }

  const handleSendMessage = (overrideText) => {
    const text = (overrideText || inputText).trim()
    if (!text) return
    setInputText('')
    addMessage('user', text)
    setDescription(prev => prev ? prev + '. ' + text : text)

    // Check if we have enough info to ask for address
    const totalDesc = description ? description + '. ' + text : text
    if (totalDesc.length >= 10 && !address) {
      setTimeout(() => {
        addMessage('ai', 'Anladım! Şimdi hizmet adresinizi seçmeniz gerekiyor. 📍')
        setPhase('address')
      }, 800)
    } else if (totalDesc.length < 10) {
      setTimeout(() => {
        addMessage('ai', 'Biraz daha detay verebilir misiniz? Hangi odada, ne zamandır var, ne tür bir sorun?')
      }, 600)
    }
  }

  const handleAddressConfirm = ({ lat: pickedLat, lng: pickedLng, address: pickedAddress }) => {
    setAddress(pickedAddress)
    setLat(pickedLat)
    setLng(pickedLng)
    setShowMapPicker(false)
    addMessage('user', `📍 ${pickedAddress}`)

    if (!isIstanbul(pickedAddress)) {
      addMessage('ai', '⚠️ Şu an yalnızca İstanbul\'da hizmet veriyoruz. Lütfen İstanbul içinde bir adres seçin.')
      setAddress('')
      setPhase('address')
      return
    }

    addMessage('ai', '🔍 Harika! Şimdi AI analiz yapıyorum...')
    runAnalysis(pickedAddress)
  }

  const runAnalysis = async (addr) => {
    setIsAnalyzing(true)
    setPhase('analyzing')
    try {
      const res = await fetchAPI(API_ENDPOINTS.AI.ANALYZE, {
        method: 'POST',
        body: { description: description.trim(), address: addr.trim() },
      })
      setAiResult(res.data)

      if (res.data?.needsInfo && res.data?.infoQuestion) {
        addMessage('ai', `💡 ${res.data.infoQuestion}\n\nAma devam edebilirsiniz, fiyat kesindir.`)
      }

      setPhase('price')
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message
      addMessage('ai', `❌ Analiz hatası: ${serverMsg || 'Bir sorun oluştu.'}`)
      setPhase('chat')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCreateJob = async () => {
    if (isCreating) return
    setIsCreating(true)
    setPhase('creating')

    try {
      let photoUrl = null
      if (photo) {
        try {
          const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadResponse?.data?.url || uploadResponse?.url || null
        } catch { /* continue without photo */ }
      }

      const jobData = {
        title: aiResult?.primaryLabel || 'Genel Tamir',
        description: description.trim(),
        price: finalPrice,
        address: address.trim(),
        ...(lat && lng ? { lat, lng } : {}),
        category: aiResult?.category || 'GENERAL',
        urgent: aiResult?.isUrgent || false,
        status: 'pending',
        photos: photoUrl ? [photoUrl] : [],
      }

      const result = await createJob(jobData)
      if (result) {
        emitEvent('new_job', { id: result.id })
        setPhase('done')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Hata oluştu.'
      addMessage('ai', `❌ ${msg}`)
      setPhase('price')
    } finally {
      setIsCreating(false)
    }
  }

  // ─── INTRO PHASE ───
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col"
        style={{ background: 'linear-gradient(160deg, #0A66C2 0%, #0D7AE8 40%, #3B9BF5 100%)' }}>
        <div className="flex items-center px-5 pt-[max(env(safe-area-inset-top),12px)] pb-2 mt-2">
          <button onClick={() => navigate(-1)} className="text-white/70 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-white/10 transition flex items-center gap-1">
            <ArrowLeft size={16} /> Geri
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg">
            <Sparkles size={38} className="text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-[28px] font-extrabold text-white leading-tight mb-3">AI Asistan</h1>
          <p className="text-white/70 text-[15px] leading-relaxed max-w-[280px] mb-10">
            Arızanın fotoğrafını çek veya sesli anlat.<br/>AI fiyatı anında hesaplasın.
          </p>

          <div className="w-full max-w-sm space-y-3">
            <button onClick={() => startChat('camera')}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-2xl text-left active:scale-[0.97] transition-all shadow-lg shadow-black/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <Camera size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-[15px]">Fotoğraf Çek</p>
                <p className="text-gray-400 text-[12px]">Arızayı fotoğrafla, AI analiz etsin</p>
              </div>
              <ArrowRight size={18} className="text-gray-300" />
            </button>

            <button onClick={() => startChat('voice')}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white/15 backdrop-blur-sm rounded-2xl text-left active:scale-[0.97] transition-all border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Mic size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-[15px]">Sesli Anlat</p>
                <p className="text-white/50 text-[12px]">Sorunu sesli anlat, AI yazıya çevirsin</p>
              </div>
              <ArrowRight size={18} className="text-white/40" />
            </button>

            <button onClick={() => startChat('text')}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white/10 backdrop-blur-sm rounded-2xl text-left active:scale-[0.97] transition-all border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                <MessageSquare size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-[15px]">Yazarak Anlat</p>
                <p className="text-white/50 text-[12px]">Klasik yöntemle sorunu yaz</p>
              </div>
              <ArrowRight size={18} className="text-white/40" />
            </button>
          </div>
        </div>

        <div className="px-8 pb-[max(env(safe-area-inset-bottom),24px)] text-center">
          <p className="text-white/40 text-[11px]">AI tarafından analiz edilen fiyat kesindir. Usta ekstra ücret talep edemez.</p>
        </div>
      </div>
    )
  }

  // ─── DONE PHASE ───
  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-8"
        style={{ background: 'linear-gradient(160deg, #059669 0%, #10b981 50%, #34d399 100%)' }}>
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <Check size={40} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-[26px] font-extrabold text-white mb-2">İş Talebi Oluşturuldu!</h1>
        <p className="text-white/70 text-[15px] text-center mb-8">Ustalar en kısa sürede teklifinize yanıt verecek.</p>
        <button onClick={() => navigate('/my-jobs')}
          className="px-8 py-4 bg-white text-emerald-700 rounded-2xl font-bold text-[15px] shadow-lg active:scale-[0.97] transition-all">
          İşlerimi Gör
        </button>
      </div>
    )
  }

  // ─── CHAT / ADDRESS / ANALYZING / PRICE PHASES ───
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-[#0d0d0d]">
      {/* Header */}
      <div className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-[#262626] px-4 pt-[max(env(safe-area-inset-top),8px)] pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => phase === 'chat' ? setPhase('intro') : navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1f1f1f] flex items-center justify-center">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0A66C2, #3B9BF5)' }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">AI Asistan</p>
              <p className="text-[10px] text-green-500 font-medium">
                {isAnalyzing ? 'Analiz ediyor...' : phase === 'creating' ? 'İş oluşturuluyor...' : 'Çevrimiçi'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[#0A66C2] text-white rounded-br-md'
                : 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#262626] rounded-bl-md shadow-sm'
            }`}>
              {msg.image && (
                <img src={msg.image} alt="" className="w-full max-w-[200px] rounded-xl mb-2" />
              )}
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Analyzing spinner */}
        {phase === 'analyzing' && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#262626] rounded-2xl rounded-bl-md px-5 py-4 shadow-sm flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">AI analiz yapıyor...</p>
            </div>
          </div>
        )}

        {/* Address prompt */}
        {phase === 'address' && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#262626] rounded-2xl rounded-bl-md px-4 py-4 shadow-sm max-w-[85%]">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Hizmet adresinizi haritadan seçin:</p>
              <button onClick={() => setShowMapPicker(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#0A66C2]/5 border border-[#0A66C2]/20 rounded-xl text-left active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center">
                  <MapPin size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#0A66C2] text-sm">Haritadan Seç</p>
                  <p className="text-gray-400 text-[11px]">Konum seçmek için dokunun</p>
                </div>
                <ArrowRight size={16} className="text-[#0A66C2]/50" />
              </button>
            </div>
          </div>
        )}

        {/* Price card */}
        {phase === 'price' && aiResult && (
          <div className="space-y-3">
            {/* AI evaluation */}
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#262626] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[85%]">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {aiResult.customerMessage?.giris} {aiResult.customerMessage?.gelisme}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="mx-auto max-w-sm">
              <div className="rounded-3xl p-6 text-center text-white shadow-xl"
                style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #0D7AE8 50%, #3B9BF5 100%)' }}>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Toplam İş Ücreti</p>
                <p className="text-5xl font-black mb-1">{finalPrice} TL</p>
                {selectedCoupon && (
                  <p className="text-white/50 text-xs mb-2">{estimatedPrice} TL − {selectedCoupon.amount} TL kupon</p>
                )}

                {aiResult.items && aiResult.items.length > 1 ? (
                  <div className="mt-4 space-y-2">
                    {aiResult.items.map((item, idx) => (
                      <div key={idx} className="bg-white/15 rounded-xl p-3 flex items-center justify-between">
                        <div className="text-left">
                          <p className="font-semibold text-xs">{item.label}{item.count > 1 ? ` ×${item.count}` : ''}</p>
                          <p className="text-white/50 text-[10px]">{item.band === 'HIGH' ? 'Kapsamlı' : item.band === 'LOW' ? 'Basit' : 'Standart'}</p>
                        </div>
                        <p className="font-bold text-sm">{item.itemPrice} TL</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-white/15 rounded-xl p-3 text-left">
                      <p className="text-white/60 text-[10px] mb-0.5">Hizmet</p>
                      <p className="font-semibold text-xs leading-tight">{aiResult.primaryLabel}</p>
                    </div>
                    <div className="bg-white/15 rounded-xl p-3 text-left">
                      <p className="text-white/60 text-[10px] mb-0.5">Kapsam</p>
                      <p className="font-semibold text-xs">{aiResult.band === 'HIGH' ? 'Kapsamlı' : aiResult.band === 'LOW' ? 'Basit' : 'Standart'}</p>
                    </div>
                    <div className="bg-white/15 rounded-xl p-3 text-left">
                      <p className="text-white/60 text-[10px] mb-0.5">Aciliyet</p>
                      <p className="font-semibold text-xs">{aiResult.isUrgent ? 'Acil' : 'Normal'}</p>
                    </div>
                  </div>
                )}

                {aiResult.isUrgent && (
                  <div className="bg-white/15 rounded-xl p-2 mt-2 text-xs font-semibold text-amber-200">⚡ Acil Servis</div>
                )}
                <p className="text-white/50 text-xs mt-4 leading-relaxed">Bu fiyat kesindir. Usta ekstra ücret talep edemez.</p>
              </div>
            </div>

            {/* Coupons */}
            {activeCoupons.length > 0 && (
              <div className="mx-auto max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#262626] p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Kupon Kullan</h4>
                <div className="space-y-2">
                  {activeCoupons.map(c => (
                    <button key={c.id}
                      onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition ${
                        selectedCoupon?.id === c.id
                          ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400'
                          : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-700'
                      }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{c.code}</p>
                          <p className="text-xs text-gray-400">{c.amount} TL indirim</p>
                        </div>
                        <p className="text-lg font-bold text-amber-600">-{c.amount} TL</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Balance + Actions */}
            {(() => {
              const userBalance = aiResult?.userBalance ?? 0
              const insufficient = userBalance < finalPrice
              return (
                <div className="mx-auto max-w-sm space-y-3">
                  <div className={`rounded-2xl p-4 border ${insufficient ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${insufficient ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Hizmet Kredisi Bakiyeniz</span>
                      <span className={`font-bold text-base ${insufficient ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{userBalance.toLocaleString('tr-TR')} TL</span>
                    </div>
                    {insufficient && (
                      <>
                        <p className="text-rose-500 dark:text-rose-400 text-xs mt-1">
                          Bu işi açmak için {(finalPrice - userBalance).toLocaleString('tr-TR')} TL daha bakiye yüklemeniz gerekiyor.
                        </p>
                        <button onClick={() => navigate('/wallet')}
                          className="mt-2 w-full py-2 bg-rose-500 text-white rounded-xl font-semibold text-xs active:scale-[0.98] transition">
                          Hizmet Kredisi Al
                        </button>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setPhase('chat'); setAiResult(null) }}
                      disabled={isCreating}
                      className="py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-semibold text-sm transition hover:bg-gray-200">
                      Geri Dön
                    </button>
                    <button onClick={handleCreateJob}
                      disabled={isCreating || insufficient}
                      className={`py-3.5 rounded-2xl font-semibold text-sm transition ${
                        isCreating || insufficient ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]'
                      }`}>
                      {isCreating ? 'Oluşturuluyor...' : 'Onayla ✓'}
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Creating spinner */}
        {phase === 'creating' && (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-[3px] border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">İş talebi oluşturuluyor...</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar (only in chat phase) */}
      {(phase === 'chat') && (
        <div className="bg-white dark:bg-[#141414] border-t border-gray-200 dark:border-[#262626] px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <div className="flex items-end gap-2">
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" id="photo-upload" />

            <button onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] flex items-center justify-center flex-shrink-0">
              <Image size={18} className="text-gray-500" />
            </button>

            <button onClick={startVoice}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                listening ? 'bg-red-500 animate-pulse' : 'bg-gray-100 dark:bg-[#1f1f1f]'
              }`}>
              <Mic size={18} className={listening ? 'text-white' : 'text-gray-500'} />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Sorununuzu yazın..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30"
              />
            </div>

            <button onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                inputText.trim() ? 'bg-[#0A66C2] active:scale-90' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
              <Send size={18} className={inputText.trim() ? 'text-white' : 'text-gray-400'} />
            </button>
          </div>
        </div>
      )}

      <MapPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleAddressConfirm}
        initialLat={lat}
        initialLng={lng}
        initialAddress={address}
      />
    </div>
  )
}
