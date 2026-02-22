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
  const [localError, setLocalError] = useState(null)

  const getRegionMultiplier = (addr) => {
    if (!addr) return 1.0
    const premiumZones = ['KADIKOY', 'BESIKTAS', 'NISANTASI']
    const upperAddr = addr.toUpperCase()
    if (premiumZones.some(zone => upperAddr.includes(zone))) return 1.3
    return 1.15 
  }

  const regionMultiplier = getRegionMultiplier(address)
  const finalPrice = aiPrice ? Math.round(aiPrice * regionMultiplier) : 0

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleAIAnalysis = async () => {
    if (!description.trim() || !address.trim()) return
    setIsAnalyzing(true)
    setStep(2)
    setTimeout(() => {
      setAiPrice(250)
      setAiAnalysis({ category: 'Elektrik Arıza', urgency: 'Normal' })
      setIsAnalyzing(false)
      setStep(3)
    }, 2000)
  }

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const response = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (response.data?.coupons) {
          const unused = response.data.coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
          setActiveCoupons(unused)
        }
      } catch (err) { console.warn('Kuponlar yüklenemedi') }
    }
    if (user) loadCoupons()
  }, [user])

  const handleCreateJob = async () => {
    if (isCreating) return
    setIsCreating(true)
    setLocalError(null)

    try {
      let photoUrl = ""
      if (photo) {
        try {
          const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadRes?.data?.url || uploadRes?.url || ""
        } catch (e) { console.warn("Fotoğraf yüklenemedi") }
      }

      const calculatedPrice = finalPrice - (selectedCoupon?.amount || 0)

      // API Error'u bitiren veri formatı
      const jobData = {
        title: aiAnalysis?.category || 'Genel Elektrik Arıza',
        description: description.trim(),
        price: Number(calculatedPrice) || 250,
        budget: Number(calculatedPrice) || 250,
        location: { address: address.trim() }, // Admin paneli için obje formatı
        address: address.trim(),               // Bazı backendler için düz metin
        photo: photoUrl,
        category: 'Elektrikci',
        urgency: aiAnalysis?.urgency || 'Normal',
        status: 'pending'
      }

      const result = await createJob(jobData)
      if (result) {
        navigate('/my-jobs')
      }
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || "API Hatası")
    } finally {
      setTimeout(() => setIsCreating(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 pb-6 pt-4 px-4 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-black text-white">Yeni İş Talebi</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>{num}</div>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer block">
                {photoPreview ? <img src={photoPreview} className="w-full h-48 object-cover rounded-xl" /> : <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 font-medium">📷 Fotoğraf Ekle</div>}
              </label>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border bg-white h-32" placeholder="Sorunu tarif edin..." />
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border bg-white" placeholder="Tam adresiniz..." />
            <button onClick={handleAIAnalysis} disabled={!description || !address} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-xl">ANALİZ ET VE DEVAM ET</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center font-bold text-blue-600">AI Analiz Ediyor...</div>
        )}

        {step === 3 && (
          <div className="space-y-4">
             {activeCoupons.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-yellow-200">
                   <h3 className="font-bold mb-3">🎟️ Kupon Kullan</h3>
                   {activeCoupons.map(c => (
                      <button key={c.id} onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)} className={`w-full p-3 rounded-xl border-2 mb-2 ${selectedCoupon?.id === c.id ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50 border-gray-100'}`}>
                         {c.code} - {c.amount} TL
                      </button>
                   ))}
                </div>
             )}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl text-white text-center">
              <p className="text-xs font-bold opacity-70 mb-2 uppercase tracking-widest">Tahmini Ücret</p>
              <p className="text-6xl font-black">{finalPrice - (selectedCoupon?.amount || 0)} TL</p>
            </div>
            <button onClick={handleCreateJob} disabled={isCreating} className="w-full py-5 bg-green-500 text-white rounded-2xl font-black shadow-lg">
              {isCreating ? 'OLUŞTURULUYOR...' : 'ONAYLA VE GÖNDER'}
            </button>
            {localError && <p className="text-red-500 text-center font-bold">{localError}</p>}
            <button onClick={() => setStep(1)} className="w-full py-3 text-gray-400 font-bold">Geri Dön</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
