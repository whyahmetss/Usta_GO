import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobFromBackend } from '../utils/fieldMapper'
import { useCapacitorCamera } from '../hooks/useCapacitorCamera'
import { MapPin, Phone, Camera, CheckCircle, Navigation, X, Radio, Navigation2, RefreshCw, User } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { connectSocket, getSocket, emitEvent } from '../utils/socket'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import CarConfirmButton from '../components/CarConfirmButton'

const STORAGE_KEY = (jobId) => `usta_sharing_${jobId}`

// Usta location sharer component
function UstaLocationSharer({ jobId, userId, job }) {
  const [sharing, setSharing] = useState(false)
  const [gpsError, setGpsError] = useState(null)
  const watchIdRef = useRef(null)

  const joinRoom = useCallback(() => {
    const socket = userId ? connectSocket(userId) : getSocket()
    if (socket) {
      if (socket.connected) {
        socket.emit('join_job_room', jobId)
      } else {
        socket.once('connect', () => socket.emit('join_job_room', jobId))
      }
    }
  }, [jobId, userId])

  const startGps = useCallback(() => {
    if (!navigator.geolocation) return
    setGpsError(null)
    joinRoom()
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, heading } = pos.coords
        const sock = getSocket()
        if (sock?.connected) {
          sock.emit('usta_location_update', { jobId, lat, lng, heading: heading || 0 })
        } else {
          // Socket kopuksa yeniden bağlan ve gönder
          joinRoom()
        }
      },
      (err) => {
        console.warn('GPS error:', err.code, err.message)
        if (err.code === 1) setGpsError('Konum izni verilmedi. Tarayıcı ayarlarından izin verin.')
        else if (err.code === 2) setGpsError('Konum alınamadı. GPS sinyali zayıf.')
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    )
  }, [jobId, userId, joinRoom])

  const startSharing = useCallback(() => {
    setSharing(true)
    localStorage.setItem(STORAGE_KEY(jobId), 'true')
    startGps()
  }, [jobId, startGps])

  const stopSharing = useCallback(() => {
    setSharing(false)
    localStorage.removeItem(STORAGE_KEY(jobId))
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    const socket = getSocket()
    if (socket) socket.emit('leave_job_room', jobId)
  }, [jobId])

  const handleNavigate = () => {
    const loc = job?.location
    let destination
    if (loc && typeof loc === 'object' && loc.lat && loc.lng) {
      destination = `${loc.lat},${loc.lng}`
    } else {
      destination = encodeURIComponent(job?.address || (typeof loc === 'string' ? loc : '') || '')
    }
    if (destination) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank')
    }
    // Konum paylaşımını da başlat
    if (!sharing) startSharing()
  }

  // F5/yenileme sonrası otomatik devam et (localStorage daha kalıcı)
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY(jobId)) === 'true') {
      setSharing(true)
      startGps()
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      {/* Yola çık: Maps açar + konum paylaşımını başlatır */}
      <button
        onClick={handleNavigate}
        className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-primary-600 active:scale-[0.98] transition"
      >
        <Navigation size={20} />
        Yola Çık (Google Maps)
      </button>

      {/* Ayrıca sadece konum paylaşım toggle */}
      <button
        onClick={sharing ? stopSharing : startSharing}
        className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 transition active:scale-[0.98] border ${
          sharing
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'bg-white border-gray-200 text-gray-600'
        }`}
      >
        {sharing ? (
          <>
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            Konum Paylaşımını Durdur
          </>
        ) : (
          <>
            <Navigation2 size={16} />
            Sadece Konum Paylaş
          </>
        )}
      </button>

      {gpsError && (
        <p className="text-xs text-red-600 text-center px-2">{gpsError}</p>
      )}
    </div>
  )
}

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
          <div className="mb-4"><Camera size={48} className="text-gray-300" /></div>
          <p className="text-white text-lg mb-6">Fotograf Çek veya Galeriden Seç</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={takePhoto}
              className="px-6 py-3 bg-primary-500 text-white rounded-2xl font-semibold active:scale-[0.98]"
            >
              Kamera ile Çek
            </button>
            <button
              onClick={handleGalleryPick}
              className="px-6 py-3 bg-accent-500 text-white rounded-2xl font-semibold active:scale-[0.98]"
            >
              Galeriden Seç
            </button>
            <button
              onClick={() => { onClose() }}
              className="px-6 py-3 bg-gray-600 text-white rounded-2xl font-semibold active:scale-[0.98]"
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

      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-black/50 backdrop-blur-sm">
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
          <RefreshCw size={18} className="text-white" />
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="mb-4"><Camera size={48} className="text-gray-300" /></div>
          <p className="text-white text-lg mb-4">{error}</p>
          <label className="px-6 py-3 bg-primary-500 text-white rounded-2xl font-semibold cursor-pointer active:scale-[0.98]">
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
            className="mt-4 px-6 py-3 bg-gray-600 text-white rounded-2xl font-semibold active:scale-[0.98]"
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
        <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-black/50 backdrop-blur-sm">
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
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">İş yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-600 mb-4">{error || 'İş bulunamadı'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-primary-500 text-white rounded-2xl font-semibold active:scale-[0.98]"
        >
          Geri Dön
        </button>
      </div>
    )
  }

  const isProfessional = user?.role === 'professional'
  const isCustomer = user?.role === 'customer'

  const handleAccept = async () => {
    if (user?.isActive === false) {
      alert('İş alma durumunuz pasif. Ayarlar > İş Alma Durumu bölümünden açın.')
      return
    }
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

    // Müşteriyi bilgilendir: usta yola çıktı
    const sock = getSocket()
    if (sock) sock.emit('usta_on_the_way', { jobId: job.id, customerId: job.customer?.id })
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
      alert('İş tamamlandı! Müşteri onayı bekleniyor.')

      emitEvent('job_status_changed', {
        jobId: job.id,
        status: 'pending_approval',
        customerId: job.customer?.id,
        professionalId: user?.id
      })

      const response = await fetchAPI(API_ENDPOINTS.JOBS.GET(job.id))
      if (response.data) {
        setJob(mapJobFromBackend(response.data))
      }
    } catch (err) {
      console.error('Complete job error:', err)
      alert('İş tamamlanırken hata oluştu: ' + (err.message || 'Bilinmeyen hata'))
    }
  }

  const handleApproveJob = async () => {
    if (!confirm('İşi onaylıyor musunuz? Onayladığınızda ödeme ustaya aktarılacaktır.')) return
    try {
      const response = await fetchAPI(API_ENDPOINTS.JOBS.APPROVE(job.id), { method: 'PUT' })
      if (response.data) {
        setJob(mapJobFromBackend(response.data))
        
        // 🎉 Confetti + Sound Effect
        fireConfetti()
        playSuccessSound()
        
        alert('İş onaylandı! Ödeme ustaya aktarıldı.')

        emitEvent('job_status_changed', {
          jobId: job.id,
          status: 'completed',
          customerId: user?.id,
          professionalId: job.professional?.id || job.usta?.id
        })
      }
    } catch (err) {
      console.error('Approve job error:', err)
      alert('İş onaylanırken hata oluştu: ' + (err.message || 'Bilinmeyen hata'))
    }
  }

  // 🎉 Confetti Effect Functions
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
      
      // Second tone for "ding" effect
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.value = 1200
        osc2.type = 'sine'
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        osc2.start(audioContext.currentTime)
        osc2.stop(audioContext.currentTime + 0.3)
      }, 100)
    } catch (e) {
      console.log('Sound effect failed:', e)
    }
  }
  
  const fireConfetti = () => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div')
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        pointer-events: none;
        z-index: 9999;
        animation: confetti-fall ${Math.random() * 2 + 2}s ease-out forwards;
      `
      document.body.appendChild(confetti)
      
      setTimeout(() => confetti.remove(), 4000)
    }
    
    // Add CSS animation if not exists
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style')
      style.id = 'confetti-style'
      style.textContent = `
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
  }

  const handleRejectJob = async () => {
    try {
      const response = await fetchAPI(API_ENDPOINTS.JOBS.REJECT(job.id), {
        method: 'PUT',
        body: { reason: rejectReason }
      })
      if (response.data) {
        setJob(mapJobFromBackend(response.data))
        setShowRejectModal(false)
        setRejectReason('')
        alert('İş reddedildi. Usta tekrar çalışacak.')

        emitEvent('job_status_changed', {
          jobId: job.id,
          status: 'in_progress',
          customerId: user?.id,
          professionalId: job.professional?.id || job.usta?.id
        })
      }
    } catch (err) {
      console.error('Reject job error:', err)
      alert('İş reddedilirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'))
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
    <div className="bg-gray-50 pb-6">
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />

      <PageHeader title={job.title} />

      <div className="px-4 py-4 space-y-4">
        {/* Address & Status */}
        <Card padding="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <MapPin size={16} />
            <span className="text-sm">{job.address || job.location || 'Adres belirtilmedi'}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-600">Durum</span>
            <StatusBadge status={job.status} size="md" />
          </div>
        </Card>

        {/* Job Info */}
        <Card padding="p-5">
          <h3 className="font-bold text-gray-900 mb-3">İş Detayları</h3>
          <p className="text-gray-700 mb-4">{job.description}</p>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">Ücret</span>
            <span className="text-2xl font-black text-emerald-600">{job.price ?? job.budget ?? 0} TL</span>
          </div>
        </Card>

        {/* Other Person Info */}
        {otherPerson && (
          <Card padding="p-5">
            <h3 className="font-bold text-gray-900 mb-3">
              {isProfessional ? 'Musteri Bilgileri' : 'Usta Bilgileri'}
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">
                {otherPerson.profileImage ? (
                  <img src={otherPerson.profileImage} alt={otherPerson.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <User size={18} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{otherPerson.name}</p>
                {otherPerson.phone && (
                  <a href={`tel:${otherPerson.phone}`} className="flex items-center gap-2 text-primary-500 text-sm mt-1 hover:text-primary-600">
                    <Phone size={14} />
                    {otherPerson.phone}
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Live Tracking Button - for customer when job is accepted or in_progress */}
        {isCustomer && (job.status === 'accepted' || job.status === 'in_progress') && job.professional && (
          <button
            onClick={() => navigate(`/track/${job.id}`)}
            className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-3 relative overflow-hidden hover:bg-primary-600 active:scale-[0.98] transition"
          >
            <span className="absolute left-4 w-3 h-3 bg-green-400 rounded-full animate-ping" />
            <span className="absolute left-4 w-3 h-3 bg-green-400 rounded-full" />
            <Radio size={22} className="ml-4" />
            Canlı Takip
          </button>
        )}

        {/* Location Share Button - for usta when job is accepted or in_progress */}
        {!isCustomer && (job.status === 'accepted' || job.status === 'in_progress') && (
          <UstaLocationSharer jobId={job.id} userId={user?.id} job={job} />
        )}

        {/* Customer uploaded photos */}
        {job.photos?.length > 0 && (
          <Card padding="p-5">
            <h3 className="font-bold text-gray-900 mb-3">Müşteri Fotoğrafları</h3>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((photo, idx) => (
                <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img src={photo} alt="Müşteri fotoğrafı" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Photos - Professional View */}
        {(job.status === 'accepted' || job.status === 'in_progress' || job.status === 'pending_approval' || job.status === 'completed' || job.status === 'rated') && isProfessional && (
          <Card padding="p-5">
            <h3 className="font-bold text-gray-900 mb-3">Fotoğraflar</h3>

            {job.status === 'accepted' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Başlangıç Fotografları</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCamera('before')}
                      className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-600 rounded-2xl text-sm font-semibold active:scale-[0.98]"
                    >
                      <Camera size={16} />
                      Kamera
                    </button>
                    <label className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-2xl text-sm font-semibold cursor-pointer active:scale-[0.98]">
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
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-600 rounded-2xl text-sm font-semibold active:scale-[0.98]"
                    >
                      <Camera size={16} />
                      Kamera
                    </button>
                    <label className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-2xl text-sm font-semibold cursor-pointer active:scale-[0.98]">
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

            {(job.status === 'pending_approval' || job.status === 'completed' || job.status === 'rated') && (
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
          </Card>
        )}

        {/* Customer photo view */}
        {isCustomer && (job.status === 'pending_approval' || job.status === 'completed' || job.status === 'rated') && (job.beforePhotos?.length > 0 || job.afterPhotos?.length > 0) && (
          <Card padding="p-5">
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
          </Card>
        )}

        {/* Professional Actions */}
        {isProfessional && (
          <div className="space-y-3">
            {job.status === 'pending' && (() => {
              const myOffer = job.offers?.find(o => (o.ustaId || o.usta?.id) === user?.id && (o.status === 'PENDING' || o.status === 'pending'))
              return (
                <>
                  {myOffer && (
                    <button
                      onClick={async () => {
                        if (!confirm('Teklifinizi geri çekmek istediğinize emin misiniz?')) return
                        try {
                          await fetchAPI(API_ENDPOINTS.OFFERS.WITHDRAW(myOffer.id), { method: 'PATCH' })
                          const res = await fetchAPI(API_ENDPOINTS.JOBS.GET(id))
                          if (res.data) setJob(mapJobFromBackend(res.data))
                          alert('Teklifiniz geri alındı.')
                        } catch (err) {
                          alert('Teklif geri alınamadı: ' + (err.message || 'Hata'))
                        }
                      }}
                      className="w-full py-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 active:scale-[0.98] transition"
                    >
                      Teklifi Geri Al
                    </button>
                  )}
                  <button
                    onClick={handleAccept}
                    disabled={user?.isActive === false}
                    className={`w-full py-4 rounded-2xl font-semibold text-base transition active:scale-[0.98] ${
                      user?.isActive === false
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-accent-500 text-white hover:bg-accent-600'
                    }`}
                  >
                    {user?.isActive === false ? 'İş Alma Kapalı (Ayarlar > İş Alma Durumu)' : 'İşi Kabul Et'}
                  </button>
                </>
              )
            })()}

            {job.status === 'accepted' && (
              <button
                onClick={handleStartJob}
                className={`w-full py-4 rounded-2xl font-semibold text-base transition active:scale-[0.98] ${
                  beforePhotos.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
                disabled={beforePhotos.length === 0}
              >
                İşe Başla ({beforePhotos.length} fotoğraf)
              </button>
            )}

            {job.status === 'in_progress' && (
              <button
                onClick={handleCompleteJob}
                className={`w-full py-4 rounded-2xl font-semibold text-base transition flex items-center justify-center gap-2 active:scale-[0.98] ${
                  afterPhotos.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-accent-500 text-white hover:bg-accent-600'
                }`}
                disabled={afterPhotos.length === 0}
              >
                <CheckCircle size={20} />
                İşi Tamamla ({afterPhotos.length} fotoğraf)
              </button>
            )}

            {job.status === 'pending_approval' && (
              <div className="w-full py-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-2xl text-center font-semibold">
                Müşteri onayı bekleniyor...
              </div>
            )}
          </div>
        )}

        {/* Customer approve/reject for pending_approval */}
        {isCustomer && job.status === 'pending_approval' && (
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <p className="text-orange-800 font-semibold text-center mb-1">Usta işi tamamladı!</p>
              <p className="text-orange-600 text-sm text-center">Fotoğrafları kontrol edip işi onaylayın veya reddedin.</p>
            </div>
            <CarConfirmButton
              label="İşi Onayla"
              onConfirm={handleApproveJob}
            />
            <button
              onClick={() => setShowRejectModal(true)}
              className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl font-semibold hover:bg-rose-100 active:scale-[0.98] transition"
            >
              İşi Reddet
            </button>
          </div>
        )}

        {/* Customer rate - animated car confirm button */}
        {isCustomer && job.status === 'completed' && !job.rating && (
          <CarConfirmButton
            label="Değerlendir"
            onConfirm={() => navigate(`/rate/${job.id}`)}
          />
        )}

        {/* Message Button */}
        {otherPerson && job.status !== 'pending' && job.status !== 'cancelled' && (
          <button
            onClick={() => navigate(`/messages/${job.id}`)}
            className="w-full py-4 bg-white border-2 border-primary-500 text-primary-600 rounded-2xl font-semibold text-base hover:bg-primary-50 active:scale-[0.98] transition"
          >
            Mesaj Gönder
          </button>
        )}

        {/* Cancel Button */}
        {job.status !== 'completed' && job.status !== 'cancelled' && job.status !== 'rated' && job.status !== 'pending_approval' && (
          <button
            onClick={() => navigate(`/cancel-job/${job.id}`)}
            className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl font-semibold hover:bg-rose-100 active:scale-[0.98] transition"
          >
            İşi İptal Et
          </button>
        )}

        {/* Complaint Button */}
        {(job.status === 'accepted' || job.status === 'in_progress' || job.status === 'pending_approval' || job.status === 'completed') && !job.complaint && (
          <button
            onClick={() => setShowComplaintModal(true)}
            className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl font-semibold hover:bg-amber-100 active:scale-[0.98] transition"
          >
            Şikayet Et
          </button>
        )}

        {/* Complaint Modal */}
        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">İşi Reddet</h3>
                <button onClick={() => { setShowRejectModal(false); setRejectReason('') }} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Red Sebebi</label>
                  <div className="space-y-2">
                    {['İş düzgün yapılmamış', 'Eksik bırakılmış', 'Kalitesiz iş', 'Farklı bir sorun'].map(reason => (
                      <label key={reason} className="flex items-center p-3 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="rejectReason"
                          value={reason}
                          checked={rejectReason === reason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleRejectJob}
                  disabled={!rejectReason}
                  className={`w-full py-3 rounded-2xl font-semibold transition active:scale-[0.98] ${
                    !rejectReason
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  }`}
                >
                  Reddi Onayla
                </button>
              </div>
            </div>
          </div>
        )}

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
                      <label key={reason} className="flex items-center p-3 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50">
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
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={4}
                  />
                </div>

                <button
                  onClick={handleComplaint}
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-2xl font-semibold transition flex items-center justify-center gap-2 active:scale-[0.98] ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
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
