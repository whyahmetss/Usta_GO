import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAPI } from '../utils/api'
import { API_ENDPOINTS } from '../config'
import { mapJobsFromBackend } from '../utils/fieldMapper'
import { ArrowLeft, MapPin, Navigation } from 'lucide-react'

const DEFAULT_CENTER = [41.0082, 28.9784]

// Adresi mahalle/semt seviyesine kısalt (tam adres gösterilmez)
const shortenAddress = (address) => {
  if (!address) return 'Konum belirtilmedi'
  const parts = address.split(',')
  const mahalle = parts.find(p => /mahalle/i.test(p))?.trim()
  const ilce = parts.length >= 3 ? parts[parts.length - 3]?.trim() : null
  if (mahalle && ilce) return `${mahalle}, ${ilce}`
  if (mahalle) return mahalle
  if (parts.length >= 3) return `${parts[parts.length - 3]?.trim()}, ${parts[parts.length - 2]?.trim()}`
  if (parts.length >= 2) return parts.slice(-2).map(p => p.trim()).join(', ')
  return parts[0]?.trim() || address
}

const JOB_PIN = L.divIcon({
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
    </filter>
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26S32 28 32 16C32 7.16 24.84 0 16 0z" fill="#2563eb" filter="url(#sh)"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
    <circle cx="16" cy="16" r="4" fill="#2563eb"/>
  </svg>`,
})

const MY_ICON = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
})

function FitBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) return
    if (markers.length === 1) { map.flyTo([markers[0].pos.lat, markers[0].pos.lng], 14, { duration: 0.5 }); return }
    const group = L.featureGroup(markers.map(m => L.marker([m.pos.lat, m.pos.lng])))
    map.fitBounds(group.getBounds().pad(0.2))
  }, [markers, map])
  return null
}

function FlyTo({ pos }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, 14, { duration: 0.7 }) }, [pos, map])
  return null
}

async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') return null
  const q = address.includes('Türkiye') ? address : `${address}, Türkiye`
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=tr`,
      { headers: { 'Accept-Language': 'tr' } }
    )
    const data = await res.json()
    if (data?.[0]?.lat && data?.[0]?.lon) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { /**/ }
  return null
}

export default function ProfessionalMapPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [coords, setCoords] = useState({})
  const [myPos, setMyPos] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [locating, setLocating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAPI(`${API_ENDPOINTS.JOBS.LIST}?status=PENDING&limit=50`)
        const raw = Array.isArray(res?.data) ? res.data : []
        const mapped = mapJobsFromBackend(raw).map(j => ({
          ...j,
          location: typeof j.location === 'string' ? { address: j.location } : (j.location || { address: '' })
        }))
        setJobs(mapped.filter(j => j.status === 'pending'))
      } catch { /**/ } finally { setLoading(false) }
    }
    load()
  }, [])

  const geocodeJobs = useCallback(async (jobList) => {
    for (let i = 0; i < jobList.length; i++) {
      const job = jobList[i]
      const addr = job?.location?.address || ''
      if (!addr) continue
      const c = await geocodeAddress(addr)
      if (c) setCoords(prev => ({ ...prev, [job.id]: c }))
      if (i < jobList.length - 1) await new Promise(r => setTimeout(r, 1100))
    }
  }, [])

  useEffect(() => {
    if (jobs.length > 0) geocodeJobs(jobs)
  }, [jobs, geocodeJobs])

  const handleLocate = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude]
        setMyPos(p)
        setFlyTarget(p)
        setLocating(false)
      },
      () => { alert('Konum alınamadı.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const markers = jobs.filter(j => coords[j.id]).map(j => ({ ...j, pos: coords[j.id] }))

  return (
    <div className="flex flex-col h-screen bg-[#F5F7FB] dark:bg-[#0F172A]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 bg-white dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-[#334155] z-10">
        <button
          onClick={() => navigate('/professional')}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#273548] transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">İş Haritası</h1>
          <p className="text-[11px] text-gray-400">
            {loading ? 'Yükleniyor...' : `${jobs.length} bekleyen iş`}
          </p>
        </div>
        <button
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-xl text-[12px] font-semibold active:scale-95 transition-all disabled:opacity-60"
        >
          <Navigation size={14} />
          {locating ? 'Alınıyor...' : 'Konumum'}
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={10}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap'
          />
          <FitBounds markers={markers} />
          <FlyTo pos={flyTarget} />
          {myPos && <Marker position={myPos} icon={MY_ICON} />}
          {markers.map(job => (
            <Marker
              key={job.id}
              position={[job.pos.lat, job.pos.lng]}
              icon={JOB_PIN}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{job.title}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{shortenAddress(job.location?.address)}</p>
                  <p style={{ fontWeight: 700, color: '#22c55e', fontSize: 13, marginBottom: 8 }}>{job.price} TL</p>
                  <button
                    onClick={() => navigate(`/job/${job.id}`)}
                    style={{ width: '100%', padding: '6px 0', background: '#2563eb', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Detayı Gör
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Pin count badge */}
        {markers.length > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5">
            <MapPin size={13} className="text-primary-500" />
            <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200">{markers.length} iş haritada gösteriliyor</span>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">İşler yükleniyor...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
