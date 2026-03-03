import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Camera, Sparkles, MapPin, ChevronRight, Info } from 'lucide-react'
import { emitEvent } from '../utils/socket'
import MapPickerModal from '../components/MapPickerModal'

function CreateJobPage() {
  const { user, createJob } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]               = useState(1)
  const [description, setDescription] = useState('')
  const [photo, setPhoto]             = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [aiResult, setAiResult]       = useState(null)   // Gemini analiz sonucu
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)
  const [address, setAddress]         = useState('')
  const [lat, setLat]                 = useState(null)
  const [lng, setLng]                 = useState(null)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [activeCoupons, setActiveCoupons]   = useState([])
  const [isCreating, setIsCreating]   = useState(false)
  const [error, setError]             = useState(null)

  // Fiyat hesapla (kupon düşür)
  const estimatedPrice = aiResult?.estimatedPrice || 0
  const finalPrice     = Math.max(0, estimatedPrice - (selectedCoupon?.amount || 0))

  // Fotoğraf
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  // ── Gerçek AI Analizi ──────────────────────────────────────────────
  const handleAIAnalysis = async () => {
    if (!description.trim() || !address.trim()) {
      alert('Lütfen hem sorunu açıklayın hem de adresinizi girin.')
      return
    }
    setIsAnalyzing(true)
    setAnalyzeError(null)
    setStep(2)

    try {
      const res = await fetchAPI(API_ENDPOINTS.AI.ANALYZE, {
        method: 'POST',
        body: { description: description.trim(), address: address.trim() },
      })
      setAiResult(res.data)
      if (res.data?.aiError) {
        console.warn('[AI] DeepSeek çalışmadı, fallback kullanıldı:', res.data.aiError)
        setAnalyzeError(`⚠️ AI hatası (fallback kullanıldı): ${res.data.aiError}`)
      }
      setStep(3)
    } catch (err) {
      console.error('AI analiz hatası:', err)
      // Yetersiz açıklama → step 1'de kal, kullanıcıya daha detaylı yaz
      const serverMsg = err.response?.data?.message || err.response?.data?.error
      if (err.response?.data?.needsMoreDetail) {
        setAnalyzeError(serverMsg)
      } else {
        setAnalyzeError(serverMsg || err.message || 'Analiz başarısız. Lütfen tekrar deneyin.')
      }
      setStep(1)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Kuponları yükle
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
      } catch { /* sessiz */ }
    }
    loadCoupons()
  }, [user])

  // ── İş Oluştur ────────────────────────────────────────────────────
  const handleCreateJob = async () => {
    if (isCreating) return
    if (!description.trim() || !address.trim()) {
      alert('Lütfen eksik alanları doldurun.')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      let photoUrl = null
      if (photo) {
        try {
          const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadResponse?.data?.url || uploadResponse?.url || null
        } catch { /* fotoğrafsız devam */ }
      }

      const jobData = {
        title:       aiResult?.primaryLabel || 'Genel Tamir',
        description: description.trim(),
        price:       finalPrice,
        address:     address.trim(),
        ...(lat && lng ? { lat, lng } : {}),
        category:    aiResult?.category || 'GENERAL',
        urgent:      aiResult?.isUrgent || false,
        status:      'pending',
        photos:      photoUrl ? [photoUrl] : [],
      }

      const result = await createJob(jobData)
      if (result) {
        emitEvent('new_job', { id: result.id })
        alert('İş talebi başarıyla oluşturuldu!')
        navigate('/my-jobs')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Hata oluştu.'
      setError(msg)
      alert(`Hata: ${msg}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-black text-white">Yeni İş Talebi</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= num ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>{num}</div>
              {num < 3 && <div className={`w-12 h-1 mx-2 ${step > num ? 'bg-white' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {/* ── ADIM 1: BİLGİ GİRİŞİ ── */}
        {step === 1 && (
          <div className="space-y-4">
            {analyzeError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
                {analyzeError}
              </div>
            )}

            {/* Fotoğraf */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3 text-gray-900">Fotoğraf Ekle <span className="text-gray-400 font-normal text-sm">(zorunlu değil)</span></h3>
              <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer block">
                {photoPreview ? (
                  <div className="relative w-full">
                    <img src={photoPreview} alt="Önizleme" className="w-full h-48 object-cover rounded-xl border-2 border-blue-500" />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg"><Camera size={18} /></div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-blue-500 transition">
                    <Camera size={40} className="text-gray-400" />
                    <p className="text-gray-500 font-medium">Sorunu fotoğrafla</p>
                  </div>
                )}
              </label>
            </div>

            {/* Sorun açıklaması */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-1 text-gray-900">Sorunu Açıklayın <span className="text-red-500">*</span></h3>
              <p className="text-xs text-gray-400 mb-3">AI bu açıklamayı analiz ederek size tahmini fiyat sunacak.</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                rows={4}
                placeholder="Örn: Mutfak prizinden duman çıkıyor, hiçbir priz çalışmıyor..."
              />
              <p className="text-right text-xs text-gray-400 mt-1">{description.length}/500</p>
            </div>

            {/* Adres */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3 text-gray-900">
                <MapPin size={18} className="inline mr-1" />Tam Adres <span className="text-red-500">*</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition ${
                  address ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 border-dashed'
                }`}
              >
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${address ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <MapPin size={15} className={address ? 'text-white' : 'text-gray-400'} />
                </div>
                <span className={`flex-1 text-sm leading-snug line-clamp-2 ${address ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                  {address || 'Haritadan konum seçin…'}
                </span>
                <ChevronRight size={18} className="shrink-0 text-gray-400" />
              </button>
            </div>

            <button
              onClick={handleAIAnalysis}
              disabled={!description.trim() || !address.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all ${
                !description.trim() || !address.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
              }`}
            >
              <Sparkles size={20} className="inline mr-2" /> Analiz Et ve Devam Et
            </button>
          </div>
        )}

        {/* ── ADIM 2: ANALİZ ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">AI Analiz Ediyor...</h3>
            <p className="text-gray-400 text-sm">Sorun sınıflandırılıyor ve fiyat hesaplanıyor</p>
          </div>
        )}

        {/* ── ADIM 3: SONUÇ + ONAY ── */}
        {step === 3 && aiResult && (
          <div className="space-y-4">
            {/* AI Hata Uyarısı */}
            {analyzeError && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4">
                <p className="text-yellow-800 text-sm font-medium">{analyzeError}</p>
              </div>
            )}
            {/* Müşteri Mesajı */}
            <div className="bg-white rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="font-bold text-gray-900">🤖 AI Değerlendirmesi</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{aiResult.customerMessage?.giris}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{aiResult.customerMessage?.gelisme}</p>
              <p className="text-sm text-gray-500 italic">{aiResult.customerMessage?.sonuc}</p>
            </div>

            {/* Fiyat Detayı */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl text-white text-center">
              <p className="text-white/70 text-sm font-bold uppercase tracking-wider mb-2">Tahmini Ücret</p>
              <p className="text-6xl font-black mb-1">{finalPrice} TL</p>
              {selectedCoupon && (
                <p className="text-white/70 text-sm mb-4">({estimatedPrice} TL - {selectedCoupon.amount} TL kupon)</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-left mt-4">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/20">
                  <p className="text-white/60 text-xs mb-1">Hizmet</p>
                  <p className="font-bold text-sm">{aiResult.primaryLabel}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/20">
                  <p className="text-white/60 text-xs mb-1">Aciliyet</p>
                  <p className="font-bold text-sm">{aiResult.urgency}</p>
                </div>
              </div>
              {/* Fiyat kırılımı */}
              {aiResult.priceBreakdown && (
                <div className="mt-4 text-left bg-white/10 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/70">Temel fiyat ({aiResult.primaryLabel})</span>
                    <span>{aiResult.priceBreakdown.basePrice} TL</span>
                  </div>
                  {aiResult.priceBreakdown.nightMultiplier > 1 && (
                    <div className="flex justify-between text-yellow-300">
                      <span>Gece çarpanı</span>
                      <span>×{aiResult.priceBreakdown.nightMultiplier}</span>
                    </div>
                  )}
                  {aiResult.priceBreakdown.urgencyMultiplier > 1 && (
                    <div className="flex justify-between text-orange-300">
                      <span>Acil çarpanı</span>
                      <span>×{aiResult.priceBreakdown.urgencyMultiplier}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/60">
                    <span>Bölge çarpanı</span>
                    <span>×{aiResult.priceBreakdown.regionMultiplier}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Kupon */}
            {activeCoupons.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-yellow-200">
                <h3 className="font-bold text-gray-900 mb-3">🎟️ Kupon Kullan</h3>
                <div className="space-y-2">
                  {activeCoupons.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition ${
                        selectedCoupon?.id === c.id
                          ? 'bg-yellow-50 border-yellow-500 shadow-md'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-black text-gray-900">{c.code}</p>
                          <p className="text-xs text-gray-500">{c.amount} TL indirim</p>
                        </div>
                        <p className="text-xl font-black text-yellow-600">-{c.amount} TL</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bakiye kontrolü */}
            {(() => {
              const userBalance = aiResult?.userBalance ?? 0
              const insufficient = userBalance < finalPrice
              return (
                <>
                  <div className={`rounded-2xl p-4 border ${insufficient ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className={insufficient ? 'text-red-700' : 'text-green-700'}>Cüzdan Bakiyeniz</span>
                      <span className={`font-black text-base ${insufficient ? 'text-red-700' : 'text-green-700'}`}>{userBalance} TL</span>
                    </div>
                    {insufficient && (
                      <p className="text-red-600 text-xs mt-1">
                        Bu işi açmak için {finalPrice - userBalance} TL daha bakiye yüklemeniz gerekiyor.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => { setStep(1); setAiResult(null) }}
                      disabled={isCreating}
                      className="py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-300 transition"
                    >
                      Geri Dön
                    </button>
                    <button
                      onClick={handleCreateJob}
                      disabled={isCreating || insufficient}
                      className={`py-4 rounded-2xl font-bold shadow-lg transition ${
                        isCreating || insufficient ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isCreating ? 'Oluşturuluyor...' : 'Onayla ve Gönder'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      <MapPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={({ lat: pickedLat, lng: pickedLng, address: pickedAddress }) => {
          setAddress(pickedAddress)
          setLat(pickedLat)
          setLng(pickedLng)
        }}
        initialLat={lat}
        initialLng={lng}
        initialAddress={address}
      />
    </div>
  )
}

export default CreateJobPage
