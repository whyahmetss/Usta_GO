import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Phone, MessageSquare, MapPin, Clock, Navigation, CheckCircle } from 'lucide-react'

function LiveTrackingPage() {
  const { id } = useParams()
  const { user, jobs } = useAuth()
  const navigate = useNavigate()

  const job = jobs.find(j => j.id === id)

  const isProfessional = user?.role === 'professional'
  const isCustomer = user?.role === 'customer'

  // ETA state - simulated countdown
  const [etaMinutes, setEtaMinutes] = useState(15)
  const [progress, setProgress] = useState(0)
  const [arrived, setArrived] = useState(false)
  const [showArrivedNotification, setShowArrivedNotification] = useState(false)

  // Simulated location updates
  const [currentStep, setCurrentStep] = useState(0)
  const steps = [
    { label: 'Yola çıktı', icon: '🚗', time: '0 dk önce' },
    { label: 'Yolda', icon: '🛣️', time: '' },
    { label: 'Yaklaşıyor', icon: '📍', time: '' },
    { label: 'Geldi!', icon: '✅', time: '' }
  ]

  // ETA countdown simulation
  useEffect(() => {
    if (arrived) return

    const interval = setInterval(() => {
      setEtaMinutes(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setArrived(true)
          setShowArrivedNotification(true)
          setCurrentStep(3)
          setProgress(100)
          return 0
        }
        return prev - 1
      })

      setProgress(prev => {
        const newProgress = Math.min(prev + (100 / 15), 100)
        // Update steps based on progress
        if (newProgress > 25 && newProgress <= 60) {
          setCurrentStep(1)
        } else if (newProgress > 60 && newProgress < 100) {
          setCurrentStep(2)
        }
        return newProgress
      })
    }, 3000) // Her 3 saniyede 1 dakika azalır (demo için hızlandırılmış)

    return () => clearInterval(interval)
  }, [arrived])

  // "Geldi" bildirimi auto-dismiss
  useEffect(() => {
    if (showArrivedNotification) {
      const timer = setTimeout(() => {
        setShowArrivedNotification(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showArrivedNotification])

  const handleArrived = () => {
    setArrived(true)
    setShowArrivedNotification(true)
    setCurrentStep(3)
    setProgress(100)
    setEtaMinutes(0)
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">İş bulunamadı</p>
      </div>
    )
  }

  const otherPerson = isProfessional ? job.customer : job.professional

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* "Geldi" Bildirim Overlay */}
      {showArrivedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 mx-6 shadow-2xl text-center animate-bounce-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              {isProfessional ? 'Hedefe Ulaştınız!' : 'Usta Geldi!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isProfessional
                ? 'Müşteriye bildirim gönderildi.'
                : `${otherPerson?.name || 'Usta'} kapınızda!`}
            </p>
            <button
              onClick={() => {
                setShowArrivedNotification(false)
                navigate(`/job/${id}`)
              }}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg"
            >
              İş Detayına Git
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Canlı Takip</h1>
          <div className="w-10" />
        </div>

        {/* ETA Card */}
        <div className="bg-white/20 backdrop-blur rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-white" />
              <span className="text-white/80 text-sm font-semibold">Tahmini Varış</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              arrived
                ? 'bg-green-500 text-white'
                : etaMinutes <= 5
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/30 text-white'
            }`}>
              {arrived ? 'Ulaştı' : etaMinutes <= 5 ? 'Yakında' : 'Yolda'}
            </div>
          </div>

          <div className="text-center mb-4">
            {arrived ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={32} className="text-green-300" />
                <span className="text-4xl font-black text-white">Geldi!</span>
              </div>
            ) : (
              <>
                <span className="text-5xl font-black text-white">{etaMinutes}</span>
                <span className="text-xl text-white/80 ml-2">dakika</span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Map Simulation */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative h-56 bg-gradient-to-br from-blue-100 to-blue-200">
            {/* Simulated Map */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Road Path */}
              <svg width="100%" height="100%" viewBox="0 0 300 200" className="absolute inset-0">
                <path
                  d="M 40 160 Q 100 120 150 100 Q 200 80 260 40"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="12 6"
                />
                <path
                  d="M 40 160 Q 100 120 150 100 Q 200 80 260 40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: '300',
                    strokeDashoffset: `${300 - (progress / 100) * 300}`
                  }}
                />
              </svg>

              {/* Start Point - Professional */}
              <div className="absolute bottom-6 left-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-lg">🏠</span>
                </div>
                <p className="text-[10px] font-bold text-blue-800 mt-1 text-center">Başlangıç</p>
              </div>

              {/* Moving Professional Marker */}
              <div
                className="absolute transition-all duration-1000 ease-out"
                style={{
                  bottom: `${20 + (progress / 100) * 55}%`,
                  left: `${12 + (progress / 100) * 68}%`
                }}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-xl border-3 border-white animate-pulse">
                    <span className="text-xl">🚗</span>
                  </div>
                  {!arrived && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                      {etaMinutes} dk
                    </div>
                  )}
                </div>
              </div>

              {/* Destination - Customer */}
              <div className="absolute top-4 right-6">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin size={20} className="text-white" />
                </div>
                <p className="text-[10px] font-bold text-red-800 mt-1 text-center">Hedef</p>
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Hedef Konum</p>
                <p className="font-bold text-gray-900 text-sm">{job.location?.address || 'Kadıköy, İstanbul'}</p>
              </div>
              <button
                onClick={() => {
                  const { lat, lng } = job.location || { lat: 40.9929, lng: 29.0260 }
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
                }}
                className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"
              >
                <Navigation size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Steps */}
      <div className="px-4 py-2">
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4">Yolculuk Durumu</h3>
          <div className="space-y-0">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    idx <= currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {idx <= currentStep ? step.icon : idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 h-8 ${
                      idx < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <p className={`font-bold text-sm ${
                    idx <= currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {idx === currentStep && !arrived && (
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">Şu an burada</p>
                  )}
                  {idx === 3 && arrived && (
                    <p className="text-xs text-green-600 font-semibold mt-0.5">Hedefe ulaşıldı!</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Other Person Info */}
      {otherPerson && (
        <div className="px-4 py-2">
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl">
                {otherPerson.avatar || '👤'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{otherPerson.name}</p>
                <p className="text-sm text-gray-600">
                  {isProfessional ? 'Müşteri' : 'Usta'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {otherPerson.phone && (
                  <a
                    href={`tel:${otherPerson.phone}`}
                    className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"
                  >
                    <Phone size={20} className="text-green-600" />
                  </a>
                )}
                <button
                  onClick={() => navigate(`/messages/${id}`)}
                  className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"
                >
                  <MessageSquare size={20} className="text-blue-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional: "Geldim" Button */}
      {isProfessional && !arrived && (
        <div className="px-4 py-4">
          <button
            onClick={handleArrived}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <CheckCircle size={24} />
            Geldim - Müşteriyi Bilgilendir
          </button>
        </div>
      )}

      {/* After Arrival Actions */}
      {arrived && (
        <div className="px-4 py-4 space-y-3">
          <button
            onClick={() => navigate(`/job/${id}`)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition"
          >
            İş Detayına Git
          </button>
        </div>
      )}
    </div>
  )
}

export default LiveTrackingPage
