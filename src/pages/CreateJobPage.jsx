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
    if (!description.trim() || !address.trim()) return
    setIsAnalyzing(true)
    setStep(2)
    setTimeout(() => {
      setAiPrice(150)
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
    setError(null)
    setIsCreating(true)

    try {
      let photoUrl = null
      if (photo) {
        try {
          const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadRes?.data?.url || uploadRes?.url || null
        } catch (e) { console.warn("Fotoğraf yükleme hatası") }
      }

      const calculatedPrice = finalPrice - (selectedCoupon?.amount || 0)

      // Backend'in reddedemeyeceği temiz veri yapısı
      const jobData = {
        title: aiAnalysis?.category || 'Elektrik Arıza',
        description: description.trim(),
        price: Number(calculatedPrice),
        budget: Number(calculatedPrice),
        location: { address: address.trim() },
        address: address.trim(),
        photo: photoUrl || "",
        category: 'Elektrikci',
        urgency: aiAnalysis?.urgency || 'Normal',
        status: 'pending'
      }

      const result = await createJob(jobData)
      if (result) {
        navigate('/my-jobs')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'API Hatası')
    } finally {
      setIsCreating(false)
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
               <input type="file" id="p-up" hidden onChange={handlePhotoCapture} accept="image/*" />
               <label htmlFor="p-up" className="block w-full h-48 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer">
                  {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover rounded-lg" /> : <div className="flex flex-col items-center justify-center h-full text-gray-400">📷 Fotoğraf Ekle</div>}
               </label>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sorunu anlatın..." className="w-full p-4 rounded-xl border bg-white h-32" />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresiniz..." className="w-full p-4 rounded-xl border bg-white" />
            <button onClick={handleAIAnalysis} disabled={!description || !address} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold">ANALİZ ET VE DEVAM ET</button>
          </div>
        )}

        {step === 2 && <div className="text-center py-20 font-bold text-blue-600">Analiz ediliyor...</div>}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-yellow-200">
              <h3 className="font-bold mb-3">🎟️ Kupon Kullan</h3>
              {activeCoupons.map(c => (
                <button key={c.id} onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)} className={`w-full p-3 rounded-xl border-2 mb-2 ${selectedCoupon?.id === c.id ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50'}`}>
                  {c.code} - {c.amount} TL
                </button>
              ))}
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl text-white text-center">
              <h2 className="text-6xl font-black">{finalPrice - (selectedCoupon?.amount || 0)} TL</h2>
            </div>
            <button onClick={handleCreateJob} disabled={isCreating} className="w-full py-5 bg-green-500 text-white rounded-2xl font-black">
              {isCreating ? 'OLUŞTURULUYOR...' : 'ONAYLA VE GÖNDER'}
            </button>
            {error && <p className="text-red-500 text-center font-bold mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
