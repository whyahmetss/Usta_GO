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
    const premiumZones = ['Kadikoy', 'Besiktas', 'Nisantasi']
    const economyZones = ['Esenyurt', 'Sultanbeyli']
    const upperAddr = addr.toUpperCase()
    if (premiumZones.some(zone => upperAddr.includes(zone.toUpperCase()))) return 1.3
    if (economyZones.some(zone => upperAddr.includes(zone.toUpperCase()))) return 1.0
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
      if (desc.includes('priz') || desc.includes('sigorta')) { estimatedPrice = 120; category = 'Priz/Sigorta' }
      else if (desc.includes('avize') || desc.includes('lamba')) { estimatedPrice = 200; category = 'Aydinlatma' }
      else if (desc.includes('kivilcim') || desc.includes('yangin')) { estimatedPrice = 350; category = 'Acil Ariza' }
      setAiPrice(estimatedPrice)
      setAiAnalysis({
        category,
        urgency: desc.includes('acil') ? 'Yuksek' : 'Normal',
        estimatedDuration: estimatedPrice > 300 ? '2-3 saat' : '1-2 saat'
      })
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
      } catch (err) { console.warn('Kuponlar yuklenemedi', err) }
    }
    loadCoupons()
  }, [user])

  const handleLoadCoupons = () => {
    const unused = activeCoupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
    setActiveCoupons(unused)
  }

  const handleCreateJob = async () => {
    if (isCreating) return
    setError(null)
    setIsCreating(true)
    try {
      let currentFinalPrice = finalPrice
      let photoUrl = null
      if (selectedCoupon) currentFinalPrice = Math.max(0, currentFinalPrice - selectedCoupon.amount)
      
      if (photo) {
        try {
          const res = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = res.data?.url || photoPreview
        } catch (e) { photoUrl = photoPreview }
      }

const jobData = {
        title: aiAnalysis.category,
        description: description,
        budget: Number(finalJobPrice),
        location: address || 'Kadikoy, Istanbul',
        photo: photoUrl,
        urgent: aiAnalysis.urgency === 'Yuksek',
        category: 'Elektrikci' // <--- 'electric' yerine tam olarak bunu yaz
      }

      const result = await createJob(jobData)
      if (result) {
        alert('Is talebi olusturuldu!')
        navigate('/my-jobs')
      }
    } catch (err) {
      setError(err.message || 'Hata olustu')
      alert(`Hata: ${err.message}`)
    } finally { setIsCreating(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="blue-gradient-bg pb-6 pt-4 px-4 text-white">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-black">Yeni Is Talebi</h1><p className="text-white/80 text-sm">Elektrik hizmeti</p></div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-white text-blue-600' : 'bg-white/20'}`}>1</div>
          <div className={`w-12 h-1 ${step >= 2 ? 'bg-white' : 'bg-white/20'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-white text-blue-600' : 'bg-white/20'}`}>2</div>
          <div className={`w-12 h-1 ${step >= 3 ? 'bg-white' : 'bg-white/20'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-white text-blue-600' : 'bg-white/20'}`}>3</div>
        </div>
      </div>

      <div className="px-4 py-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3">Sorunu Aciklayin</h3>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-blue-500" rows={6} />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3"><MapPin size={18} className="inline mr-1" />Adres</h3>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border" placeholder="Orn: Kadikoy, Istanbul" />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3">Fotograf Ekle (Opsiyonel)</h3>
              {!photoPreview ? (
                <label className="w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer"><Camera size={32} className="text-gray-400 mb-2" /><span className="text-sm">Fotograf Cek veya Sec</span><input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" /></label>
              ) : (
                <div className="relative"><img src={photoPreview} className="w-full h-48 object-cover rounded-xl" /><button onClick={() => { setPhoto(null); setPhotoPreview(null) }} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full">X</button></div>
              )}
            </div>
            <button onClick={handleAIAnalysis} disabled={!description.trim()} className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"><Sparkles size={20} className="inline mr-2" /> AI ile Fiyat Hesapla</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold mb-2">AI Analiz Ediyor...</h3>
          </div>
        )}

        {step === 3 && aiPrice && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
              <h3 className="font-bold mb-4">🎟️ Kupon Kullan</h3>
              {activeCoupons.length === 0 ? <button onClick={handleLoadCoupons} className="w-full py-2 bg-yellow-100 text-yellow-700 rounded-lg font-bold">Kuponları Yukle</button> : (
                <div className="space-y-2">
                  {activeCoupons.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)} className={`w-full p-3 rounded-lg border-2 text-left ${selectedCoupon?.id === c.id ? 'bg-yellow-50 border-yellow-500 shadow-md' : 'bg-gray-50'}`}>
                      <div className="flex justify-between"><div><p className="font-bold">{c.code}</p><p className="text-sm">+{c.amount} TL indirim</p></div><div className="text-right"><p className="text-2xl font-black text-yellow-600">+{c.amount} TL</p></div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white text-center">
              <p className="text-white/80 text-sm mb-1">Tahmini Ucret</p>
              <p className="text-5xl font-black">{finalPrice - (selectedCoupon?.amount || 0)} TL</p>
              <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
                <div className="bg-white/20 rounded-xl p-3"><p className="text-white/80">Kategori</p><p className="font-bold">{aiAnalysis.category}</p></div>
                <div className="bg-white/20 rounded-xl p-3"><p className="text-white/80">Aciliyet</p><p className="font-bold">{aiAnalysis.urgency}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep(1)} disabled={isCreating} className="py-4 bg-gray-200 rounded-xl font-bold">Duzenle</button>
              <button onClick={handleCreateJob} disabled={isCreating} className="py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold">
                {isCreating ? 'Gonderiliyor...' : 'Onayla & Gonder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
