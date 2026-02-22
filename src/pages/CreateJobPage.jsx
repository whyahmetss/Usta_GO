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

      // Backend'in beklediği ve Admin panelini dolduran veri yapısı
      const jobData = {
        title: aiAnalysis?.category || 'Genel Elektrik',
        description: description,
        price: 250,
        budget: 250,
        location: { address: address }, // Admin panelindeki Adres alanı için
        photo: photoUrl || "",
        urgency: aiAnalysis?.urgency || 'Normal',
        category: 'Elektrikci'
      }

      const result = await createJob(jobData)
      if (result) {
        navigate('/my-jobs')
      }
    } catch (err) {
      // "API Error" detayını ekrana basıyoruz
      setLocalError(err.response?.data?.message || err.message || "API Hatası")
      setIsCreating(false)
    } finally {
      setTimeout(() => setIsCreating(false), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Senin Orijinal UI'ın */}
      <div className="bg-blue-600 p-6 text-white flex items-center gap-4">
        <button onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold">Yeni İş Talebi</h1>
      </div>

      <div className="p-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border">
               <input type="file" id="photo-input" hidden onChange={handlePhotoCapture} accept="image/*" />
               <label htmlFor="photo-input" className="block text-center p-6 border-2 border-dashed rounded-xl cursor-pointer">
                  {photoPreview ? <img src={photoPreview} className="max-h-40 mx-auto rounded-lg" /> : "Fotoğraf Ekle"}
               </label>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sorunu anlatın..." className="w-full p-4 rounded-xl border bg-white h-32" />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresiniz..." className="w-full p-4 rounded-xl border bg-white" />
            <button onClick={handleAIAnalysis} disabled={!description || !address} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">DEVAM ET</button>
          </div>
        )}

        {step === 2 && <div className="text-center py-20 font-bold text-blue-600">Analiz ediliyor...</div>}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="bg-white p-10 rounded-3xl shadow-lg border-2 border-blue-100">
              <p className="text-gray-500 font-bold mb-2">ÖDENECEK TUTAR</p>
              <h2 className="text-5xl font-black text-blue-600">250 TL</h2>
            </div>
            <button onClick={handleCreateJob} disabled={isCreating} className="w-full py-5 bg-green-500 text-white rounded-2xl font-black shadow-lg">
              {isCreating ? 'OLUŞTURULUYOR...' : 'ONAYLA VE GÖNDER'}
            </button>
            {localError && <p className="text-red-500 font-bold">{localError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateJobPage
