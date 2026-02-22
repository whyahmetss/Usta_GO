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
    const economyZones = ['ESENYURT', 'SULTANBEYLI']
    const upperAddr = addr.toUpperCase()
    if (premiumZones.some(zone => upperAddr.includes(zone))) return 1.3
    if (economyZones.some(zone => upperAddr.includes(zone))) return 1.0
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
        const response = await fetchAPI('/api' + API_ENDPOINTS.WALLET.GET)
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

  const handleCreateJob = async () => {
    if (isCreating) return
    setError(null)
    setIsCreating(true)

    try {
      let currentFinalPrice = finalPrice 
      let photoUrl = null

      if (selectedCoupon) {
        currentFinalPrice = Math.max(0, currentFinalPrice - selectedCoupon.amount)
      }

      if (photo) {
        try {
          const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadResponse.data?.url || photoPreview
        } catch (err) {
          photoUrl = photoPreview
        }
      }

      const jobData = {
        title: aiAnalysis.category,
        description: description,
        budget: Number(currentFinalPrice), 
        location: address || 'Kadikoy, Istanbul', 
        photo: photoUrl,
        urgent: aiAnalysis.urgency === 'Yuksek',
        category: 'Elektrikci'
      }

      const result = await createJob(jobData)
      if (result) {
        alert('Is talebi olusturuldu!')
        navigate('/my-jobs')
      }
    } catch (err) {
      setError(err.message || 'Hata olustu')
      alert(`Hata: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>{num}</div>
              {num < 3 && <div className={`w-12 h-1 mx-2 ${step > num ? 'bg-white' : 'bg-white/20'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <h3 className="font-bold mb-3 text-gray-900 text-left">Fotoğraf Ekle</h3>
              <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer block">
                {photoPreview ? (
                  <div className="relative inline-block w-full">
                    <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border-2 border-blue-500" />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg"><Camera size={18} /></div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-blue-500 transition-colors">
                    <Camera size={40} className="text-gray-400" />
                    <p className="text-gray-500 font-medium">Sorunu fotoğrafla</p>
                  </div>
                )}
              </label>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3 text-gray-900 text-left">Sorunu Açıklayın</h3>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500" rows={4} placeholder="Prizden kivilcim cikiyor..." />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3 text-gray-900 text-left"><MapPin size={18} className="inline mr-1" />Adres(Tam adres girin)</h3>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500" placeholder="Kadikoy, Istanbul" />
            </div>

            <button onClick={handleAIAnalysis} disabled={!description.trim()} className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl hover:opacity-90 transition-opacity"><Sparkles size={20} className="inline mr-2" /> AI ile Analiz Et</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800">AI Analiz Ediyor...</h3>
          </div>
        )}

        {step === 3 && aiPrice && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-yellow-200">
              <h3 className="font-bold text-gray-900 mb-3">🎟️ Kupon Kullan</h3>
              {activeCoupons.length === 0 ? <p className="text-gray-500 text-sm">Aktif kupon bulunamadi</p> : (
                <div className="space-y-2">
                  {activeCoupons.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)} className={`w-full p-3 rounded-xl border-2 text-left transition-all ${selectedCoupon?.id === c.id ? 'bg-yellow-50 border-yellow-500 shadow-md' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <div><p className="font-black text-gray-900">{c.code}</p><p className="text-xs text-gray-500">{c.amount} TL indirim</p></div>
                        <p className="text-xl font-black text-yellow-600">-{c.amount} TL</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl text-white text-center">
              <p className="text-white/70 text-sm font-bold uppercase tracking-wider mb-2">Tahmini Ucret</p>
              <p className="text-6xl font-black mb-6">{finalPrice - (selectedCoupon?.amount || 0)} TL</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"><p className="text-white/60 text-xs mb-1">Kategori</p><p className="font-bold text-sm">{aiAnalysis.category}</p></div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"><p className="text-white/60 text-xs mb-1">Aciliyet</p><p className="font-bold text-sm">{aiAnalysis.urgency}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setStep(1)} disabled={isCreating} className="py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-300 transition-colors">Geri Don</button>
              <button onClick={handleCreateJob} disabled={isCreating} className="py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg hover:bg-green-600 transition-all">
                {isCreating ? 'Is Olusturuluyor...' : 'Onayla ve Gonder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
