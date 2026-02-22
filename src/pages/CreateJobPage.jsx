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
  const [localError, setLocalError] = useState(null) // Adını setError ile çakışmasın diye localError yaptık

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        // Çift /api/ hatasını engellemek için direkt endpoint'i kontrol et
        const endpoint = API_ENDPOINTS.WALLET.GET.startsWith('/api') 
          ? API_ENDPOINTS.WALLET.GET 
          : `/api${API_ENDPOINTS.WALLET.GET}`
        
        const response = await fetchAPI(endpoint)
        if (response.data?.coupons) {
          const unused = response.data.coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
          setActiveCoupons(unused)
        }
      } catch (err) { console.warn('Kuponlar yüklenemedi') }
    }
    if (user) loadCoupons()
  }, [user])

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleAIAnalysis = () => {
    if (!description.trim() || !address.trim()) return
    setIsAnalyzing(true)
    setStep(2)
    setTimeout(() => {
      setAiPrice(250)
      setAiAnalysis({ category: 'Elektrik Arıza', urgency: 'Normal', duration: '1-2 Saat' })
      setIsAnalyzing(false)
      setStep(3)
    }, 1500)
  }

  const handleCreateJob = async () => {
    if (isCreating) return
    setIsCreating(true)
    setLocalError(null)

    try {
      let photoUrl = null
      if (photo) {
        try {
          const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadRes?.data?.url || uploadRes?.url
        } catch (e) { console.warn("Fotoğraf yüklenemedi") }
      }

      const finalAmount = Number(aiPrice - (selectedCoupon?.amount || 0))
      const jobData = {
        title: aiAnalysis?.category || 'Genel Elektrik',
        description: description,
        price: finalAmount,
        budget: finalAmount,
        location: { address: address }, // Admin panelini dolduracak yapı
        photo: photoUrl || "",
        urgency: aiAnalysis?.urgency || 'Normal',
        category: 'Elektrikci'
      }

      const result = await createJob(jobData)
      if (result) {
        navigate('/my-jobs')
      } else {
        throw new Error("İş oluşturulamadı, lütfen tekrar deneyin.")
      }
    } catch (err) {
      console.error("Yakaladığımız Hata:", err)
      setLocalError(err.message || "Bir API hatası oluştu")
      setIsCreating(false) // Hata olunca butonu geri aç
    } finally {
      // 10 saniye sonra her ihtimale karşı butonu aç
      setTimeout(() => setIsCreating(false), 10000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="blue-gradient-bg p-4 flex items-center gap-4 text-white">
        <button onClick={() => navigate(-1)}><ArrowLeft /></button>
        <h1 className="text-xl font-bold">Yeni İş Talebi</h1>
      </div>

      <div className="p-4">
        {step === 1 && (
          <div className="space-y-4">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <input type="file" id="photo-input" hidden onChange={handlePhotoCapture} />
                <label htmlFor="photo-input" className="cursor-pointer block">
                  {photoPreview ? <img src={photoPreview} className="w-full h-40 object-cover rounded-2xl" /> : <div className="p-10 border-2 border-dashed rounded-2xl text-center text-gray-400">Fotoğraf Ekle (Opsiyonel)</div>}
                </label>
             </div>
             <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Sorunu tarif edin..." className="w-full p-4 rounded-2xl border bg-white shadow-sm" rows="3" />
             <input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Tam Adresiniz..." className="w-full p-4 rounded-2xl border bg-white shadow-sm" />
             <button onClick={handleAIAnalysis} disabled={!description || !address} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200">DEVAM ET</button>
          </div>
        )}

        {step === 2 && <div className="text-center py-20 font-bold text-blue-600 animate-pulse text-xl">Yapay Zeka Analiz Ediyor...</div>}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-blue-600 text-white p-8 rounded-[40px] text-center shadow-xl">
              <p className="text-sm opacity-80 uppercase font-bold mb-2">Ödenecek Tutar</p>
              <h2 className="text-5xl font-black">{aiPrice - (selectedCoupon?.amount || 0)} TL</h2>
            </div>
            <button onClick={handleCreateJob} disabled={isCreating} className="w-full py-5 bg-green-500 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-transform">
              {isCreating ? 'OLUŞTURULUYOR...' : 'ONAYLA VE GÖNDER'}
            </button>
            {localError && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center font-bold border border-red-100">{localError}</div>}
            <button onClick={() => setStep(1)} className="w-full py-3 text-gray-400 font-bold">Geri Dön</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
