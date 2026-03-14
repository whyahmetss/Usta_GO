import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { Camera, Sparkles, MapPin, ChevronRight, Check } from 'lucide-react'
import { emitEvent } from '../utils/socket'
import MapPickerModal from '../components/MapPickerModal'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function CreateJobPage() {
  const { user, createJob } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]               = useState(1)
  const [description, setDescription] = useState('')
  const [photo, setPhoto]             = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [aiResult, setAiResult]       = useState(null)
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

  const estimatedPrice = aiResult?.estimatedPrice || 0
  const finalPrice     = Math.max(0, estimatedPrice - (selectedCoupon?.amount || 0))

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

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
        setAnalyzeError(`AI hatası (fallback kullanıldı): ${res.data.aiError}`)
      }
      setStep(3)
    } catch (err) {
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
        } catch { /* continue without photo */ }
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

  const stepLabels = ['Bilgiler', 'Analiz', 'Onay']

  return (
    <div>
      <PageHeader title="Yeni İş Talebi" />

      {/* Progress Steps */}
      <div className="px-6 py-4 max-w-lg mx-auto">
        <div className="flex items-center">
          {[1, 2, 3].map((num, idx) => (
            <div key={num} className={`flex items-center ${idx < 2 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step > num ? 'bg-accent-500 text-white' :
                  step === num ? 'bg-primary-500 text-white' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  {step > num ? <Check size={16} /> : num}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                  step === num ? 'text-primary-500' : 'text-gray-400'
                }`}>{stepLabels[idx]}</span>
              </div>
              {idx < 2 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-colors ${step > num ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-10 max-w-lg mx-auto">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            {analyzeError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
                {analyzeError}
              </div>
            )}

            <Card>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Fotoğraf <span className="text-gray-400 font-normal">(opsiyonel)</span></h3>
              <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer block mt-3">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Önizleme" className="w-full h-44 object-cover rounded-xl" />
                    <div className="absolute top-2 right-2 bg-primary-500 text-white p-2 rounded-xl shadow-sm">
                      <Camera size={16} />
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary-300 transition-colors">
                    <Camera size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm font-medium">Sorunu fotoğraflayın</p>
                  </div>
                )}
              </label>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Sorunu Açıklayın <span className="text-rose-500">*</span></h3>
              <p className="text-xs text-gray-400 mb-3">AI bu açıklamayı analiz ederek tahmini fiyat sunacak.</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none resize-none text-sm"
                rows={4}
                placeholder="Örn: Mutfak prizinden duman çıkıyor, hiçbir priz çalışmıyor..."
              />
              <p className="text-right text-xs text-gray-300 mt-1">{description.length}/500</p>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-1.5">
                <MapPin size={16} className="text-primary-500" />Tam Adres <span className="text-rose-500">*</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition ${
                  address ? 'bg-accent-50 border-accent-200' : 'bg-gray-50 border-gray-200 border-dashed'
                }`}
              >
                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${address ? 'bg-accent-500' : 'bg-gray-200'}`}>
                  <MapPin size={16} className={address ? 'text-white' : 'text-gray-400'} />
                </div>
                <span className={`flex-1 text-sm leading-snug line-clamp-2 ${address ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                  {address || 'Haritadan konum seçin...'}
                </span>
                <ChevronRight size={16} className="shrink-0 text-gray-300" />
              </button>
            </Card>

            <button
              onClick={handleAIAnalysis}
              disabled={!description.trim() || !address.trim()}
              className={`w-full py-4 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                !description.trim() || !address.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 hover:bg-primary-600 active:scale-[0.98] shadow-card'
              }`}
            >
              <Sparkles size={18} /> Analiz Et ve Devam Et
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Card className="text-center !py-16">
            <div className="w-14 h-14 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI Analiz Ediyor...</h3>
            <p className="text-sm text-gray-400">Sorun sınıflandırılıyor ve fiyat hesaplanıyor</p>
          </Card>
        )}

        {/* STEP 3 */}
        {step === 3 && aiResult && (
          <div className="space-y-4">
            {analyzeError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-700 text-sm">
                {analyzeError}
              </div>
            )}

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">AI Değerlendirmesi</h3>
              <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                <p>{aiResult.customerMessage?.giris}</p>
                <p>{aiResult.customerMessage?.gelisme}</p>
                <p className="text-gray-400 italic">{aiResult.customerMessage?.sonuc}</p>
              </div>
            </Card>

            <Card className="!bg-gradient-to-br from-primary-500 to-accent-500 !border-0 text-white text-center" padding="p-6">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Tahmini Ücret</p>
              <p className="text-4xl font-bold mb-1">{finalPrice} TL</p>
              {selectedCoupon && (
                <p className="text-white/60 text-xs mb-3">({estimatedPrice} TL - {selectedCoupon.amount} TL kupon)</p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-left">
                  <p className="text-white/60 text-[10px] mb-0.5">Hizmet</p>
                  <p className="font-semibold text-sm">{aiResult.primaryLabel}</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-left">
                  <p className="text-white/60 text-[10px] mb-0.5">Aciliyet</p>
                  <p className="font-semibold text-sm">{aiResult.urgency}</p>
                </div>
              </div>
              {aiResult.priceBreakdown && (
                <div className="mt-3 text-left bg-white/10 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/60">Temel fiyat</span>
                    <span>{aiResult.priceBreakdown.basePrice} TL</span>
                  </div>
                  {aiResult.priceBreakdown.nightMultiplier > 1 && (
                    <div className="flex justify-between text-amber-200">
                      <span>Gece çarpanı</span>
                      <span>x{aiResult.priceBreakdown.nightMultiplier}</span>
                    </div>
                  )}
                  {aiResult.priceBreakdown.urgencyMultiplier > 1 && (
                    <div className="flex justify-between text-rose-200">
                      <span>Acil çarpanı</span>
                      <span>x{aiResult.priceBreakdown.urgencyMultiplier}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/50">
                    <span>Bölge çarpanı</span>
                    <span>x{aiResult.priceBreakdown.regionMultiplier}</span>
                  </div>
                </div>
              )}
            </Card>

            {activeCoupons.length > 0 && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Kupon Kullan</h3>
                <div className="space-y-2">
                  {activeCoupons.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition ${
                        selectedCoupon?.id === c.id
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{c.code}</p>
                          <p className="text-xs text-gray-400">{c.amount} TL indirim</p>
                        </div>
                        <p className="text-lg font-bold text-amber-600">-{c.amount} TL</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {(() => {
              const userBalance = aiResult?.userBalance ?? 0
              const insufficient = userBalance < finalPrice
              return (
                <>
                  <div className={`rounded-2xl p-4 border ${insufficient ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className={insufficient ? 'text-rose-600' : 'text-emerald-600'}>Cüzdan Bakiyeniz</span>
                      <span className={`font-bold text-base ${insufficient ? 'text-rose-600' : 'text-emerald-600'}`}>{userBalance} TL</span>
                    </div>
                    {insufficient && (
                      <p className="text-rose-500 text-xs mt-1">
                        Bu işi açmak için {finalPrice - userBalance} TL daha bakiye yüklemeniz gerekiyor.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => { setStep(1); setAiResult(null) }}
                      disabled={isCreating}
                      className="py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-semibold hover:bg-gray-200 transition text-sm"
                    >
                      Geri Dön
                    </button>
                    <button
                      onClick={handleCreateJob}
                      disabled={isCreating || insufficient}
                      className={`py-3.5 rounded-2xl font-semibold transition text-sm ${
                        isCreating || insufficient ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]'
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
