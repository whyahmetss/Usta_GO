import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFile } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { ArrowLeft, Camera, Sparkles, MapPin, Clock } from 'lucide-react'

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

  // Kuponları Yükle
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const response = await fetchAPI('/api' + API_ENDPOINTS.WALLET.GET)
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
      setAiAnalysis({
        category: description.toLowerCase().includes('priz') ? 'Priz Arızası' : 'Genel Elektrik',
        urgency: description.toLowerCase().includes('acil') ? 'Yüksek' : 'Normal',
        duration: '1-2 Saat'
      })
      setIsAnalyzing(false)
      setStep(3)
    }, 2000)
  }

const handleCreateJob = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    setError(null);

    // EMNİYET KİLİDİ: Ne olursa olsun 5 saniye sonra butonu tekrar açar
    const timeoutId = setTimeout(() => {
      setIsCreating(false);
    }, 5000);

    try {
      let photoUrl = null;
      if (photo) {
        try {
          const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo');
          photoUrl = uploadRes?.data?.url || uploadRes?.url;
        } catch (e) { 
          console.warn("Fotoğraf yüklenemedi, devam ediliyor...");
        }
      }

      const finalAmount = Number(aiPrice - (selectedCoupon?.amount || 0));
      
      // Admin panelindeki boşlukları dolduran ve My-Jobs'a düşmesini sağlayan yapı
      const jobData = {
        title: aiAnalysis?.category || 'Genel Elektrik',
        description: description.trim(),
        price: finalAmount,      // Admin panel 'Fiyat' için
        budget: finalAmount,     // Yedek fiyat
        location: {
          address: address       // Admin panel 'Adres' için
        },
        address: address,        // Yedek adres
        photo: photoUrl || "",
        urgency: aiAnalysis?.urgency || 'Normal',
        category: 'Elektrikci'
      };

      const result = await createJob(jobData);
      
      if (result) {
        clearTimeout(timeoutId); // Başarılıysa emniyet kilidini iptal et
        navigate('/my-jobs');
      }
    } catch (err) {
      console.error("API Hatası:", err);
      alert("Bir hata oluştu: " + (err.response?.data?.message || err.message));
    } finally {
      // Normal şartlarda butonu burada açarız ama timeout da garanti sağlar
      setIsCreating(false);
      clearTimeout(timeoutId);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="blue-gradient-bg pb-10 pt-4 px-4 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-white">Yeni İş Talebi</h1>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-white text-blue-600' : 'bg-white/20 text-white'}`}>{num}</div>
              {num < 3 && <div className={`w-10 h-0.5 ${step > num ? 'bg-white' : 'bg-white/20'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-6 pb-10">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Camera size={18}/> Fotoğraf (Opsiyonel)</h3>
              <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" id="photo-up" />
              <label htmlFor="photo-up" className="cursor-pointer block">
                {photoPreview ? (
                  <img src={photoPreview} className="w-full h-44 object-cover rounded-2xl border-2 border-blue-500" />
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center text-gray-400">
                    <Camera size={32} className="mb-2" />
                    <span className="text-sm font-medium">Sorunu Çek Gönder</span>
                  </div>
                )}
              </label>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-2">Sorun Nedir? *</h3>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Örn: Sigorta kutusundan ses geliyor..." />
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><MapPin size={18}/> Adres Bilgisi *</h3>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500" placeholder="Mahalle, Sokak, No..." />
            </div>

            <button onClick={handleAIAnalysis} disabled={!description.trim() || !address.trim()} className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all ${(!description.trim() || !address.trim()) ? 'bg-gray-300' : 'bg-blue-600 active:scale-95'}`}>
              <Sparkles size={20} className="inline mr-2" /> ANALİZ ET VE DEVAM ET
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl p-12 shadow-2xl text-center border border-gray-100">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-black text-gray-800">Yapay Zeka İnceliyor</h2>
            <p className="text-gray-500 text-sm mt-2">En uygun fiyat belirleniyor...</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">🎟️ Kupon Uygula</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeCoupons.length > 0 ? activeCoupons.map(c => (
                  <button key={c.id} onClick={() => setSelectedCoupon(selectedCoupon?.id === c.id ? null : c)} className={`flex-shrink-0 p-4 rounded-2xl border-2 transition-all ${selectedCoupon?.id === c.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                    <p className="font-black text-blue-600">-{c.amount} TL</p>
                    <p className="text-[10px] text-gray-500 uppercase">{c.code}</p>
                  </button>
                )) : <p className="text-gray-400 text-sm">Aktif kuponun yok.</p>}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 text-center">
                  <p className="text-white/70 text-xs font-bold uppercase mb-2">Ödenecek Tutar</p>
                  <h2 className="text-6xl font-black mb-6">{aiPrice - (selectedCoupon?.amount || 0)} TL</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 p-3 rounded-2xl text-left">
                      <p className="text-[10px] text-white/60 uppercase">Kategori</p>
                      <p className="text-sm font-bold">{aiAnalysis?.category}</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl text-left">
                      <p className="text-[10px] text-white/60 uppercase">Süre</p>
                      <p className="text-sm font-bold">{aiAnalysis?.duration}</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-5 bg-white text-gray-500 rounded-2xl font-bold border border-gray-200">Geri</button>
              <button onClick={handleCreateJob} disabled={isCreating} className="flex-[2] py-5 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-200">
                {isCreating ? 'Oluşturuluyor...' : 'ONAYLA VE GÖNDER'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
