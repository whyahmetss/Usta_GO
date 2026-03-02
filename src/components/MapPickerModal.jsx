import { useState, useRef, useCallback, useEffect } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { Search, X, MapPin, Check, Loader2 } from 'lucide-react'
import { useMaps } from '../context/MapsContext'

const DEFAULT_CENTER = { lat: 41.0082, lng: 28.9784 } // İstanbul

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: undefined, // set after load
  gestureHandling: 'greedy',
  clickableIcons: false,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
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
  const { isLoaded } = useMaps()

  const initialPos =
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER

  const [markerPos, setMarkerPos] = useState(initialPos)
  const [address, setAddress] = useState(initialAddress)
  const [inputValue, setInputValue] = useState(initialAddress)
  const [geocoding, setGeocoding] = useState(false)

  const mapRef = useRef(null)
  const searchInputRef = useRef(null)
  const geocoderRef = useRef(null)
  const autocompleteRef = useRef(null)
  // Tracks if geolocation was already attempted for this open session
  const geoAttemptedRef = useRef(false)

  // ── Geocoder singleton ──────────────────────────────────────────
  const getGeocoder = useCallback(() => {
    if (!geocoderRef.current && window.google?.maps?.Geocoder) {
      geocoderRef.current = new window.google.maps.Geocoder()
    }
    return geocoderRef.current
  }, [])

  // ── Reverse geocode lat/lng → human address ──────────────────────
  const reverseGeocode = useCallback(
    (lat, lng) => {
      const geocoder = getGeocoder()
      if (!geocoder) return
      setGeocoding(true)
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        setGeocoding(false)
        if (status === 'OK' && results[0]) {
          const formatted = results[0].formatted_address
          setAddress(formatted)
          setInputValue(formatted)
        }
      })
    },
    [getGeocoder],
  )

  // ── Move marker + reverse geocode ───────────────────────────────
  const updatePosition = useCallback(
    (lat, lng) => {
      setMarkerPos({ lat, lng })
      reverseGeocode(lat, lng)
    },
    [reverseGeocode],
  )

  // ── Places Autocomplete ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !isOpen || !searchInputRef.current) return

    const autocomplete = new window.google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        componentRestrictions: { country: 'tr' },
        fields: ['geometry', 'formatted_address'],
      },
    )

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry?.location) return

      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      const newPos = { lat, lng }

      setMarkerPos(newPos)
      setAddress(place.formatted_address || '')
      setInputValue(place.formatted_address || '')

      if (mapRef.current) {
        mapRef.current.panTo(newPos)
        mapRef.current.setZoom(17)
      }
    })

    autocompleteRef.current = autocomplete

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete)
      }
    }
  }, [isLoaded, isOpen])

  // ── Auto-center on user location (first open only) ──────────────
  useEffect(() => {
    if (!isOpen || !isLoaded) return
    if (initialLat && initialLng) return // already have a position
    if (geoAttemptedRef.current) return
    geoAttemptedRef.current = true

    navigator.geolocation?.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        const pos = { lat, lng }
        setMarkerPos(pos)
        if (mapRef.current) {
          mapRef.current.panTo(pos)
          mapRef.current.setZoom(17)
        }
        reverseGeocode(lat, lng)
      },
      () => {}, // silent — stay on Istanbul
      { timeout: 5000 },
    )
  }, [isOpen, isLoaded, initialLat, initialLng, reverseGeocode])

  // ── Reset geoAttempt flag when modal is closed ───────────────────
  useEffect(() => {
    if (!isOpen) geoAttemptedRef.current = false
  }, [isOpen])

  // ── Map events ───────────────────────────────────────────────────
  const onMapLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  const onMapClick = useCallback(
    (e) => updatePosition(e.latLng.lat(), e.latLng.lng()),
    [updatePosition],
  )

  const onMarkerDragEnd = useCallback(
    (e) => updatePosition(e.latLng.lat(), e.latLng.lng()),
    [updatePosition],
  )

  // ── Confirm ──────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (!address || geocoding) return
    onConfirm({ lat: markerPos.lat, lng: markerPos.lng, address })
    onClose()
  }, [address, geocoding, markerPos, onConfirm, onClose])

  // ── Keyboard: close on Escape ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-gray-100">
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

        {/* ── Places Autocomplete input ────────────────────────────── */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Adres veya yer ara..."
              autoComplete="off"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* ── Map ───────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={initialPos}
            zoom={14}
            options={MAP_OPTIONS}
            onLoad={onMapLoad}
            onClick={onMapClick}
          >
            <Marker
              position={markerPos}
              draggable
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Drag hint — shown once ─────────────────────────────── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/70 text-white text-xs
                        font-medium px-3 py-1.5 rounded-full pointer-events-none select-none backdrop-blur-sm">
          Markeri sürükle veya haritaya dokun
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-4 pb-8">

        {/* Selected address display */}
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

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!address || geocoding}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl
                     flex items-center justify-center gap-2
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-all
                     shadow-lg shadow-blue-200"
        >
          <Check size={20} strokeWidth={2.5} />
          Konumu Onayla
        </button>
      </div>
    </div>
  )
}
