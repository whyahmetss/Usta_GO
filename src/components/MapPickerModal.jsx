import { useState, useRef, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, X, MapPin, Check, Loader2 } from 'lucide-react'

const DEFAULT_CENTER = [41.0082, 28.9784] // İstanbul

// Mavi pin — bundler icon-path sorununu önlemek için custom DivIcon
const PIN_ICON = L.divIcon({
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10.314 14.222 25.2 15.28 26.35a.96.96 0 0 0 1.44 0C17.778 41.2 32 26.314 32 16 32 7.163 24.837 0 16 0z" fill="#2563eb"/>
    <circle cx="16" cy="16" r="7.5" fill="white"/>
    <circle cx="16" cy="16" r="4.5" fill="#2563eb"/>
  </svg>`,
})

// Haritayı programatik olarak kontrol eder
function FlyController({ target }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo(target.center, target.zoom ?? map.getZoom(), { duration: 0.8 })
  }, [target, map])
  return null
}

// Harita tıklama olayını yakalar
function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

/**
 * MapPickerModal
 *
 * Props:
 *   isOpen          {boolean}
 *   onClose         {() => void}
 *   onConfirm       {({ lat: number, lng: number, address: string }) => void}
 *   initialLat      {number?}
 *   initialLng      {number?}
 *   initialAddress  {string?}
 */
export default function MapPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialAddress = '',
}) {
  const hasInitial = Boolean(initialLat && initialLng)
  const initialPos = hasInitial ? [initialLat, initialLng] : DEFAULT_CENTER

  const [markerPos, setMarkerPos]   = useState(initialPos)
  const [flyTarget, setFlyTarget]   = useState(null)
  const [address, setAddress]       = useState(initialAddress)
  const [inputValue, setInputValue] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState([])
  const [geocoding, setGeocoding]   = useState(false)
  const [searching, setSearching]   = useState(false)

  const markerRef      = useRef(null)
  const searchTimer    = useRef(null)
  const geoAttempted   = useRef(false)
  const suggestionOpen = suggestions.length > 0

  // ── Reverse geocode: koordinat → adres ──────────────────────────
  const reverseGeocode = useCallback(async (lat, lng) => {
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'tr' } },
      )
      const data = await res.json()
      if (data?.display_name) {
        setAddress(data.display_name)
        setInputValue(data.display_name)
      }
    } catch { /* silent */ } finally {
      setGeocoding(false)
    }
  }, [])

  // ── Marker/harita tıklama → pozisyon güncelle ────────────────────
  const updatePosition = useCallback((lat, lng) => {
    setMarkerPos([lat, lng])
    reverseGeocode(lat, lng)
  }, [reverseGeocode])

  // ── Nominatim arama (debounced) ──────────────────────────────────
  const handleInput = useCallback((value) => {
    setInputValue(value)
    setSuggestions([])
    clearTimeout(searchTimer.current)
    if (value.trim().length < 3) return
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=tr&addressdetails=1`,
          { headers: { 'Accept-Language': 'tr' } },
        )
        setSuggestions(await res.json())
      } catch { /* silent */ } finally {
        setSearching(false)
      }
    }, 450)
  }, [])

  // ── Öneri seçildi ────────────────────────────────────────────────
  const handleSelectSuggestion = useCallback((item) => {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    setMarkerPos([lat, lng])
    setAddress(item.display_name)
    setInputValue(item.display_name)
    setSuggestions([])
    setFlyTarget({ center: [lat, lng], zoom: 17 })
  }, [])

  // ── Marker sürükle bırak ─────────────────────────────────────────
  const markerEvents = {
    dragend() {
      const ll = markerRef.current?.getLatLng()
      if (ll) updatePosition(ll.lat, ll.lng)
    },
  }

  // ── İlk açılışta kullanıcı konumuna git ──────────────────────────
  useEffect(() => {
    if (!isOpen || hasInitial || geoAttempted.current) return
    geoAttempted.current = true
    navigator.geolocation?.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setMarkerPos([lat, lng])
        setFlyTarget({ center: [lat, lng], zoom: 17 })
        reverseGeocode(lat, lng)
      },
      () => {},
      { timeout: 5000 },
    )
  }, [isOpen, hasInitial, reverseGeocode])

  // ── Modal kapanınca state sıfırla ────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      geoAttempted.current = false
      setSuggestions([])
      clearTimeout(searchTimer.current)
    }
  }, [isOpen])

  // ── Escape ile kapat ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  const handleConfirm = useCallback(() => {
    if (!address || geocoding) return
    onConfirm({ lat: markerPos[0], lng: markerPos[1], address })
    onClose()
  }, [address, geocoding, markerPos, onConfirm, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            onClick={onClose}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Kapat"
          >
            <X size={20} className="text-gray-700" />
          </button>
          <h2 className="font-bold text-gray-900 text-lg">Konum Seç</h2>
        </div>

        {/* ── Arama inputu ──────────────────────────────────────── */}
        <div className="px-4 pb-4 relative">
          <div className="relative">
            {searching
              ? <Loader2 size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin pointer-events-none" />
              : <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            }
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => inputValue.trim().length >= 3 && handleInput(inputValue)}
              placeholder="Adres veya yer ara…"
              autoComplete="off"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {inputValue.length > 0 && (
              <button
                onClick={() => { setInputValue(''); setSuggestions([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* ── Nominatim önerileri ────────────────────────────── */}
          {suggestionOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <MapPin size={15} className="shrink-0 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-800 line-clamp-2">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Harita ────────────────────────────────────────────────── */}
      <div className="flex-1 relative" onClick={() => setSuggestions([])}>
        <MapContainer
          center={initialPos}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FlyController target={flyTarget} />
          <ClickHandler onMapClick={updatePosition} />
          <Marker
            position={markerPos}
            draggable
            icon={PIN_ICON}
            eventHandlers={markerEvents}
            ref={markerRef}
          />
        </MapContainer>

        {/* Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400]
                        bg-gray-900/70 text-white text-xs font-medium
                        px-3 py-1.5 rounded-full pointer-events-none backdrop-blur-sm whitespace-nowrap">
          Markeri sürükle veya haritaya dokun
        </div>
      </div>

      {/* ── Alt çubuk ─────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-4 pb-8">

        {/* Seçili adres */}
        <div className="flex items-start gap-3 mb-4 min-h-[52px]">
          <div className="w-9 h-9 shrink-0 bg-blue-50 rounded-full flex items-center justify-center mt-0.5">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Seçili Konum
            </p>
            {geocoding ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Adres alınıyor…</span>
              </div>
            ) : (
              <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                {address || 'Haritada bir konum seçin veya markeri sürükleyin'}
              </p>
            )}
          </div>
        </div>

        {/* Onayla butonu */}
        <button
          onClick={handleConfirm}
          disabled={!address || geocoding}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl
                     flex items-center justify-center gap-2
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
        >
          <Check size={20} strokeWidth={2.5} />
          Konumu Onayla
        </button>
      </div>
    </div>
  )
}
