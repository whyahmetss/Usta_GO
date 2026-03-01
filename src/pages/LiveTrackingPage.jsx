import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, Marker, Polyline, OverlayView } from '@react-google-maps/api'
import { useAuth } from '../context/AuthContext'
import { useMaps } from '../context/MapsContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { getSocket } from '../utils/socket'
import { ArrowLeft, Phone, MessageCircle, MapPin, Clock, Navigation, Star, CheckCircle } from 'lucide-react'

const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fafafa' }] },
  { featureType: 'landscape', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'water', stylers: [{ color: '#c9e8f5' }] },
]

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: 'cooperative',
  styles: MAP_STYLES,
}

const DEFAULT_CENTER = { lat: 41.0370, lng: 28.9850 }

function lerp(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

function calcBearing(from, to) {
  const dLng = (to.lng - from.lng) * (Math.PI / 180)
  const lat1 = from.lat * (Math.PI / 180)
  const lat2 = to.lat * (Math.PI / 180)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// Simülasyon rotası — gerçek GPS yoksa kullanılır
function buildSimRoute(destination) {
  const startLat = destination.lat + 0.027
  const startLng = destination.lng - 0.006
  const STEPS = 12
  const points = []
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS
    const curve = Math.sin(t * Math.PI) * 0.002
    points.push({
      lat: startLat + (destination.lat - startLat) * t,
      lng: startLng + (destination.lng - startLng) * t + curve,
    })
  }
  return points
}

const STATUS_STEPS = [
  { key: 'accepted', label: 'Kabul', icon: '✅' },
  { key: 'on_the_way', label: 'Yolda', icon: '🚗' },
  { key: 'arrived', label: 'Geldi', icon: '📍' },
  { key: 'in_progress', label: 'Başladı', icon: '🔧' },
  { key: 'completed', label: 'Bitti', icon: '🎉' },
]

function LiveTrackingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, jobs, addNotification } = useAuth()

  const [job, setJob] = useState(() => jobs.find(j => j.id === id) || null)
  const [jobLoading, setJobLoading] = useState(!job)

  const [trackingStatus, setTrackingStatus] = useState('accepted')
  // null = usta GPS paylaşmadı, marker gösterilmez
  const [markerPos, setMarkerPos] = useState(null)
  const [targetPos, setTargetPos] = useState(null)
  const [routePath, setRoutePath] = useState([])
  const [bearing, setBearing] = useState(0)
  const [eta, setEta] = useState(null)
  const [distance, setDistance] = useState(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [isRealGps, setIsRealGps] = useState(false)
  const [destinationReady, setDestinationReady] = useState(false)

  // Directions API sokak rotası
  const [realRoutePoints, setRealRoutePoints] = useState([])

  // Geocoding sonrası müşteri adresinin koordinatı
  const [destination, setDestination] = useState(DEFAULT_CENTER)

  const mapRef = useRef(null)
  const animFrameRef = useRef(null)
  const animFromRef = useRef(null)
  const animToRef = useRef(null)
  const animStartRef = useRef(null)
  const notifiedRef = useRef({ arrived: false, fiveMin: false, onWay: false })
  const directionsServiceRef = useRef(null)
  const lastDirectionsFetchRef = useRef(0)
  const destinationRef = useRef(DEFAULT_CENTER)

  const { isLoaded, loadError } = useMaps()

  // ── Fetch job ─────────────────────────────────────────────────────
  useEffect(() => {
    if (job) return
    const load = async () => {
      try {
        const res = await fetchAPI(API_ENDPOINTS.JOBS.GET(id))
        if (res?.data) setJob(res.data)
      } catch {
        // job stays null
      } finally {
        setJobLoading(false)
      }
    }
    load()
  }, [id, job])

  // ── Job durum → tracking status ───────────────────────────────────
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

    // Object {lat,lng} konumlar için
    if (job.location && typeof job.location === 'object' && job.location.lat && job.location.lng) {
      const dest = { lat: Number(job.location.lat), lng: Number(job.location.lng) }
      applyDestination(dest)
    }
  }, [job])

  // Sadece müşteri adresini/haritayı ayarlar — usta marker'ı DOKUNMAZ
  const applyDestination = useCallback((dest) => {
    destinationRef.current = dest
    setDestination(dest)
    setMapCenter(dest)
    setDestinationReady(true)
  }, [])

  // ── Geocoding: string adres → gerçek koordinat ────────────────────
  useEffect(() => {
    if (!isLoaded || !job) return
    const loc = job.location
    // Sadece string adres varsa geocode et
    if (!loc || typeof loc !== 'string' || !loc.trim()) return

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: loc }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const pos = results[0].geometry.location
        applyDestination({ lat: pos.lat(), lng: pos.lng() })
      } else {
        // Geocoding başarısız → DEFAULT_CENTER ile başla
        applyDestination(DEFAULT_CENTER)
      }
    })
  }, [isLoaded, job, applyDestination])

  // ── Directions API: gerçek sokak rotası ───────────────────────────
  const fetchDirectionsRoute = useCallback((origin, dest) => {
    if (!window.google?.maps?.DirectionsService) return
    const now = Date.now()
    if (now - lastDirectionsFetchRef.current < 20000) return // 20 saniyede bir yenile
    lastDirectionsFetchRef.current = now

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService()
    }

    directionsServiceRef.current.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result.routes[0]) {
          const route = result.routes[0]
          const leg = route.legs[0]
          // Genel rota noktalarını al
          const points = route.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }))
          setRealRoutePoints(points)
          // ETA ve mesafeyi API'den al
          setEta(Math.ceil(leg.duration.value / 60))
          setDistance(Math.round(leg.distance.value / 100) / 10)
        }
      }
    )
  }, [])

  // ── Smooth animation engine ─────────────────────────────────────
  const animateTo = useCallback((newTarget) => {
    if (!newTarget) return
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    const from = animFromRef.current ?? newTarget
    animFromRef.current = from
    animToRef.current = newTarget
    animStartRef.current = performance.now()
    const DURATION = 2000

    const step = (now) => {
      const elapsed = now - animStartRef.current
      const t = Math.min(elapsed / DURATION, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const pos = lerp(animFromRef.current, animToRef.current, eased)
      setMarkerPos(pos)
      setRoutePath(prev => [...prev.slice(-50), pos])
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step)
      }
    }
    animFrameRef.current = requestAnimationFrame(step)
    setBearing(calcBearing(from, newTarget))
  }, [markerPos])

  useEffect(() => {
    if (!targetPos) return
    animateTo(targetPos)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPos])

  // ── Gerçek GPS gelince Directions API çek ────────────────────────
  useEffect(() => {
    if (!isRealGps || !isLoaded) return
    fetchDirectionsRoute(targetPos, destinationRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPos, isRealGps, isLoaded])

  // ── Socket.IO: usta'dan gerçek GPS al ────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.emit('join_job_room', id)

    const onLocation = (data) => {
      if (data.lat && data.lng) {
        const newPos = { lat: data.lat, lng: data.lng }
        // İlk GPS gelişinde animFrom'u aynı noktaya set et (zıplama olmasın)
        if (!isRealGps) {
          animFromRef.current = newPos
          setMarkerPos(newPos)
          setIsRealGps(true)
        }
        setTargetPos(newPos)
        if (data.heading !== undefined) setBearing(data.heading)
        // Haritayı usta + müşteri adresini birlikte gösterecek şekilde ayarla
        if (mapRef.current && destinationRef.current) {
          const bounds = new window.google.maps.LatLngBounds()
          bounds.extend(newPos)
          bounds.extend(destinationRef.current)
          mapRef.current.fitBounds(bounds, { top: 80, bottom: 200, left: 40, right: 40 })
        }
      }
    }
    socket.on('location_updated', onLocation)

    return () => {
      socket.off('location_updated', onLocation)
      socket.emit('leave_job_room', id)
    }
  }, [id])

  // Simülasyon kaldırıldı — usta marker'ı sadece gerçek GPS ile gösterilir

  // ── Usta ikonu ──────────────────────────────────────────────────
  const ustaIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g transform="rotate(${bearing}, 24, 24)" filter="url(#shadow)">
        <circle cx="24" cy="24" r="20" fill="#2563eb" opacity="0.15"/>
        <circle cx="24" cy="24" r="14" fill="#2563eb"/>
        <circle cx="24" cy="24" r="12" fill="#1d4ed8"/>
        <path d="M24 10 L30 22 L24 19 L18 22 Z" fill="white"/>
        <text x="24" y="30" text-anchor="middle" font-size="10" fill="white">👷</text>
      </g>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#2563eb" stroke-width="2" opacity="0.4"/>
    </svg>
  `

  const ustaIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(ustaIconSvg)}`,
    scaledSize: new window.google.maps.Size(48, 48),
    anchor: new window.google.maps.Point(24, 24),
  } : null

  const destIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#ef4444"/>
        <circle cx="18" cy="18" r="8" fill="white"/>
        <circle cx="18" cy="18" r="5" fill="#ef4444"/>
      </svg>
    `)}`,
    scaledSize: new window.google.maps.Size(36, 44),
    anchor: new window.google.maps.Point(18, 44),
  } : null

  // destination artık state'te tutuluyor (geocoding sonrası güncellenir)

  const currentStep = STATUS_STEPS.findIndex(s => s.key === trackingStatus)

  const formatEta = (m) => {
    if (m === null) return '...'
    if (m <= 0) return 'Geldi!'
    if (m < 1) return '< 1 dk'
    return `${Math.ceil(m)} dk`
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">İş bulunamadı</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">
            Geri Dön
          </button>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <p className="text-red-500 font-bold mb-2">Harita yüklenemedi</p>
          <p className="text-gray-500 text-sm mb-4">Google Maps API key eksik veya hatalı.</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">
            Geri Dön
          </button>
        </div>
      </div>
    )
  }

  const professional = job.professional || job.usta

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── MAP ─────────────────────────────────────────────────────── */}
      <div className="relative" style={{ height: '55vh' }}>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>

        {/* GPS canlı rozeti */}
        {isRealGps && (
          <div className="absolute top-4 left-16 z-20 flex items-center gap-1.5 bg-white rounded-full shadow-md px-3 py-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-600">Canlı GPS</span>
          </div>
        )}

        {/* ETA rozeti */}
        {trackingStatus !== 'completed' && trackingStatus !== 'in_progress' && (
          <div className="absolute top-4 right-4 z-20 bg-white rounded-2xl shadow-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span className="text-lg font-black text-blue-600">{formatEta(eta)}</span>
            </div>
            {distance !== null && distance > 0 && (
              <p className="text-xs text-gray-500 text-center mt-0.5">{distance.toFixed(1)} km</p>
            )}
          </div>
        )}

        {trackingStatus === 'arrived' && (
          <div className="absolute inset-0 z-20 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl px-8 py-6 text-center mx-4">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-black text-gray-900">Usta Geldi!</h3>
              <p className="text-gray-600 text-sm mt-1">Ustanız kapınızda</p>
            </div>
          </div>
        )}

        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={14}
            options={MAP_OPTIONS}
            onLoad={(map) => { mapRef.current = map }}
          >
            {/* Geçilen yol (mavi solid) */}
            {routePath.length > 1 && (
              <Polyline
                path={routePath}
                options={{
                  strokeColor: '#2563eb',
                  strokeOpacity: 0.85,
                  strokeWeight: 5,
                  geodesic: true,
                }}
              />
            )}

            {/* Gerçek GPS varsa → Directions API sokak rotası (gri kesikli) */}
            {isRealGps && realRoutePoints.length > 1 && (
              <Polyline
                path={realRoutePoints}
                options={{
                  strokeColor: '#64748b',
                  strokeOpacity: 0.6,
                  strokeWeight: 4,
                  geodesic: true,
                }}
              />
            )}

            {/* GPS yoksa → simülasyon rotası (gri kesikli) */}
            {!isRealGps && simIndexRef.current < simRouteRef.current.length - 1 && (
              <Polyline
                path={simRouteRef.current.slice(simIndexRef.current)}
                options={{
                  strokeColor: '#94a3b8',
                  strokeOpacity: 0.5,
                  strokeWeight: 3,
                  geodesic: true,
                }}
              />
            )}

            {/* Usta marker — sadece pozisyon hazırsa göster */}
            {ustaIcon && markerPos && (
              <Marker
                position={markerPos}
                icon={ustaIcon}
                zIndex={10}
              />
            )}

            {/* Hedef marker */}
            {destIcon && destinationReady && (
              <Marker
                position={destination}
                icon={destIcon}
                zIndex={5}
              />
            )}

            {/* Pulse ring */}
            {markerPos && (
              <OverlayView
                position={markerPos}
                mapPaneName={OverlayView.OVERLAY_LAYER}
              >
                <div
                  className="rounded-full border-4 border-blue-400 animate-ping opacity-40 pointer-events-none"
                  style={{ width: 56, height: 56, marginLeft: -28, marginTop: -28 }}
                />
              </OverlayView>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-blue-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET ────────────────────────────────────────────── */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 shadow-2xl overflow-auto">
        <div className="px-5 pt-4 pb-8 space-y-4">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />

          {/* Status adımları */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              {STATUS_STEPS.map((step, i) => (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                    i <= currentStep
                      ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md scale-110'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i <= currentStep ? step.icon : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-semibold text-center leading-tight ${
                    i <= currentStep ? 'text-blue-700' : 'text-gray-400'
                  }`}>{step.label}</span>
                </div>
              ))}
            </div>
            <div className="relative h-1.5 bg-gray-200 rounded-full mx-4">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-700"
                style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* ETA kartları */}
          {trackingStatus !== 'completed' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-3 text-center text-white shadow-lg">
                <Clock size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-lg font-black">{formatEta(eta)}</p>
                <p className="text-[10px] opacity-75">Tahmini Varış</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-3 text-center text-white shadow-lg">
                <Navigation size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-lg font-black">{distance !== null && distance > 0 ? distance.toFixed(1) : '...'} km</p>
                <p className="text-[10px] opacity-75">Mesafe</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-3 text-center text-white shadow-lg">
                <MapPin size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-lg font-black">{job.budget || job.price || '-'}</p>
                <p className="text-[10px] opacity-75">TL Ücret</p>
              </div>
            </div>
          )}

          {/* Usta bilgisi */}
          {professional && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-2xl shadow-md overflow-hidden shrink-0">
                  {professional.profileImage
                    ? <img src={professional.profileImage} alt="" className="w-full h-full object-cover" />
                    : '⚡'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900">{professional.name}</h4>
                  {professional.ratings > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold text-gray-600">{Number(professional.ratings).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {professional.phone && (
                    <a href={`tel:${professional.phone}`}
                      className="w-11 h-11 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
                      <Phone size={18} className="text-green-600" />
                    </a>
                  )}
                  <button onClick={() => navigate(`/messages/${job.id}`)}
                    className="w-11 h-11 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
                    <MessageCircle size={18} className="text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* İş adresi */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm">{job.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {typeof job.location === 'string' ? job.location : job.location?.address || job.address || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Tamamlandı */}
          {trackingStatus === 'completed' && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-black text-gray-900">İş Tamamlandı!</h3>
              <p className="text-sm text-gray-600 mt-1">Usta işinizi başarıyla tamamladı.</p>
              {job.status === 'completed' && !job.rating && user?.role === 'customer' && (
                <button onClick={() => navigate(`/rate/${job.id}`)}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold shadow-lg">
                  Değerlendir
                </button>
              )}
            </div>
          )}

          {/* Aksiyonlar */}
          <div className="space-y-3 pb-2">
            <button onClick={() => navigate(`/job/${job.id}`)}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2">
              <CheckCircle size={18} />
              İş Detaylarına Git
            </button>
            {professional?.phone && (
              <a href={`tel:${professional.phone}`}
                className="w-full py-3.5 bg-white border-2 border-green-500 text-green-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
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
