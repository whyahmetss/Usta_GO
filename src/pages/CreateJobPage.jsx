import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Camera, Sparkles, MapPin } from 'lucide-react'

function CreateJobPage() {
  const { user, createJob } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [aiPrice, setAiPrice] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [address, setAddress] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [activeCoupons, setActiveCoupons] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  // Get region multiplier from address
  const getRegionMultiplier = (addr) => {
    if (!addr) return 1.0
    const premiumZones = ['Kadikoy', 'Besiktas', 'Nisantasi']
    const economyZones = ['Esenyurt', 'Sultanbeyli']

    const upperAddr = addr.toUpperCase()
    if (premiumZones.some(zone => upperAddr.includes(zone.toUpperCase()))) {
      return 1.3
    }
    if (economyZones.some(zone => upperAddr.includes(zone.toUpperCase()))) {
      return 1.0
    }
    return 1.15 // Default for other zones
  }

  const regionMultiplier = getRegionMultiplier(address)
  const finalPrice = aiPrice ? Math.round(aiPrice * regionMultiplier) : 0

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAIAnalysis = async () => {
    if (!description.trim()) {
      alert('Lutfen problemi aciklayin')
      return
    }

    setIsAnalyzing(true)
    setStep(2)

    setTimeout(() => {
      let estimatedPrice = 150
      let category = 'Genel Elektrik'

      const desc = description.toLowerCase()

      if (desc.includes('priz') || desc.includes('sigorta')) {
        estimatedPrice = 120
        category = 'Priz/Sigorta'
      } else if (desc.includes('avize') || desc.includes('lamba')) {
        estimatedPrice = 200
        category = 'Aydinlatma'
      } else if (desc.includes('kivilcim') || desc.includes('yangin') || desc.includes('tehlike')) {
        estimatedPrice = 350
        category = 'Acil Ariza'
      } else if (desc.includes('kablo') || desc.includes('tesisat')) {
        estimatedPrice = 400
        category = 'Tesisat'
      }

      if (photo) {
        estimatedPrice += 50
      }

      setAiPrice(estimatedPrice)
      setAiAnalysis({
        category,
        urgency: desc.includes('acil') || desc.includes('tehlike') ? 'Yuksek' : 'Normal',
        estimatedDuration: estimatedPrice > 300 ? '2-3 saat' : '1-2 saat'
      })
      setIsAnalyzing(false)
      setStep(3)
    }, 2000)
  }

  useEffect(() => {
    // Load active coupons from API on component mount
    const loadCoupons = async () => {
      try {
        const response = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (response.data?.coupons) {
          const unused = response.data.coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
          setActiveCoupons(unused)
        }
      } catch (err) {
        console.warn('Failed to load coupons:', err)
      }
    }
    loadCoupons()
  }, [user])

  const handleLoadCoupons = () => {
    // Auto-load coupons when opening the coupon section
    const unused = activeCoupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
    setActiveCoupons(unused)
  }

 const handleCreateJob = async () => {
    if (isCreating) return

    setError(null)
    setIsCreating(true)

    try {
      // 1. Fiyat ve Bölge Çarpanı Hesabı
      let finalJobPrice = aiPrice
      const regionMultiplier = getRegionMultiplier(address)
      finalJobPrice = Math.round(finalJobPrice * regionMultiplier)

      let couponDiscount = 0
      let photoUrl = null

      // 2. Kupon İndirimi Uygulama
      if (selectedCoupon) {
        couponDiscount = selectedCoupon.amount
        finalJobPrice = Math.max(0, finalJobPrice - couponDiscount)
      }

      // 3. Fotoğraf Yükleme (Hata alsa bile devam eder)
      if (photo) {
        try {
          const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadResponse.data?.url || photoPreview
        } catch (err) {
          console.warn('Fotoğraf yüklenemedi, önizleme kullanılıyor:', err)
          photoUrl = photoPreview
        }
      }

      // 4. KRİTİK DÜZELTME: Backend'in tam istediği format
      const jobData = {
        title: aiAnalysis.category,
        description: description,
        budget: Number(finalJobPrice), // "price" yerine "budget" ve sayı formatı
        location: address || 'Kadikoy, Istanbul', // Obje yerine düz metin (string)
        photo: photoUrl,
        urgent: aiAnalysis.urgency === 'Yuksek',
        category: 'electric'
      }

      // 5. API Çağrısı
      const result = await createJob(jobData)

      if (result) {
        alert('Is talebi olusturuldu! Ustalar yakinda teklif verecek.')
        navigate('/my-jobs')
      }
    } catch (err) {
      const errorMessage = err.message || 'Is olusturulurken hata olustu'
      setError(errorMessage)
      console.error('Create job error:', err)
      alert(`Hata: ${errorMessage}`)
    } finally {
      setIsCreating(false)
    }
  }
      // Apply coupon discount if selected
      let couponDiscount = 0
      let photoUrl = null

      if (selectedCoupon) {
        couponDiscount = selectedCoupon.amount
        finalJobPrice = Math.max(0, finalJobPrice - couponDiscount)
      }

      // Upload photo if selected
      if (photo) {
        try {
          const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadResponse.data?.url || photoPreview
        } catch (err) {
          console.warn('Photo upload failed, using preview:', err)
          photoUrl = photoPreview
        }
      }

  // HATALARI BURADA DÜZELTTİK:
      const jobData = {
        title: aiAnalysis.category,
        description: description,
        // 1. DÜZELTME: Backend "budget" bekliyor (Validation Error'daki path: budget)
        budget: Number(finalJobPrice), 
        // 2. DÜZELTME: Backend "location" için sadece string bekliyor (Expected string, received object)
        location: address || 'Kadikoy, Istanbul', 
        photo: photoUrl,
        urgent: aiAnalysis.urgency === 'Yuksek',
        category: 'electric'
      }

      const result = await createJob(jobData)

      if (result) {
        alert('Is talebi olusturuldu!')
        navigate('/my-jobs')
      }
    } catch (err) {
      const errorMessage = err.message || 'Is olusturulurken hata olustu'
      setError(errorMessage)
      alert(`Hata: ${errorMessage}`)
    } finally {
      setIsCreating(false)
    }
  }
      // Create job via API
      const result = await createJob(jobData)

      if (result) {
        alert('Is talebi olusturuldu! Ustalar yakinda teklif verecek.')
        navigate('/my-jobs')
      }
    } catch (err) {
      const errorMessage = err.message || 'Is olusturulurken hata olustu'
      setError(errorMessage)
      console.error('Create job error:', err)
      alert(`Hata: ${errorMessage}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Yeni Is Talebi</h1>
            <p className="text-white/80 text-sm">Elektrik hizmeti</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            step >= 1 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
          }`}>1</div>
          <div className={`w-12 h-1 ${step >= 2 ? 'bg-white' : 'bg-white/20'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            step >= 2 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
          }`}>2</div>
          <div className={`w-12 h-1 ${step >= 3 ? 'bg-white' : 'bg-white/20'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            step >= 3 ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
          }`}>3</div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Step 1: Problem */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">Sorunu Aciklayin</h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Orn: Salon prizlerinde kivilcim cikiyor, kontrol edilmesi gerekiyor..."
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={6}
              />
            </div>

            {/* Adres */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">
                <MapPin size={18} className="inline mr-1" />
                Adres
              </h3>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Orn: Kadikoy, Istanbul"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fotograf Ekleme */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">Fotograf Ekle (Opsiyonel)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Fotograf eklemek fiyat tahmininin daha dogru olmasini saglar
              </p>

              {!photoPreview ? (
                <label className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">
                  <Camera size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Fotograf Cek veya Sec</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img src={photoPreview} alt="Problem" className="w-full h-48 object-cover rounded-xl" />
                  <button
                    onClick={() => {
                      setPhoto(null)
                      setPhotoPreview(null)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    X
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleAIAnalysis}
              disabled={!description.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 ${
                !description.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
              }`}
            >
              <Sparkles size={20} />
              AI ile Fiyat Hesapla
            </button>
          </div>
        )}

        {/* Step 2: AI Analyzing */}
        {step === 2 && isAnalyzing && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Analiz Ediyor...</h3>
            <p className="text-gray-600">Probleminiz degerlendiriliyor ve fiyat hesaplaniyor</p>
          </div>
        )}

        {/* Step 3: Result & Confirm */}
        {step === 3 && aiPrice && (
          <div className="space-y-4">
            {/* Coupon Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
              <h3 className="font-bold text-gray-900 mb-4">🎟️ Kupon Kullan</h3>
              {activeCoupons.length === 0 ? (
                <>
                  <p className="text-gray-600 text-sm mb-3">Aktif kuponunuz yok</p>
                  <button
                    onClick={handleLoadCoupons}
                    className="w-full py-2 bg-yellow-100 text-yellow-700 rounded-lg font-bold hover:bg-yellow-200 transition text-sm"
                  >
                    Kuponları Yükle
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  {activeCoupons.map((coupon) => (
                    <button
                      key={coupon.id}
                      onClick={() => setSelectedCoupon(selectedCoupon?.id === coupon.id ? null : coupon)}
                      className={`w-full p-3 rounded-lg border-2 transition text-left ${
                        selectedCoupon?.id === coupon.id
                          ? 'bg-yellow-50 border-yellow-500 shadow-md'
                          : 'bg-gray-50 border-gray-200 hover:border-yellow-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{coupon.code}</p>
                          <p className="text-sm text-gray-600">+{coupon.amount} TL indirim</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-yellow-600">+{coupon.amount} TL</p>
                          <p className="text-xs text-gray-500">
                            {new Date(coupon.expiresAt).toLocaleDateString('tr-TR')} kadar
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={24} />
                <h3 className="text-xl font-bold">AI Analiz Sonucu</h3>
              </div>

              <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4">
                <div className="text-center">
                  <p className="text-white/80 text-sm mb-1">Tahmini Ucret</p>
                  <p className="text-5xl font-black">{finalPrice - (selectedCoupon?.amount || 0)} TL</p>
                  {selectedCoupon && (
                    <p className="text-yellow-200 text-sm mt-2">
                      -{selectedCoupon.amount} TL kupon indirimi ✓
                    </p>
                  )}
                  {regionMultiplier !== 1.0 && (
                    <p className="text-white/80 text-xs mt-2">
                      Temel fiyat: {aiPrice} TL ({regionMultiplier === 1.3 ? 'Premium Bölge +30%' : regionMultiplier === 1.0 ? 'Ekonomi Bölge' : 'Standart +15%'})
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                  <p className="text-white/80 mb-1">Kategori</p>
                  <p className="font-bold">{aiAnalysis.category}</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                  <p className="text-white/80 mb-1">Aciliyet</p>
                  <p className="font-bold">{aiAnalysis.urgency}</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-3 col-span-2">
                  <p className="text-white/80 mb-1">Tahmini Sure</p>
                  <p className="font-bold">{aiAnalysis.estimatedDuration}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">Problem Detayi</h3>
              <p className="text-gray-700 mb-2">{description}</p>
              {address && (
                <p className="text-sm text-gray-500 mb-4">
                  <MapPin size={14} className="inline mr-1" />
                  {address}
                </p>
              )}
              {photoPreview && (
                <img src={photoPreview} alt="Problem" className="w-full h-48 object-cover rounded-xl" />
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm text-blue-900">
                Bu fiyat AI tarafindan hesaplanmis bir tahmindir. Ustalar teklif verdiginde kesinlesecektir.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={isCreating}
                className="py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Duzenle
              </button>
              <button
                onClick={handleCreateJob}
                disabled={isCreating}
                className={`py-4 rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center gap-2 ${
                  isCreating
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                }`}
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Gonderiliyor...
                  </>
                ) : (
                  'Onayla & Gonder'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
