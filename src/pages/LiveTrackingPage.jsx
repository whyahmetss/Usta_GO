import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobFromBackend } from '../utils/fieldMapper'
import { getSocket } from '../utils/socket'
import { ArrowLeft, Phone, MessageCircle, MapPin, Clock, Navigation, Star, CheckCircle } from 'lucide-react'

const DEFAULT_CENTER = [41.0082, 28.9784]

// ── Yardımcı fonksiyonlar ────────────────────────────────────────────
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

const STATUS_STEPS = [
  { key: 'accepted',    label: 'Kabul',  icon: '✅' },
  { key: 'on_the_way',  label: 'Yolda',  icon: '🚗' },
  { key: 'arrived',     label: 'Geldi',  icon: '📍' },
  { key: 'in_progress', label: 'Başladı',icon: '🔧' },
  { key: 'completed',   label: 'Bitti',  icon: '🎉' },
]

// ── Leaflet custom ikonlar ───────────────────────────────────────────
function makeUstaIcon(bearing) {
  return L.divIcon({
    className: '',
    iconSize:   [52, 52],
    iconAnchor: [26, 26],
    html: `
      <div style="position:relative;width:52px;height:52px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          border:3px solid #f97316;opacity:0.45;
          animation:usta-ping 1.4s ease-out infinite;
        "></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 48 48"
             style="position:absolute;inset:0">
          <defs>
            <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3"
              flood-color="#000" flood-opacity="0.25"/></filter>
          </defs>
          <circle cx="24" cy="24" r="22" fill="#f97316" filter="url(#sh)"/>
          <circle cx="24" cy="24" r="19" fill="#ea580c"/>
          <path d="M13 26 Q13 15 24 14 Q35 15 35 26Z" fill="white"/>
          <rect x="11" y="26" width="26" height="4" rx="2" fill="white"/>
          <path d="M24 5 L28 13 L24 11 L20 13 Z" fill="white" opacity="0.9"
                transform="rotate(${bearing},24,24)"/>
        </svg>
      </div>`,
  })
}

const DEST_ICON = L.divIcon({
  className: '',
  iconSize:   [36, 44],
  iconAnchor: [18, 44],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#ef4444"/>
    <circle cx="18" cy="18" r="8" fill="white"/>
    <circle cx="18" cy="18" r="5" fill="#ef4444"/>
  </svg>`,
})

// ── Haritayı programatik kontrol eden iç bileşen ────────────────────
function MapRef({ mapRef }) {
  mapRef.current = useMap()
  return null
}

// ── Ana bileşen ──────────────────────────────────────────────────────
function LiveTrackingPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user, jobs, addNotification } = useAuth()

  const [job,            setJob]            = useState(() => jobs.find(j => j.id === id) || null)
  const [jobLoading,     setJobLoading]     = useState(!job)
  const [trackingStatus, setTrackingStatus] = useState('accepted')
  const [markerPos,      setMarkerPos]      = useState(null)  // { lat, lng }
  const [targetPos,      setTargetPos]      = useState(null)
  const [routePath,      setRoutePath]      = useState([])    // trail [ {lat,lng} ]
  const [bearing,        setBearing]        = useState(0)
  const [eta,            setEta]            = useState(null)
  const [distance,       setDistance]       = useState(null)
  const [isRealGps,      setIsRealGps]      = useState(false)
  const [destination,    setDestination]    = useState(null)  // { lat, lng }
  const [destinationReady, setDestinationReady] = useState(false)
  const [realRoutePoints,  setRealRoutePoints]  = useState([]) // [ {lat,lng} ]
  const [mapCenter,      setMapCenter]      = useState(DEFAULT_CENTER)

  const mapRef            = useRef(null)
  const animFrameRef      = useRef(null)
  const animFromRef       = useRef(null)
  const animToRef         = useRef(null)
  const animStartRef      = useRef(null)
  const destinationRef    = useRef(null)
  const lastRouteFetchRef = useRef(0)
  const isRealGpsRef      = useRef(false)  // stale closure önlemek için

  // ── Job yükle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (job) return
    const load = async () => {
      try {
        const res = await fetchAPI(API_ENDPOINTS.JOBS.GET(id))
        if (res?.data) setJob(mapJobFromBackend(res.data))
      } catch { /* ignore */ } finally { setJobLoading(false) }
    }
    load()
  }, [id, job])

  // ── Job durumu → tracking status ──────────────────────────────────
  useEffect(() => {
    if (!job) return
    if (job.status === 'completed' || job.status === 'rated') {
      setTrackingStatus('completed'); setEta(0); setDistance(0)
    } else if (job.status === 'in_progress') {
      setTrackingStatus('in_progress'); setEta(0); setDistance(0)
    }
    // Koordinat olarak kayıtlıysa direkt kullan
    if (job.location && typeof job.location === 'object' && job.location.lat && job.location.lng) {
      applyDestination({ lat: Number(job.location.lat), lng: Number(job.location.lng) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job])

  // ── Hedef konumu ayarla ───────────────────────────────────────────
  const applyDestination = useCallback((dest) => {
    destinationRef.current = dest
    setDestination(dest)
    setDestinationReady(true)
    const map = mapRef.current
    if (map) {
      if (animFromRef.current) {
        map.fitBounds(
          [[animFromRef.current.lat, animFromRef.current.lng], [dest.lat, dest.lng]],
          { padding: [80, 80] },
        )
      } else {
        map.setView([dest.lat, dest.lng], 15)
      }
    } else {
      setMapCenter([dest.lat, dest.lng])
    }
  }, [])

  // ── Nominatim geocoding (adres → koordinat) ───────────────────────
  useEffect(() => {
    if (!job) return
    const loc =
      (typeof job.address === 'string' && job.address.trim())   ? job.address :
      (typeof job.location === 'string' && job.location.trim()) ? job.location : null
    if (!loc) return

    const geocode = async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1&countrycodes=tr`,
          { headers: { 'Accept-Language': 'tr' } },
        )
        const data = await res.json()
        if (data[0]) applyDestination({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
      } catch { /* silent */ }
    }
    geocode()
  }, [job, applyDestination])

  // ── OSRM sokak rotası + ETA ───────────────────────────────────────
  const fetchOSRMRoute = useCallback(async (origin, dest) => {
    if (!origin || !dest) return
    const now = Date.now()
    if (now - lastRouteFetchRef.current < 20000) return
    lastRouteFetchRef.current = now

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      const res  = await fetch(url)
      const data = await res.json()
      if (data.code === 'Ok' && data.routes[0]) {
        const route = data.routes[0]
        setEta(Math.ceil(route.duration / 60))
        setDistance(Math.round(route.distance / 100) / 10)
        // OSRM: [lng, lat] → Leaflet: { lat, lng }
        setRealRoutePoints(route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })))
      }
    } catch { /* silent */ }
  }, [])

  // ── GPS gelince rota çek ──────────────────────────────────────────
  useEffect(() => {
    if (!isRealGps || !destinationReady) return
    lastRouteFetchRef.current = 0
    fetchOSRMRoute(targetPos, destinationRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPos, isRealGps, destinationReady])

  // ── Smooth animation engine ───────────────────────────────────────
  const animateTo = useCallback((newTarget) => {
    if (!newTarget) return
    cancelAnimationFrame(animFrameRef.current)
    const from = animFromRef.current ?? newTarget
    animFromRef.current  = from
    animToRef.current    = newTarget
    animStartRef.current = performance.now()
    const DURATION = 2000

    const step = (now) => {
      const t     = Math.min((now - animStartRef.current) / DURATION, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const pos   = lerp(animFromRef.current, animToRef.current, eased)
      setMarkerPos(pos)
      setRoutePath(prev => [...prev.slice(-50), pos])
      if (t < 1) animFrameRef.current = requestAnimationFrame(step)
    }
    animFrameRef.current = requestAnimationFrame(step)
    setBearing(calcBearing(from, newTarget))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!targetPos) return
    animateTo(targetPos)
    return () => cancelAnimationFrame(animFrameRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPos])

  // ── Socket.IO: usta GPS ───────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const joinRoom = () => socket.emit('join_job_room', id)
    joinRoom()
    socket.on('connect', joinRoom)

    const onLocation = (data) => {
      if (!data.lat || !data.lng) return
      const newPos = { lat: data.lat, lng: data.lng }

      // Ref kullan — state'e bağlı closure stale olurdu
      if (!isRealGpsRef.current) {
        isRealGpsRef.current = true
        animFromRef.current  = newPos
        setMarkerPos(newPos)
        setIsRealGps(true)
        const map = mapRef.current
        if (map) {
          if (destinationRef.current) {
            map.fitBounds(
              [[newPos.lat, newPos.lng], [destinationRef.current.lat, destinationRef.current.lng]],
              { padding: [80, 80] },
            )
          } else {
            map.setView([newPos.lat, newPos.lng], 15)
          }
        }
      }
      setTargetPos(newPos)
      if (data.heading !== undefined) setBearing(data.heading)
    }

    socket.on('location_updated', onLocation)
    return () => {
      socket.off('location_updated', onLocation)
      socket.off('connect', joinRoom)
      socket.emit('leave_job_room', id)
    }
  }, [id])

  // ── Format yardımcıları ───────────────────────────────────────────
  const formatEta = (m) => {
    if (m === null) return '...'
    if (m <= 0)    return 'Geldi!'
    if (m < 1)     return '< 1 dk'
    return `${Math.ceil(m)} dk`
  }

  const currentStep = STATUS_STEPS.findIndex(s => s.key === trackingStatus)

  // ── Yükleme ───────────────────────────────────────────────────────
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

  const professional = job.professional || job.usta
  const ustaIcon     = makeUstaIcon(bearing)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── HARİTA ──────────────────────────────────────────────────── */}
      <div className="relative" style={{ height: '55vh' }}>

        {/* Geri butonu */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-[400] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>

        {/* Canlı GPS rozeti */}
        {isRealGps && (
          <div className="absolute top-4 left-16 z-[400] flex items-center gap-1.5 bg-white rounded-full shadow-md px-3 py-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-600">Canlı GPS</span>
          </div>
        )}

        {/* ETA rozeti */}
        {trackingStatus !== 'completed' && trackingStatus !== 'in_progress' && (
          <div className="absolute top-4 right-4 z-[400] bg-white rounded-2xl shadow-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span className="text-lg font-black text-blue-600">{formatEta(eta)}</span>
            </div>
            {distance !== null && distance > 0 && (
              <p className="text-xs text-gray-500 text-center mt-0.5">{distance.toFixed(1)} km</p>
            )}
          </div>
        )}

        {/* Usta geldi overlay */}
        {trackingStatus === 'arrived' && (
          <div className="absolute inset-0 z-[400] bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl px-8 py-6 text-center mx-4">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-black text-gray-900">Usta Geldi!</h3>
              <p className="text-gray-600 text-sm mt-1">Ustanız kapınızda</p>
            </div>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <MapRef mapRef={mapRef} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Geçilen yol izi (mavi) */}
          {routePath.length > 1 && (
            <Polyline
              positions={routePath.map(p => [p.lat, p.lng])}
              pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85 }}
            />
          )}

          {/* OSRM sokak rotası (gri kesikli) */}
          {isRealGps && realRoutePoints.length > 1 && (
            <Polyline
              positions={realRoutePoints.map(p => [p.lat, p.lng])}
              pathOptions={{ color: '#64748b', weight: 4, opacity: 0.55, dashArray: '8,6' }}
            />
          )}

          {/* Usta marker */}
          {markerPos && (
            <Marker
              position={[markerPos.lat, markerPos.lng]}
              icon={ustaIcon}
              zIndexOffset={100}
            />
          )}

          {/* Hedef marker */}
          {destinationReady && destination && (
            <Marker
              position={[destination.lat, destination.lng]}
              icon={DEST_ICON}
              zIndexOffset={50}
            />
          )}
        </MapContainer>
      </div>

      {/* ── BOTTOM SHEET ────────────────────────────────────────────── */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 shadow-2xl overflow-auto">
        <div className="px-5 pt-4 pb-8 space-y-4">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />

          {/* Durum adımları */}
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
                Ara
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveTrackingPage
