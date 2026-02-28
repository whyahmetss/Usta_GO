import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI, uploadFiles } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobFromBackend } from '../utils/fieldMapper'
import { useCapacitorCamera } from '../hooks/useCapacitorCamera'
import { ArrowLeft, MapPin, Phone, Camera, CheckCircle, Navigation, X, Radio } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { CameraSource } from '@capacitor/camera'
import { getSocket, emitEvent } from '../utils/socket'

function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [isNative, setIsNative] = useState(false)
  const { takePhotoWithCamera, pickFromGallery } = useCapacitorCamera()

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
    if (isOpen && !isNative) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode, isNative])

  const startCamera = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Kamera erisimi reddedildi veya kamera bulunamadi.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const takePhoto = async () => {
    if (isNative) {
      try {
        const dataUrl = await takePhotoWithCamera()
        onCapture(dataUrl)
        onClose()
      } catch (err) {
        console.error('Camera error:', err)
        setError('Fotograf cekilemedi')
      }
    } else {
      if (!videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      stopCamera()
      onCapture(dataUrl)
      onClose()
    }
  }

  const switchCamera = () => {
    if (!isNative) {
      stopCamera()
      setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    }
  }

  const handleGalleryPick = async () => {
    try {
      const dataUrl = await pickFromGallery()
      onCapture(dataUrl)
      onClose()
    } catch (err) {
      console.error('Gallery error:', err)
      setError('Fotograf secilemedi')
    }
  }

  if (!isOpen) return null

  if (isNative) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-white text-lg mb-6">Fotograf Çek veya Galeriden Seç</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={takePhoto}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              Kamera ile Çek
            </button>
            <button
              onClick={handleGalleryPick}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold"
            >
              Galeriden Seç
            </button>
            <button
              onClick={() => { onClose() }}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => { stopCamera(); onClose() }}
          className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
        >
          <X size={24} className="text-white" />
        </button>
        <span className="text-white font-bold">Fotoğraf Çek</span>
        <button
          onClick={switchCamera}
          className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
        >
          <span className="text-white text-lg">🔄</span>
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-white text-lg mb-4">{error}</p>
          <label className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold cursor-pointer">
            Dosyadan Seç
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    onCapture(reader.result)
                    onClose()
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
          </label>
          <button
            onClick={() => { stopCamera(); onClose() }}
            className="mt-4 px-6 py-3 bg-gray-600 text-white rounded-xl font-bold"
          >
            Iptal
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}

      {!error && (
        <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/60 to-transparent">
          <button
            onClick={takePhoto}
            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-2xl"
          >
            <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-400"></div>
          </button>
        </div>
      )}
    </div>
  )
}

function JobDetailPage() {
  const { id } = useParams()
  const { user, acceptJob, startJob, completeJob } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [beforePhotos, setBeforePhotos] = useState([])
  const [afterPhotos, setAfterPhotos] = useState([])
  const [showCamera, setShowCamera] = useState(false)
  const [cameraType, setCameraType] = useState('before')
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [complaintReason, setComplaintReason] = useState('')
  const [complaintDetails, setComplaintDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch job details from API
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchAPI(API_ENDPOINTS.JOBS.GET(id))
        if (response.data) {
          const mapped = mapJobFromBackend(response.data)
          setJob(mapped)
          setBeforePhotos(mapped.beforePhotos || [])
          setAfterPhotos(mapped.afterPhotos || [])
        } else {
          setError('İş bulunamadı')
        }
      } catch (err) {
        console.error('Fetch job error:', err)
        setError(err.message || 'İş yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchJobDetails()
    }
  }, [id])

  // Socket.IO: Listen for real-time job status updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !id) return

    const handleJobUpdated = async (data) => {
      if (data.jobId === id) {
        // Refetch job details when status changes
        try {
          const response = await fetchAPI(API_ENDPOINTS.JOBS.GET(id))
          if (response.data) {
            const mapped = mapJobFromBackend(response.data)
            setJob(mapped)
            setBeforePhotos(mapped.beforePhotos || [])
            setAfterPhotos(mapped.afterPhotos || [])
          }
        } catch (err) {
          console.error('Refetch job error:', err)
        }
      }
    }

    socket.on('job_updated', handleJobUpdated)

    return () => {
      socket.off('job_updated', handleJobUpdated)
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">İs yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'İş bulunamadı'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Geri Don
          </button>
        </div>
      </div>
    )
  }

  const isProfessional = user?.role === 'professional'
  const isCustomer = user?.role === 'customer'

  const handleAccept = async () => {
    if (confirm('Bu işi kabul etmek istiyor musunuz?')) {
      try {
        // Await the API call
        await acceptJob(job.id)
        alert('İş başarıyla kabul edildi! Müşteri bilgilendirildi.')

        // Notify customer via socket
        emitEvent('job_accepted', {
          customerId: job.customer?.id,
          jobId: job.id,
          professionalName: user?.name
        })
        emitEvent('job_status_changed', {
          jobId: job.id,
          status: 'accepted',
          customerId: job.customer?.id,
          professionalId: user?.id
        })

        // Reload job details to show updated status
        const response = await fetchAPI(API_ENDPOINTS.JOBS.GET(job.id))
        if (response.data) {
          const mapped = mapJobFromBackend(response.data)
          setJob(mapped)
        }
        // Navigate back after successful acceptance
        setTimeout(() => navigate('/my-jobs'), 1500)
      } catch (err) {
        console.error('Job acceptance error:', err)
        alert('İş kabul edilirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'))
      }
    }
  }

  const handleStartNavigation = () => {
    // location may be a plain text address (string) or an object with lat/lng
    const loc = job.location
    let destination
    if (loc && typeof loc === 'object' && loc.lat && loc.lng) {
      destination = `${loc.lat},${loc.lng}`
    } else {
      destination = encodeURIComponent(job.address || loc || '')
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    window.open(url, '_blank')
  }

  const openCamera = (type) => {
    setCameraType(type)
    setShowCamera(true)
  }

  const handleCameraCapture = (dataUrl) => {
    if (cameraType === 'before') {
      setBeforePhotos(prev => [...prev, dataUrl])
    } else {
      setAfterPhotos(prev => [...prev, dataUrl])
    }
  }

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'before') {
          setBeforePhotos(prev => [...prev, reader.result])
        } else {
          setAfterPhotos(prev => [...prev, reader.result])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStartJob = async () => {
    if (beforePhotos.length === 0) {
      alert('Lütfen işe başlamadan önce fotoğraf çekiniz')
      return
    }
    try {
      await startJob(job.id, beforePhotos)
      alert('İş başlatıldı! İyi çalışmalar.')

      // Notify via socket
      emitEvent('job_status_changed', {
        jobId: job.id,
        status: 'in_progress',
        customerId: job.customer?.id,
        professionalId: user?.id
      })

      // Reload job details
      const response = await fetchAPI(API_ENDPOINTS.JOBS.GET(job.id))
      if (response.data) {
        const mapped = mapJobFromBackend(response.data)
        setJob(mapped)
      }
    } catch (err) {
      console.error('Start job error:', err)
      alert('İş başlatılırken hata oluştu: ' + (err.message || 'Bilinmeyen hata'))
    }
  }

  const handleCompleteJob = async () => {
    if (afterPhotos.length === 0) {
      alert('Lütfen iş bitim fotoğrafı çekiniz')
      return
    }
    try {
      await completeJob(job.id, afterPhotos)
      alert('İş tamamlandı! Müşteri değerlendirme yapacak.')

      // Notify via socket
      emitEvent('job_status_changed', {
        jobId: job.id,
        status: 'completed',
        customerId: job.customer?.id,
        professionalId: user?.id
      })

      // Navigate back to professional dashboard
      setTimeout(() => navigate('/professional'), 1500)
    } catch (err) {
      console.error('Complete job error:', err)
      alert('İş tamamlanırken hata oluştu: ' + (err.message || 'Bilinmeyen hata'))
    }
  }

  const handleComplaint = async () => {
    if (!complaintReason) {
      alert('Lütfen bir şikayet nedeni seçin')
      return
    }

    setIsSubmitting(true)

    try {
      // POST complaint via API
      const response = await fetchAPI(`/complaints`, {
        method: 'POST',
        body: {
          jobId: job.id,
          reason: complaintReason,
          details: complaintDetails,
          filedBy: user.id
        }
      })

      if (response.data) {
        alert('Şikayetiniz başarıyla iletildi. Admin tarafından incelenecektir.')
        setShowComplaintModal(false)
        navigate('/my-jobs')
      }
    } catch (err) {
      console.error('Complaint submission error:', err)
      alert(`Hata: ${err.message || 'Şikayet gönderilemedi'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const otherPerson = isProfessional ? job.customer : (job.professional || job.usta)

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />

      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        <h1 className="text-2xl font-black text-white mb-2">{job.title}</h1>
        <div className="flex items-center gap-2 text-white/90">
          <MapPin size={16} />
          {/* job.address is the mapped field (from backend 'location') */}
          <span className="text-sm">{job.address || job.location || 'Adres belirtilmedi'}</span>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Status Badge */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Durum</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              job.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
              job.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
              job.status === 'in_progress' ? 'bg-purple-100 text-purple-600' :
              job.status === 'cancelled' ? 'bg-red-100 text-red-600' :
              'bg-green-100 text-green-600'
            }`}>
              {job.status === 'pending' ? 'Bekliyor' :
               job.status === 'accepted' ? 'Kabul Edildi' :
               job.status === 'in_progress' ? 'Devam Ediyor' :
               job.status === 'cancelled' ? 'Iptal Edildi' :
               job.status === 'rated' ? 'Degerlendirildi' :
               'Tamamlandi'}
            </span>
          </div>
        </div>

        {/* Job Info */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-3">İş Detayları</h3>
          <p className="text-gray-700 mb-4">{job.description}</p>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">Ücret</span>
            {/* job.price is the mapped field (from backend 'budget') */}
            <span className="text-2xl font-black text-green-600">{job.price ?? job.budget ?? 0} TL</span>
          </div>
        </div>

        {/* Other Person Info */}
        {otherPerson && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3">
              {isProfessional ? 'Musteri Bilgileri' : 'Usta Bilgileri'}
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">
                {otherPerson.profileImage ? (
                  <img src={otherPerson.profileImage} alt={otherPerson.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{otherPerson.name}</p>
                {otherPerson.phone && (
                  <a href={`tel:${otherPerson.phone}`} className="flex items-center gap-2 text-blue-600 text-sm mt-1">
                    <Phone size={14} />
                    {otherPerson.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Tracking Button - for customer when job is accepted or in_progress */}
        {isCustomer && (job.status === 'accepted' || job.status === 'in_progress') && job.professional && (
          <button
            onClick={() => navigate(`/track/${job.id}`)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3 relative overflow-hidden"
          >
            <span className="absolute left-4 w-3 h-3 bg-green-400 rounded-full animate-ping" />
            <span className="absolute left-4 w-3 h-3 bg-green-400 rounded-full" />
            <Radio size={22} className="ml-4" />
            Canlı Takip
          </button>
        )}

        {/* Customer uploaded photos */}
        {job.photos?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3">Müşteri Fotoğrafları</h3>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((photo, idx) => (
                <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img src={photo} alt="Müşteri fotoğrafı" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos - Professional View */}
        {(job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed' || job.status === 'rated') && isProfessional && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3">Fotoğraflar</h3>

            {job.status === 'accepted' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Başlangıç Fotografları</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCamera('before')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-xl text-sm font-bold"
                    >
                      <Camera size={16} />
                      Kamera
                    </button>
                    <label className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold cursor-pointer">
                      Dosya
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'before')} />
                    </label>
                  </div>
                </div>
                {beforePhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {beforePhotos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                        <img src={photo} alt="Once" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setBeforePhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Henüz fotoğraf eklenmedi</p>
                )}
              </div>
            )}

            {job.status === 'in_progress' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">İş Bitim Fotografları</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCamera('after')}
                      className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-600 rounded-xl text-sm font-bold"
                    >
                      <Camera size={16} />
                      Kamera
                    </button>
                    <label className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold cursor-pointer">
                      Dosya
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'after')} />
                    </label>
                  </div>
                </div>
                {afterPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {afterPhotos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                        <img src={photo} alt="Sonra" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setAfterPhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Henüz fotoğraf eklenmedi</p>
                )}
              </div>
            )}

            {(job.status === 'completed' || job.status === 'rated') && (
              <div className="space-y-4">
                {job.beforePhotos?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Başlangıç</p>
                    <div className="grid grid-cols-3 gap-2">
                      {job.beforePhotos.map((photo, idx) => (
                        <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                          <img src={photo} alt="Once" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {job.afterPhotos?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Bitim</p>
                    <div className="grid grid-cols-3 gap-2">
                      {job.afterPhotos.map((photo, idx) => (
                        <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                          <img src={photo} alt="Sonra" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Customer photo view */}
        {isCustomer && (job.status === 'completed' || job.status === 'rated') && (job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-3">İş Fotografları</h3>
            <div className="space-y-4">
              {job.beforePhotos?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Baslangıç</p>
                  <div className="grid grid-cols-3 gap-2">
                    {job.beforePhotos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img src={photo} alt="Once" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {job.afterPhotos?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Bitim</p>
                  <div className="grid grid-cols-3 gap-2">
                    {job.afterPhotos.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img src={photo} alt="Sonra" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Professional Actions */}
        {isProfessional && (
          <div className="space-y-3">
            {job.status === 'pending' && (
              <button
                onClick={handleAccept}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition"
              >
                İşi Kabul Et
              </button>
            )}

            {job.status === 'accepted' && (
              <>
                <button
                  onClick={handleStartNavigation}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  <Navigation size={20} />
                  Yola Çık (Google Maps)
                </button>
                <button
                  onClick={handleStartJob}
                  className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition ${
                    beforePhotos.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-xl'
                  }`}
                  disabled={beforePhotos.length === 0}
                >
                  İşe Başla ({beforePhotos.length} fotoğraf)
                </button>
              </>
            )}

            {job.status === 'in_progress' && (
              <button
                onClick={handleCompleteJob}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 ${
                  afterPhotos.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl'
                }`}
                disabled={afterPhotos.length === 0}
              >
                <CheckCircle size={20} />
                İşi Tamamla ({afterPhotos.length} fotoğraf)
              </button>
            )}
          </div>
        )}

        {/* Customer rate */}
        {isCustomer && job.status === 'completed' && !job.rating && (
          <button
            onClick={() => navigate(`/rate/${job.id}`)}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition"
          >
            Değerlendir
          </button>
        )}

        {/* Message Button */}
        {otherPerson && job.status !== 'pending' && job.status !== 'cancelled' && (
          <button
            onClick={() => navigate(`/messages/${job.id}`)}
            className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition"
          >
            Mesaj Gönder
          </button>
        )}

        {/* Cancel Button */}
        {job.status !== 'completed' && job.status !== 'cancelled' && job.status !== 'rated' && (
          <button
            onClick={() => navigate(`/cancel-job/${job.id}`)}
            className="w-full py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition"
          >
            İşi İptal Et
          </button>
        )}

        {/* Complaint Button */}
        {(job.status === 'accepted' || job.status === 'in_progress' || job.status === 'completed') && !job.complaint && (
          <button
            onClick={() => setShowComplaintModal(true)}
            className="w-full py-3 bg-orange-50 border border-orange-200 text-orange-600 rounded-2xl font-bold hover:bg-orange-100 transition"
          >
            Şikayet Et
          </button>
        )}

        {/* Complaint Modal */}
        {showComplaintModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Şikayet Et</h3>
                <button onClick={() => setShowComplaintModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Şikayet Nedeni</label>
                  <div className="space-y-2">
                    {['Geç kaldı', 'İşi yapmıyor', 'Terbiyesiz', 'Farklı bir sorun'].map(reason => (
                      <label key={reason} className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="reason"
                          value={reason}
                          checked={complaintReason === reason}
                          onChange={(e) => setComplaintReason(e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Detaylar (İsteğe bağlı)</label>
                  <textarea
                    value={complaintDetails}
                    onChange={(e) => setComplaintDetails(e.target.value)}
                    placeholder="Detaylı olarak açıklayın..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={4}
                  />
                </div>

                <button
                  onClick={handleComplaint}
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    'Şikayeti Gönder'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobDetailPage
