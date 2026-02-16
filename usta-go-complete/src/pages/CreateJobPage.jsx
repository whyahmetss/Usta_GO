import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Camera, Sparkles } from 'lucide-react'

function CreateJobPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Problem yazma, 2: AI analiz, 3: Onay
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [aiPrice, setAiPrice] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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
      alert('Lütfen problemi açıklayın')
      return
    }

    setIsAnalyzing(true)
    setStep(2)

    // AI Analiz simülasyonu (gerçek uygulamada Anthropic Claude API çağrısı)
    // Backend'e bağlanınca burası değişecek
    setTimeout(() => {
      // Basit keyword bazlı fiyat tahmini (demo için)
      let estimatedPrice = 150
      let category = 'Genel Elektrik'
      
      const desc = description.toLowerCase()
      
      if (desc.includes('priz') || desc.includes('sigorta')) {
        estimatedPrice = 120
        category = 'Priz/Sigorta'
      } else if (desc.includes('avize') || desc.includes('lamba')) {
        estimatedPrice = 200
        category = 'Aydınlatma'
      } else if (desc.includes('kıvılcım') || desc.includes('yangın') || desc.includes('tehlike')) {
        estimatedPrice = 350
        category = 'Acil Arıza'
      } else if (desc.includes('kablo') || desc.includes('tesisat')) {
        estimatedPrice = 400
        category = 'Tesisat'
      }

      // Fotoğraf varsa +50₺
      if (photo) {
        estimatedPrice += 50
      }

      setAiPrice(estimatedPrice)
      setAiAnalysis({
        category,
        urgency: desc.includes('acil') || desc.includes('tehlike') ? 'Yüksek' : 'Normal',
        estimatedDuration: estimatedPrice > 300 ? '2-3 saat' : '1-2 saat'
      })
      setIsAnalyzing(false)
      setStep(3)
    }, 2000)
  }

  const handleCreateJob = () => {
    // İş oluşturma (backend'e bağlanınca gerçek olacak)
    const newJob = {
      id: Date.now().toString(),
      title: aiAnalysis.category,
      description,
      price: aiPrice,
      photo: photoPreview,
      customer: {
        id: user.id,
        name: user.name,
        phone: user.phone || '',
        avatar: user.avatar
      },
      location: { address: 'Kadıköy, İstanbul', lat: 40.9929, lng: 29.0260 },
      date: new Date().toISOString(),
      status: 'pending',
      urgent: aiAnalysis.urgency === 'Yüksek',
      category: 'electric'
    }

    // Context'e ekle (gerçekte backend'e POST)
    alert('İş talebi oluşturuldu! Ustalar yakında teklif verecek.')
    navigate('/home')
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
            <h1 className="text-2xl font-black text-white">Yeni İş Talebi</h1>
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
        {/* Step 1: Problem Açıklaması */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">Sorunu Açıklayın</h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Örn: Salon prizlerinde kıvılcım çıkıyor, kontrol edilmesi gerekiyor..."
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={6}
              />
            </div>

            {/* Fotoğraf Ekleme */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">Fotoğraf Ekle (Opsiyonel)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Fotoğraf eklemek fiyat tahmininin daha doğru olmasını sağlar
              </p>
              
              {!photoPreview ? (
                <label className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">
                  <Camera size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Fotoğraf Çek</span>
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
                    ✕
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

        {/* Step 2: AI Analiz Ediy or */}
        {step === 2 && isAnalyzing && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Analiz Ediyor...</h3>
            <p className="text-gray-600">Probleminiz değerlendiriliyor ve fiyat hesaplanıyor</p>
          </div>
        )}

        {/* Step 3: Sonuç ve Onay */}
        {step === 3 && aiPrice && (
          <div className="space-y-4">
            {/* AI Analiz Sonucu */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={24} />
                <h3 className="text-xl font-bold">AI Analiz Sonucu</h3>
              </div>
              
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4">
                <div className="text-center">
                  <p className="text-white/80 text-sm mb-1">Tahmini Ücret</p>
                  <p className="text-5xl font-black">₺{aiPrice}</p>
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
                  <p className="text-white/80 mb-1">Tahmini Süre</p>
                  <p className="font-bold">{aiAnalysis.estimatedDuration}</p>
                </div>
              </div>
            </div>

            {/* Problem Özeti */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">Problem Detayı</h3>
              <p className="text-gray-700 mb-4">{description}</p>
              {photoPreview && (
                <img src={photoPreview} alt="Problem" className="w-full h-48 object-cover rounded-xl" />
              )}
            </div>

            {/* Bilgilendirme */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm text-blue-900">
                ℹ️ Bu fiyat AI tarafından hesaplanmış bir tahmindir. Ustalar teklif verdiğinde kesinleşecektir.
              </p>
            </div>

            {/* Butonlar */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep(1)}
                className="py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Düzenle
              </button>
              <button
                onClick={handleCreateJob}
                className="py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-xl transition"
              >
                Onayla & Gönder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
