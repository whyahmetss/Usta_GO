// Google Maps kaldırıldı → Leaflet/OSM kullanılıyor.
// useMaps() hook'u geriye dönük uyumluluk için korundu.
import { createContext, useContext } from 'react'

const MapsContext = createContext({ isLoaded: true })

export function MapsProvider({ children }) {
  return (
    <MapsContext.Provider value={{ isLoaded: true }}>
      {children}
    </MapsContext.Provider>
  )
}

export function useMaps() {
  return useContext(MapsContext)
}
