import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'

function FitBounds({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) return
    if (markers.length === 1) {
      map.flyTo([markers[0].pos.lat, markers[0].pos.lng], 14, { duration: 0.5 })
      return
    }
    const group = L.featureGroup(markers.map(m => L.marker([m.pos.lat, m.pos.lng])))
    map.fitBounds(group.getBounds().pad(0.15))
  }, [markers, map])
  return null
}

const DEFAULT_CENTER = [41.0082, 28.9784]

const JOB_PIN = L.divIcon({
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="#2563eb"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`,
})

async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') return null
  const q = address.includes('Türkiye') ? address : `${address}, Türkiye`
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=tr`,
      { headers: { 'Accept-Language': 'tr' } }
    )
    const data = await res.json()
    if (data?.[0]?.lat && data?.[0]?.lon) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch { /* ignore */ }
  return null
}

export default function JobsMap({ jobs = [], onJobClick }) {
  const navigate = useNavigate()
  const [coords, setCoords] = useState({})

  const geocodeJobs = useCallback(async () => {
    const next = {}
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      const addr = job?.location?.address || job?.address || (typeof job?.location === 'string' ? job.location : '')
      if (!addr || next[job.id]) continue
      const c = await geocodeAddress(addr)
      if (c) next[job.id] = c
      if (i < jobs.length - 1) await new Promise(r => setTimeout(r, 1100))
    }
    setCoords(prev => ({ ...prev, ...next }))
  }, [jobs])

  useEffect(() => {
    if (jobs.length === 0) return
    geocodeJobs()
  }, [jobs.length, geocodeJobs])

  const handleClick = (job) => {
    if (onJobClick) onJobClick(job)
    else navigate(`/job/${job.id}`)
  }

  const markers = jobs
    .filter(j => coords[j.id])
    .map(j => ({ ...j, pos: coords[j.id] }))

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" style={{ height: 220 }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={markers.length > 0 ? 11 : 10}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap'
        />
        <FitBounds markers={markers} />
        {markers.map((job) => (
          <Marker
            key={job.id}
            position={[job.pos.lat, job.pos.lng]}
            icon={JOB_PIN}
            eventHandlers={{ click: () => handleClick(job) }}
          >
            <Popup>
              <div className="min-w-[140px]">
                <p className="font-semibold text-sm text-gray-900 truncate">{job.title}</p>
                <p className="text-xs text-gray-500 truncate">{job.location?.address || job.address}</p>
                <p className="text-sm font-bold text-emerald-600 mt-1">{job.price} TL</p>
                <button
                  onClick={() => handleClick(job)}
                  className="mt-2 w-full py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg"
                >
                  Detay
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
