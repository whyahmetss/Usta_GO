import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Phone, MessageCircle, MapPin, Clock, Navigation, User, Star, CheckCircle } from 'lucide-react'

// Simulated route points (Istanbul streets simulation)
const ROUTE_POINTS = [
  { lat: 41.0082, lng: 28.9784 },
  { lat: 41.0070, lng: 28.9800 },
  { lat: 41.0055, lng: 28.9820 },
  { lat: 41.0040, lng: 28.9845 },
  { lat: 41.0025, lng: 28.9870 },
  { lat: 41.0010, lng: 28.9890 },
  { lat: 40.9995, lng: 28.9910 },
  { lat: 40.9980, lng: 28.9930 },
  { lat: 40.9965, lng: 28.9945 },
  { lat: 40.9950, lng: 28.9960 },
]

const STATUS_STEPS = [
  { key: 'accepted', label: 'Kabul Edildi', icon: '✅' },
  { key: 'on_the_way', label: 'Yola Çıktı', icon: '🚗' },
  { key: 'arrived', label: 'Geldi', icon: '📍' },
  { key: 'in_progress', label: 'İş Başladı', icon: '🔧' },
  { key: 'completed', label: 'Tamamlandı', icon: '🎉' },
]

function LiveTrackingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, jobs, addNotification } = useAuth()

  const job = jobs.find(j => j.id === id)

  const [trackingStatus, setTrackingStatus] = useState('accepted')
  const [currentPointIndex, setCurrentPointIndex] = useState(0)
  const [eta, setEta] = useState(15) // minutes
  const [distance, setDistance] = useState(3.2) // km
  const [arrivedNotified, setArrivedNotified] = useState(false)
  const [fiveMinNotified, setFiveMinNotified] = useState(false)
  const [onWayNotified, setOnWayNotified] = useState(false)
  const mapRef = useRef(null)
  const animationRef = useRef(null)

  // Map the actual job status to tracking status
  useEffect(() => {
    if (!job) return
    if (job.status === 'completed' || job.status === 'rated') {
      setTrackingStatus('completed')
      setEta(0)
      setDistance(0)
    } else if (job.status === 'in_progress') {
      setTrackingStatus('in_progress')
      setEta(0)
      setDistance(0)
    }
  }, [job])

  // Simulate movement - ETA countdown & distance
  useEffect(() => {
    if (trackingStatus === 'completed' || trackingStatus === 'in_progress' || trackingStatus === 'arrived') return

    const interval = setInterval(() => {
      setEta(prev => {
        if (prev <= 0.5) {
          // Arrived!
          setTrackingStatus('arrived')
          setDistance(0)
          if (!arrivedNotified) {
            setArrivedNotified(true)
            // Send arrival notification
            addNotification({
              type: 'tracking',
              title: '🎉 Usta Geldi!',
              message: 'Ustanız kapınızda',
              targetUserId: user?.id,
              jobId: id
            })
          }
          return 0
        }
        // 5 dakika kaldı bildirimi
        if (!fiveMinNotified && prev <= 5 && prev > 4.5) {
          setFiveMinNotified(true)
          addNotification({
            type: 'tracking',
            title: '⏰ Neredeyse Varış',
            message: 'Usta 5 dakika içinde kapınızda olacak',
            targetUserId: user?.id,
            jobId: id
          })
        }
        return Math.round((prev - 0.5) * 10) / 10
      })

      setDistance(prev => {
        if (prev <= 0.1) return 0
        return Math.round((prev - 0.11) * 100) / 100
      })

      setCurrentPointIndex(prev => {
        if (prev < ROUTE_POINTS.length - 1) return prev + 1
        return prev
      })
    }, 30000) // Every 30 seconds

    // Fast initial simulation - move every 3 seconds for demo
    const fastInterval = setInterval(() => {
      if (trackingStatus === 'accepted') {
        setTrackingStatus('on_the_way')
        // Send on_the_way notification
        if (!onWayNotified) {
          setOnWayNotified(true)
          addNotification({
            type: 'tracking',
            title: '🚗 Usta Yola Çıktı',
            message: 'Ustanız yola çıktı, tahmini 15 dakikada varış',
            targetUserId: user?.id,
            jobId: id
          })
        }
      }
      setCurrentPointIndex(prev => {
        if (prev < ROUTE_POINTS.length - 1) return prev + 1
        return prev
      })
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(fastInterval)
    }
  }, [trackingStatus, arrivedNotified, fiveMinNotified, onWayNotified, user?.id, id, addNotification])

  // Draw map simulation on canvas
  useEffect(() => {
    const canvas = mapRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Background - gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h)
    bgGrad.addColorStop(0, '#e8f4fd')
    bgGrad.addColorStop(1, '#dbeafe')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Draw grid (streets)
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1
    for (let i = 0; i < 20; i++) {
      // Horizontal
      ctx.beginPath()
      ctx.moveTo(0, i * (h / 20))
      ctx.lineTo(w, i * (h / 20))
      ctx.stroke()
      // Vertical
      ctx.beginPath()
      ctx.moveTo(i * (w / 20), 0)
      ctx.lineTo(i * (w / 20), h)
      ctx.stroke()
    }

    // Draw some building blocks
    ctx.fillStyle = '#e2e8f0'
    const blocks = [
      [2, 2, 3, 2], [6, 1, 2, 3], [10, 2, 3, 2], [14, 1, 2, 3],
      [1, 5, 2, 3], [5, 6, 3, 2], [9, 5, 2, 3], [13, 6, 3, 2],
      [2, 10, 3, 2], [7, 9, 2, 3], [11, 10, 3, 2], [15, 9, 2, 3],
      [3, 14, 2, 3], [8, 13, 3, 2], [12, 14, 2, 3], [16, 13, 2, 2],
    ]
    blocks.forEach(([gx, gy, gw, gh]) => {
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(gx * (w / 20), gy * (h / 20), gw * (w / 20), gh * (h / 20))
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 0.5
      ctx.strokeRect(gx * (w / 20), gy * (h / 20), gw * (w / 20), gh * (h / 20))
    })

    // Map route points to canvas coordinates
    const padding = 40
    const routeCanvas = ROUTE_POINTS.map((p, i) => ({
      x: padding + (i / (ROUTE_POINTS.length - 1)) * (w - 2 * padding) + Math.sin(i * 1.5) * 30,
      y: padding + 30 + (i / (ROUTE_POINTS.length - 1)) * (h - 2 * padding - 60) + Math.cos(i * 2) * 20,
    }))

    // Draw full route (dashed)
    ctx.setLineDash([8, 6])
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    routeCanvas.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()
    ctx.setLineDash([])

    // Draw traveled route (solid blue)
    if (currentPointIndex > 0) {
      const grad = ctx.createLinearGradient(
        routeCanvas[0].x, routeCanvas[0].y,
        routeCanvas[currentPointIndex].x, routeCanvas[currentPointIndex].y
      )
      grad.addColorStop(0, '#3b82f6')
      grad.addColorStop(1, '#1d4ed8')
      ctx.strokeStyle = grad
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (let i = 0; i <= currentPointIndex && i < routeCanvas.length; i++) {
        if (i === 0) ctx.moveTo(routeCanvas[i].x, routeCanvas[i].y)
        else ctx.lineTo(routeCanvas[i].x, routeCanvas[i].y)
      }
      ctx.stroke()
    }

    // Destination pin
    const dest = routeCanvas[routeCanvas.length - 1]
    // Pin shadow
    ctx.beginPath()
    ctx.ellipse(dest.x, dest.y + 18, 10, 4, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fill()
    // Pin body
    ctx.beginPath()
    ctx.arc(dest.x, dest.y - 8, 14, 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.fill()
    ctx.strokeStyle = '#b91c1c'
    ctx.lineWidth = 2
    ctx.stroke()
    // Pin triangle
    ctx.beginPath()
    ctx.moveTo(dest.x - 8, dest.y + 2)
    ctx.lineTo(dest.x + 8, dest.y + 2)
    ctx.lineTo(dest.x, dest.y + 16)
    ctx.closePath()
    ctx.fillStyle = '#ef4444'
    ctx.fill()
    // Pin center
    ctx.beginPath()
    ctx.arc(dest.x, dest.y - 8, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    // Label
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Is Adresi', dest.x, dest.y + 32)

    // Professional marker (moving)
    const current = routeCanvas[Math.min(currentPointIndex, routeCanvas.length - 1)]
    // Pulse effect
    const pulseSize = 24 + Math.sin(Date.now() / 300) * 4
    ctx.beginPath()
    ctx.arc(current.x, current.y, pulseSize, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'
    ctx.fill()
    // Outer ring
    ctx.beginPath()
    ctx.arc(current.x, current.y, 18, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
    ctx.fill()
    // Main dot
    ctx.beginPath()
    ctx.arc(current.x, current.y, 12, 0, Math.PI * 2)
    const dotGrad = ctx.createRadialGradient(current.x - 3, current.y - 3, 0, current.x, current.y, 12)
    dotGrad.addColorStop(0, '#60a5fa')
    dotGrad.addColorStop(1, '#2563eb')
    ctx.fillStyle = dotGrad
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()
    // Icon inside
    ctx.fillStyle = '#fff'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🔧', current.x, current.y)

    // Request animation frame for pulse effect
    animationRef.current = requestAnimationFrame(() => {
      // Trigger re-render for pulse
    })
  }, [currentPointIndex, trackingStatus])

  // Pulse animation loop
  useEffect(() => {
    let running = true
    const animate = () => {
      if (!running) return
      const canvas = mapRef.current
      if (!canvas) return
      // Re-trigger draw by updating a dummy state
      setCurrentPointIndex(prev => prev) // No-op but triggers re-render
      animationRef.current = requestAnimationFrame(animate)
    }
    // Don't run continuous animation - too heavy. The 3s interval handles updates.
    return () => {
      running = false
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">İş bulunamadı</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
          >
            Geri Dön
          </button>
        </div>
      </div>
    )
  }

  const professional = job.professional
  const currentStep = STATUS_STEPS.findIndex(s => s.key === trackingStatus)

  const formatEta = (minutes) => {
    if (minutes <= 0) return 'Geldi!'
    if (minutes < 1) return '< 1 dk'
    return `${Math.ceil(minutes)} dk`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Map Area */}
      <div className="relative flex-shrink-0">
        {/* Back Button - floating */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>

        {/* Canvas Map */}
        <canvas
          ref={mapRef}
          width={400}
          height={300}
          className="w-full h-56 sm:h-64 md:h-72"
          style={{ imageRendering: 'auto' }}
        />

        {/* ETA Badge - floating on map */}
        {trackingStatus !== 'completed' && trackingStatus !== 'in_progress' && (
          <div className="absolute top-4 right-4 bg-white rounded-2xl shadow-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span className="text-lg font-black text-blue-600">{formatEta(eta)}</span>
            </div>
            {distance > 0 && (
              <p className="text-xs text-gray-500 text-center mt-0.5">{distance.toFixed(1)} km</p>
            )}
          </div>
        )}

        {/* Arrived notification overlay */}
        {trackingStatus === 'arrived' && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <div className="bg-white rounded-3xl shadow-2xl px-8 py-6 text-center mx-4">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-black text-gray-900">Usta Geldi!</h3>
              <p className="text-gray-600 text-sm mt-1">Ustanız kapınızda</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 shadow-2xl overflow-auto">
        <div className="px-5 pt-4 pb-6 space-y-5">
          {/* Handle bar */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />

          {/* Status Progress Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              {STATUS_STEPS.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                    index <= currentStep
                      ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md scale-110'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index <= currentStep ? step.icon : (index + 1)}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-semibold text-center leading-tight ${
                    index <= currentStep ? 'text-blue-700' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress line */}
            <div className="relative h-1.5 bg-gray-200 rounded-full mx-4 mt-1">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* ETA & Distance Cards */}
          {trackingStatus !== 'completed' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-3 text-center text-white shadow-lg">
                <Clock size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-lg font-black">{formatEta(eta)}</p>
                <p className="text-[10px] opacity-75">Tahmini Varış</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-3 text-center text-white shadow-lg">
                <Navigation size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-lg font-black">{distance > 0 ? `${distance.toFixed(1)}` : '0'} km</p>
                <p className="text-[10px] opacity-75">Mesafe</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-3 text-center text-white shadow-lg">
                <MapPin size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-lg font-black">{job.price}</p>
                <p className="text-[10px] opacity-75">TL Ucret</p>
              </div>
            </div>
          )}

          {/* Professional Info */}
          {professional && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-2xl shadow-md">
                  {professional.avatar || '⚡'}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-base">{professional.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {professional.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-semibold text-gray-600">{professional.rating}</span>
                      </div>
                    )}
                    {professional.completedJobs > 0 && (
                      <span className="text-xs text-gray-400">• {professional.completedJobs} is</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {professional.phone && (
                    <a
                      href={`tel:${professional.phone}`}
                      className="w-11 h-11 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center hover:bg-green-100 transition"
                    >
                      <Phone size={18} className="text-green-600" />
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/messages/${job.id}`)}
                    className="w-11 h-11 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center hover:bg-blue-100 transition"
                  >
                    <MessageCircle size={18} className="text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Job Info */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm">{job.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{job.location.address}</p>
                {job.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{job.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Completed state */}
          {trackingStatus === 'completed' && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-black text-gray-900">İş Tamamlandı!</h3>
              <p className="text-sm text-gray-600 mt-1">Usta işinizi başarıyla tamamladı.</p>
              {job.status === 'completed' && !job.rating && user?.role === 'customer' && (
                <button
                  onClick={() => navigate(`/rate/${job.id}`)}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold shadow-lg"
                >
                  Değerlendir
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pb-4">
            <button
              onClick={() => navigate(`/job/${job.id}`)}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              İş Detaylarına Git
            </button>

            {professional?.phone && (
              <a
                href={`tel:${professional.phone}`}
                className="w-full py-3.5 bg-white border-2 border-green-500 text-green-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-50 transition"
              >
                <Phone size={18} />
                Ustayı Ara
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveTrackingPage
