import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox public token - pour la prod, utiliser une variable d'environnement
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

// Style Uber-like en noir et blanc
const UBER_STYLE: mapboxgl.Style = {
  version: 8,
  name: 'Uber Style',
  sources: {
    'osm': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-saturation': -1, // Noir et blanc
        'raster-contrast': 0.1,
        'raster-brightness-min': 0.1
      }
    }
  ]
}

interface MapPreviewProps {
  latitude?: number
  longitude?: number
  address?: string
  zoom?: number
  height?: string
  interactive?: boolean
  showMarker?: boolean
  onLocationSelect?: (lat: number, lng: number, address: string) => void
}

export function MapPreview({
  latitude = 48.8566,
  longitude = 2.3522,
  address,
  zoom = 14,
  height = '200px',
  interactive = false,
  showMarker = true,
  onLocationSelect
}: MapPreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: UBER_STYLE,
      center: [longitude, latitude],
      zoom: zoom,
      interactive: interactive,
      attributionControl: false
    })

    map.current.on('load', () => {
      setIsLoaded(true)
    })

    if (interactive && onLocationSelect) {
      map.current.on('click', async (e) => {
        const { lng, lat } = e.lngLat

        // Reverse geocoding pour obtenir l'adresse
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=fr`
          )
          const data = await response.json()
          const placeName = data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          onLocationSelect(lat, lng, placeName)

          // Mettre à jour le marqueur
          if (marker.current) {
            marker.current.setLngLat([lng, lat])
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        }
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Ajouter/mettre à jour le marqueur
  useEffect(() => {
    if (!map.current || !isLoaded || !showMarker) return

    if (marker.current) {
      marker.current.setLngLat([longitude, latitude])
    } else {
      // Créer un marqueur personnalisé style Uber
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: #1a1a1a;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `

      marker.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([longitude, latitude])
        .addTo(map.current)
    }

    // Centrer la carte sur la nouvelle position
    map.current.flyTo({
      center: [longitude, latitude],
      zoom: zoom,
      duration: 1000
    })
  }, [latitude, longitude, isLoaded, showMarker, zoom])

  return (
    <div className="relative rounded-xl overflow-hidden border border-anthracite-200" style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Overlay avec l'adresse */}
      {address && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center gap-2 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-sm truncate">{address}</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-anthracite-100 flex items-center justify-center">
          <div className="animate-pulse text-anthracite-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        </div>
      )}

      {/* Interactive hint */}
      {interactive && isLoaded && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-anthracite-600 shadow-sm">
          Cliquez pour placer le marqueur
        </div>
      )}
    </div>
  )
}
