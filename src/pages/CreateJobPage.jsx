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

  // Bölgeye göre fiyat çarpanı
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

  // Fotoğraf yakalama ve önizleme
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  // AI Analiz Simülasyonu
  const handleAIAnalysis = async () => {
    if (!description.trim() || !address.trim()) {
      alert('Lütfen hem sorunu açıklayın hem de adresinizi girin.')
      return
    }
    setIsAnalyzing(true)
    setStep(2)
    
    setTimeout(() => {
      let estimatedPrice = 150
      let category = 'Genel Elektrik'
      const desc = description.toLowerCase()
      if (desc.includes('priz') || desc.includes('sigorta')) { estimatedPrice = 120; category = 'Priz/Sigorta' }
      else if (desc.includes('avize') || desc.includes('lamba')) { estimatedPrice = 200; category = 'Aydınlatma' }
      else if (desc.includes('kıvılcım') || desc.includes('yangın')) { estimatedPrice = 350; category = 'Acil Arıza' }
      
      setAiPrice(estimatedPrice)
      setAiAnalysis({
        category,
        urgency: desc.includes('acil') ? 'Yüksek' : 'Normal',
        estimatedDuration: estimatedPrice > 300 ? '2-3 saat' : '1-2 saat'
      })
      setIsAnalyzing(false)
      setStep(3)
    }, 2000)
  }

  // Kuponları Yükle
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const response = await fetchAPI('/api' + API_ENDPOINTS.WALLET.GET)
        if (response.data?.coupons) {
          const unused = response.data.coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date())
          setActiveCoupons(unused)
        }
      } catch (err) {
        console.warn('Kuponlar yüklenemedi:', err)
      }
    }
    loadCoupons()
  }, [user])

  // İŞ OLUŞTURMA (ASIL NOKTA)
  const handleCreateJob = async () => {
    if (isCreating) return
    if (!description.trim() || !address.trim()) {
      alert('Lütfen eksik alanları doldurun.')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      let currentFinalPrice = finalPrice 
      let photoUrl = null

      if (selectedCoupon) {
        currentFinalPrice = Math.max(0, currentFinalPrice - selectedCoupon.amount)
      }

      // Fotoğraf yükleme işlemi (Hata alırsa işleme devam eder)
      if (photo) {
        try {
          const uploadResponse = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo')
          photoUrl = uploadResponse?.data?.url || uploadResponse?.url || ""
        } catch (uploadErr) {
          console.warn("Fotoğraf yüklenemedi, iş fotoğrafsız devam ediyor.")
        }
      }

      // BACKEND İÇİN HER İHTİMALİ KAPSAYAN VERİ YAPISI
      const jobData = {
        title: aiAnalysis?.category || 'Elektrik Arıza',
        description: description.trim(),
        price: Number(currentFinalPrice),   // Bazı backendler price ister
        budget: Number(currentFinalPrice),  // Bazı backendler budget ister
        location: { address: address.trim() }, // Obje isteyen backendler için
        address: address.trim(),            // String isteyen backendler için
        photo: photoUrl || "",
        urgent: aiAnalysis?.urgency === 'Yüksek',
        urgency: aiAnalysis?.urgency || 'Normal',
        category: 'Elektrikci',
        status: 'pending'
      }

      const result = await createJob(jobData)
      if (result) {
        alert('İş talebi başarıyla oluşturuldu!')
        navigate('/my-jobs')
      }
    } catch (err) {
      // BURASI DÜZELTİLDİ: Artık API'nin gizli mesajı ekrana basılacak
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'API Hatası oluştu'
      console.error("API'DEN GELEN TAM HATA:", err.response?.data)
      setError(errorMsg)
      alert(`Hata: ${errorMsg}`)
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>{num}</div>
              {num < 3 && <div className={`w-12 h-1 mx-2 ${step > num ? 'bg-white' : 'bg-white/20'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {/* ADIM 1: BİLGİ GİRİŞİ */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <h3 className="font-bold mb-3 text-gray-900 text-left">Fotoğraf Ekle (Zorunlu Değil)</h3>
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
              <h3 className="font-bold mb-3 text-gray-900 text-left text-red-600">Sorunu Açıklayın *</h3>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500" rows={4} placeholder="Örn: Mutfak prizinden duman çıkıyor..." />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold mb-3 text-gray-900 text-left text-red-600"><MapPin size={18} className="inline mr-1" />Tam Adres *</h3>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500" placeholder="Örn: Kadıköy, Caferağa Mah. Moda Cad. No:5" />
            </div>

            <button 
              onClick={handleAIAnalysis} 
              disabled={!description.trim() || !address.trim()} 
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all ${(!description.trim() || !address.trim()) ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'}`}
            >
              <Sparkles size={20} className="inline mr-2" /> Analiz Et ve Devam Et
            </button>
          </div>
        )}

        {/* ADIM 2: ANALİZ EKRANI */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800">AI Analiz Ediyor...</h3>
          </div>
        )}

        {/* ADIM 3: ONAY VE KUPON */}
        {step === 3 && aiPrice && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-yellow-200">
              <h3 className="font-bold text-gray-900 mb-3 text-left">🎟️ Kupon Kullan</h3>
              {activeCoupons.length === 0 ? <p className="text-gray-500 text-sm text-left">Aktif kupon bulunamadı</p> : (
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
              <p className="text-white/70 text-sm font-bold uppercase tracking-wider mb-2">Tahmini Ücret</p>
              <p className="text-6xl font-black mb-6">{finalPrice - (selectedCoupon?.amount || 0)} TL</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"><p className="text-white/60 text-xs mb-1">Kategori</p><p className="font-bold text-sm">{aiAnalysis.category}</p></div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"><p className="text-white/60 text-xs mb-1">Aciliyet</p><p className="font-bold text-sm">{aiAnalysis.urgency}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setStep(1)} disabled={isCreating} className="py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-300 transition-colors">Geri Dön</button>
              <button 
                onClick={handleCreateJob} 
                disabled={isCreating || !description.trim() || !address.trim()} 
                className={`py-4 rounded-2xl font-bold shadow-lg transition-all ${ (isCreating || !description.trim() || !address.trim()) ? 'bg-gray-400' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                {isCreating ? 'İş Oluşturuluyor...' : 'Onayla ve Gönder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
