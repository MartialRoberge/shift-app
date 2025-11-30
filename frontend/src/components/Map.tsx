import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Style monochrome noir/blanc
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11'

// Token public pour demo (remplacer en prod)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

interface MapProps {
  latitude?: number
  longitude?: number
  zoom?: number
  showMarker?: boolean
  className?: string
  interactive?: boolean
}

export function Map({
  latitude = 48.8566,
  longitude = 2.3522,
  zoom = 14,
  showMarker = true,
  className = '',
  interactive = false,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [longitude, latitude],
      zoom: zoom,
      interactive: interactive,
      attributionControl: false,
    })

    // Style monochrome personnalisé
    map.current.on('load', () => {
      // Désaturer les couleurs pour un look noir/blanc
      map.current?.setPaintProperty('land', 'background-color', '#FAFAFA')
    })

    if (showMarker) {
      // Marker custom minimaliste
      const el = document.createElement('div')
      el.className = 'map-marker'
      el.innerHTML = `
        <div style="
          width: 16px;
          height: 16px;
          background: #1A1A1A;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        "></div>
      `

      marker.current = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .addTo(map.current)
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [latitude, longitude, zoom, showMarker, interactive])

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full rounded-xl overflow-hidden ${className}`}
      style={{ minHeight: '150px' }}
    />
  )
}

// Version simplifiée sans Mapbox (fallback)
export function MapPlaceholder({
  address,
  className = '',
}: {
  address: string
  className?: string
}) {
  return (
    <div
      className={`w-full bg-anthracite-50 rounded-xl flex items-center justify-center ${className}`}
      style={{ minHeight: '150px' }}
    >
      <div className="text-center p-4">
        <div className="w-8 h-8 bg-anthracite-900 rounded-full mx-auto mb-2 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <p className="text-xs text-anthracite-500">{address}</p>
      </div>
    </div>
  )
}
