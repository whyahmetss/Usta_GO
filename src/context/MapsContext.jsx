import { createContext, useContext } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
// Modül seviyesinde — her render'da yeni dizi oluşmasın
const MAPS_LIBRARIES = ['places']

const MapsContext = createContext({ isLoaded: false, loadError: null })

export function MapsProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: 'google-map-script',
    libraries: MAPS_LIBRARIES,
  })

  return (
    <MapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapsContext.Provider>
  )
}

export function useMaps() {
  return useContext(MapsContext)
}
