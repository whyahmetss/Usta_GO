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
    if (!description.trim() || !address.trim()) {
      alert('Lütfen açıklama ve adres girin.')
      return
    }
    setIsAnalyzing(true)
    setStep(2)
    setTimeout(() => {
      let estimatedPrice = 150
      let category = 'Genel Elektrik'
      const desc = description.toLowerCase()
      if (desc.includes('priz')) { estimatedPrice = 120; category = 'Priz/Sigorta' }
      
      setAiPrice(estimatedPrice)
      setAiAnalysis({
        category,
        urgency: desc.includes('acil') ? 'Yüksek' : 'Normal'
      })
      setIsAnalyzing(false)
      setStep(3)
    }, 2000)
  }

  // KUPON YOLU DÜZELTİLDİ (Route not found fix)
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        // Gereksiz '/api' eklemesini kaldırdık, endpoint zaten tam yol olmalı
        const response = await fetchAPI(API_ENDPOINTS.WALLET.GET)
        if (response.data?.coupons) {
          const unused = response.data.coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
          setActiveCoupons(unused)
        }
      } catch (err) {
        console.warn('Kuponlar yüklenemedi')
      }
    }
    if (user) loadCoupons()
  }, [user])

  // İŞ OLUŞTURMA DÜZELTİLDİ (Validation error fix)
  const handleCreateJob = async () => {
    if (isCreating) return
    
    if (description.trim().length < 10) {
      alert('Lütfen en az 10 karakterlik bir açıklama yazınız.')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      let currentFinalPrice = finalPrice - (selectedCoupon?.amount || 0)
      let photoUrl = null

      if (photo) {
        try {
          const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadRes?.data?.url || uploadRes?.url || ""
        } catch (e) { console.warn("Fotoğraf yüklenemedi") }
      }

      // Backend'in tam istediği format (Location string yapıldı)
      const jobData = {
        title: aiAnalysis?.category || 'Elektrik Arıza',
        description: description.trim(),
        budget: Number(currentFinalPrice),
        location: address.trim(), 
        photo: photoUrl || "",
        category: 'Elektrikci',
        urgent: aiAnalysis?.urgency === 'Yüksek'
      }

      const result = await createJob(jobData)
      if (result) {
        navigate('/my-jobs')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'API Hatası'
      setError(errorMsg)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="blue-gradient-bg pb-6 pt-4 px-4 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-black text-white">Yeni İş Talebi</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>{num}</div>
              {num < 3 && <div className={`w-12 h-1 mx-2 ${step > num ? 'bg-white' : 'bg-white/20'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer block text-center">
                {photoPreview ? <img src={photoPreview} className="w-full h-48 object-cover rounded-xl" /> : <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-2"><Kamera size={40} className="text-gray-400" /><p className="text-gray-500 font-medium">Sorunu fotoğrafla</p></div>}
              </label>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3 text-red-600">Sorunu Açıklayın *</h3>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border" rows={4} placeholder="Detaylı anlatın (En az 10 karakter)..." />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3 text-red-600"><MapPin size={18} className="inline mr-1" />Tam Adres *</h3>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border" placeholder="Örn: Kadıköy, Moda No:5" />
            </div>
            <button onClick={handleAIAnalysis} disabled={!description.trim() || !address.trim()} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-xl">ANALİZ ET VE DEVAM ET</button>
          </div>
        )}

        {step === 2 && <div className="bg-white rounded-2xl p-12 shadow-lg text-center font-bold text-blue-600">AI Tam Performans Analiz Ediyor...</div>}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-yellow-200">
              <h3 className="font-bold mb-3 text-gray-900">🎟️ Kuponlar</h3>
              {activeCoupons.map((c) => (
                <button key={c.id} onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)} className={`w-full p-3 rounded-xl border-2 mb-2 text-left ${selectedCoupon?.id === c.id ? 'bg-yellow-50 border-yellow-500 shadow-md' : 'bg-gray-50'}`}>
                  <p className="font-black">{c.code} (-{c.amount} TL)</p>
                </button>
              ))}
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl text-white text-center">
              <p className="text-6xl font-black mb-6">{finalPrice - (selectedCoupon?.amount || 0)} TL</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setStep(1)} className="py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold">Geri Dön</button>
              <button onClick={handleCreateJob} disabled={isCreating} className="py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg">
                {isCreating ? 'Oluşturuluyor...' : 'Onayla ve Gönder'}
              </button>
            </div>
            {error && <p className="text-red-500 text-center font-bold mt-4">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
