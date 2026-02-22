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
  const [isCreating, setIsCreating] = useState(false)
  const [localError, setLocalError] = useState(null)

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
    if (isCreating) return;
    setIsCreating(true);
    setLocalError(null);

    try {
      let photoUrl = null;
      if (photo) {
        try {
          const uploadRes = await uploadFile(API_ENDPOINTS.UPLOAD.SINGLE, photo, 'photo');
          photoUrl = uploadRes?.data?.url || uploadRes?.url;
        } catch (e) { console.warn("Fotoğraf yüklenemedi"); }
      }

      // Backend'in tüm varyasyonlarını kapsayan veri paketi
      const jobData = {
        title: aiAnalysis?.category || 'Genel Elektrik Arıza',
        description: description.trim(),
        price: Number(aiPrice) || 250,      // Sayı olarak gönderiyoruz
        budget: Number(aiPrice) || 250,     // Bazı backendler budget bekler
        location: {
          address: address.trim()           // Admin panelindeki 'Adres' alanı için
        },
        address: address.trim(),            // Bazı backendler düz string bekler
        photo: photoUrl || "",
        urgency: aiAnalysis?.urgency || 'Normal',
        category: 'Elektrikci',
        status: 'pending'                   // Statü her zaman pending başlamalı
      };

      console.log("API'ye Giden Veri:", jobData);

      const result = await createJob(jobData);
      if (result) {
        navigate('/my-jobs');
      }
    } catch (err) {
      // Backend'den gelen asıl hata mesajını yakala
      const errorMsg = err.response?.data?.message || err.message || "Bilinmeyen API Hatası";
      console.error("Hata Detayı:", err.response?.data);
      setLocalError(`API Hatası: ${errorMsg}`);
    } finally {
      // Butonu her zaman 3 saniye sonra geri aç ki kilitlenmesin
      setTimeout(() => setIsCreating(false), 3000);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header UI */}
      <div className="bg-blue-600 p-6 rounded-b-[40px] text-white shadow-lg relative overflow-hidden">
        <button onClick={() => navigate(-1)} className="mb-4 bg-white/20 p-2 rounded-xl"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">Yeni İş Talebi</h1>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      <div className="p-4 -mt-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
              <label className="block w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative cursor-pointer">
                <input type="file" className="hidden" onChange={handlePhotoCapture} accept="image/*" />
                {photoPreview ? (
                  <img src={photoPreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Camera size={32} className="mb-2" />
                    <span className="text-sm font-medium">Fotoğraf Ekle</span>
                  </div>
                )}
              </label>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sorunu tarif edin..." className="w-full p-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 h-32 bg-white" />
            <div className="relative">
              <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Tam adresiniz..." className="w-full p-4 pl-12 rounded-2xl border-none shadow-sm bg-white" />
            </div>
            <button onClick={handleAIAnalysis} disabled={!description || !address} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50">DEVAM ET</button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center py-20 flex flex-col items-center">
            <Sparkles size={48} className="text-blue-600 mb-4 animate-pulse" />
            <p className="font-bold text-gray-600">Yapay Zeka Analiz Ediyor...</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-[40px] text-center shadow-xl">
              <p className="text-xs opacity-70 uppercase tracking-widest font-bold mb-2">Tahmini Servis Bedeli</p>
              <h2 className="text-5xl font-black mb-4">{aiPrice} TL</h2>
              <div className="flex gap-2 justify-center">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">Elektrik Arıza</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">1-2 Saat</span>
              </div>
            </div>
            <button onClick={handleCreateJob} disabled={isCreating} className="w-full py-5 bg-green-500 text-white rounded-2xl font-black shadow-lg hover:bg-green-600 active:scale-95 transition-all">
              {isCreating ? 'OLUŞTURULUYOR...' : 'ONAYLA VE GÖNDER'}
            </button>
            {localError && <p className="text-red-500 text-center font-bold mt-2">{localError}</p>}
            <button onClick={() => setStep(1)} className="w-full py-3 text-gray-400 font-bold">Geri Dön</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
