/**
 * WorkersMap - Carte interactive des workers pour l'agence
 * Utilise Mapbox pour une vraie carte interactive
 * Design épuré noir/blanc/gris avec animations subtiles
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSounds } from '@/lib/sounds'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

// Style noir/blanc Uber-like
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
      attribution: '&copy; OpenStreetMap &copy; CARTO'
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
        'raster-saturation': -1,
        'raster-contrast': 0.1,
        'raster-brightness-min': 0.1
      }
    }
  ]
}

// Coordonnées des principales villes françaises
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Lyon': { lat: 45.7640, lng: 4.8357 },
  'Marseille': { lat: 43.2965, lng: 5.3698 },
  'Toulouse': { lat: 43.6047, lng: 1.4442 },
  'Bordeaux': { lat: 44.8378, lng: -0.5792 },
  'Lille': { lat: 50.6292, lng: 3.0573 },
  'Nantes': { lat: 47.2184, lng: -1.5536 },
  'Strasbourg': { lat: 48.5734, lng: 7.7521 },
  'Nice': { lat: 43.7102, lng: 7.2620 },
  'Rennes': { lat: 48.1173, lng: -1.6778 }
}

// France bounding box for centering
const FRANCE_BOUNDS = {
  center: { lat: 46.6034, lng: 2.3488 },
  minLat: 41.3,
  maxLat: 51.1,
  minLng: -5.2,
  maxLng: 9.6
}

// Convert lat/lng to SVG coordinates for fallback mode
function latLngToXY(lat: number, lng: number, width: number, height: number) {
  const x = ((lng - FRANCE_BOUNDS.minLng) / (FRANCE_BOUNDS.maxLng - FRANCE_BOUNDS.minLng)) * width
  const y = ((FRANCE_BOUNDS.maxLat - lat) / (FRANCE_BOUNDS.maxLat - FRANCE_BOUNDS.minLat)) * height
  return { x, y }
}

interface WorkerLocation {
  id: string
  name: string
  avatar?: string
  location: string
  latitude: number
  longitude: number
  status: 'active' | 'idle' | 'offline'
  currentShift?: {
    mission: string
    startTime: string
    earnings: number
  }
  stats: {
    totalShifts: number
    totalHours: number
    rating: number
  }
}

interface WorkersMapProps {
  workers: WorkerLocation[]
  onWorkerClick?: (worker: WorkerLocation) => void
  compact?: boolean
  useRealMap?: boolean
}

export function WorkersMap({ workers, onWorkerClick, compact = false, useRealMap = true }: WorkersMapProps) {
  const sounds = useSounds()
  const [selectedWorker, setSelectedWorker] = useState<WorkerLocation | null>(null)
  const [hoveredWorker, setHoveredWorker] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const mapWidth = compact ? 300 : 400
  const mapHeight = compact ? 250 : 320

  const handleWorkerClick = useCallback((worker: WorkerLocation) => {
    sounds.tap()
    setSelectedWorker(prev => prev?.id === worker.id ? null : worker)
    onWorkerClick?.(worker)
  }, [sounds, onWorkerClick])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#1A1A1A'
      case 'idle': return '#8A8A8A'
      case 'offline': return '#D4D4D4'
      default: return '#8A8A8A'
    }
  }

  // Group workers by approximate location for clustering
  const workersByLocation = workers.reduce((acc, worker) => {
    const key = `${Math.round(worker.latitude * 10)}-${Math.round(worker.longitude * 10)}`
    if (!acc[key]) acc[key] = []
    acc[key].push(worker)
    return acc
  }, {} as Record<string, WorkerLocation[]>)

  // Initialize Mapbox map
  useEffect(() => {
    if (!useRealMap || !mapContainerRef.current || mapRef.current) return

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: UBER_STYLE,
        center: [FRANCE_BOUNDS.center.lng, FRANCE_BOUNDS.center.lat],
        zoom: 5,
        attributionControl: false,
        logoPosition: 'bottom-right'
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      map.on('load', () => {
        setMapLoaded(true)
      })

      map.on('error', () => {
        setMapError(true)
      })

      mapRef.current = map

      return () => {
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
        map.remove()
        mapRef.current = null
      }
    } catch (err) {
      console.error('Failed to initialize Mapbox:', err)
      setMapError(true)
    }
  }, [useRealMap])

  // Update markers when workers change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !useRealMap) return

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Fit map to workers bounds if we have workers
    if (workers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      workers.forEach(worker => {
        bounds.extend([worker.longitude, worker.latitude])
      })

      mapRef.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
        duration: 1000
      })
    }

    // Create new markers for each worker group
    Object.entries(workersByLocation).forEach(([, locationWorkers]) => {
      const firstWorker = locationWorkers[0]
      const hasActiveWorker = locationWorkers.some(w => w.status === 'active')

      // Create marker element
      const el = document.createElement('div')
      el.className = 'worker-marker'
      el.style.cssText = `
        width: ${locationWorkers.length > 1 ? '32px' : '24px'};
        height: ${locationWorkers.length > 1 ? '32px' : '24px'};
        border-radius: 50%;
        background-color: ${getStatusColor(firstWorker.status)};
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${locationWorkers.length > 1 ? '12px' : '10px'};
        font-weight: 600;
        font-family: system-ui, -apple-system, sans-serif;
        position: relative;
        transition: transform 0.2s ease;
      `

      // Add content
      if (locationWorkers.length > 1) {
        el.textContent = String(locationWorkers.length)
      } else {
        el.textContent = firstWorker.name.split(' ').map(n => n[0]).join('').slice(0, 2)
      }

      // Add pulse effect for active workers
      if (hasActiveWorker) {
        const pulse = document.createElement('div')
        pulse.style.cssText = `
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${getStatusColor('active')};
          animation: pulse 2s infinite;
          z-index: -1;
        `
        el.appendChild(pulse)

        // Add keyframes for pulse animation
        if (!document.getElementById('worker-marker-styles')) {
          const style = document.createElement('style')
          style.id = 'worker-marker-styles'
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.4; }
              50% { transform: scale(1.8); opacity: 0; }
              100% { transform: scale(1); opacity: 0.4; }
            }
          `
          document.head.appendChild(style)
        }
      }

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)'
        setHoveredWorker(firstWorker.id)
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
        setHoveredWorker(null)
      })
      el.addEventListener('click', () => {
        handleWorkerClick(firstWorker)
      })

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([firstWorker.longitude, firstWorker.latitude])
        .addTo(mapRef.current!)

      markersRef.current.push(marker)
    })
  }, [workers, workersByLocation, mapLoaded, useRealMap, handleWorkerClick])

  // Render SVG fallback map
  const renderSVGMap = () => (
    <>
      {/* Simplified France outline SVG */}
      <svg
        viewBox="0 0 400 320"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.15 }}
      >
        <path
          d="M180 30 L250 35 L300 50 L340 80 L350 120 L360 180 L340 230 L300 280 L250 300 L200 290 L150 280 L100 260 L80 220 L70 170 L80 120 L100 80 L140 50 Z"
          fill="none"
          stroke="#1A1A1A"
          strokeWidth="2"
        />
      </svg>

      {/* City labels */}
      {Object.entries(CITY_COORDINATES).map(([city, coords]) => {
        const { x, y } = latLngToXY(coords.lat, coords.lng, mapWidth, mapHeight)
        const hasWorkers = workers.some(w =>
          Math.abs(w.latitude - coords.lat) < 0.5 &&
          Math.abs(w.longitude - coords.lng) < 0.5
        )

        return (
          <motion.div
            key={city}
            initial={{ opacity: 0 }}
            animate={{ opacity: hasWorkers ? 0.6 : 0.3 }}
            className="absolute text-[9px] text-anthracite-500 font-medium pointer-events-none"
            style={{
              left: x,
              top: y + 12,
              transform: 'translateX(-50%)'
            }}
          >
            {city}
          </motion.div>
        )
      })}

      {/* Worker markers */}
      {Object.entries(workersByLocation).map(([key, locationWorkers]) => {
        const firstWorker = locationWorkers[0]
        const { x, y } = latLngToXY(firstWorker.latitude, firstWorker.longitude, mapWidth, mapHeight)
        const isHovered = locationWorkers.some(w => w.id === hoveredWorker)
        const isSelected = locationWorkers.some(w => w.id === selectedWorker?.id)
        const hasActiveWorker = locationWorkers.some(w => w.status === 'active')

        return (
          <motion.div
            key={key}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isHovered || isSelected ? 1.2 : 1,
              opacity: 1
            }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="absolute cursor-pointer"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => setHoveredWorker(locationWorkers[0].id)}
            onMouseLeave={() => setHoveredWorker(null)}
            onClick={() => handleWorkerClick(locationWorkers[0])}
          >
            {/* Pulse effect for active workers */}
            {hasActiveWorker && (
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-anthracite-900 rounded-full"
                style={{ width: 24, height: 24, margin: -4 }}
              />
            )}

            {/* Main marker */}
            <div
              className={`
                relative z-10 flex items-center justify-center rounded-full
                border-2 border-white shadow-md transition-all
                ${locationWorkers.length > 1 ? 'w-8 h-8' : 'w-6 h-6'}
              `}
              style={{ backgroundColor: getStatusColor(firstWorker.status) }}
            >
              {locationWorkers.length > 1 ? (
                <span className="text-white text-xs font-bold">{locationWorkers.length}</span>
              ) : (
                <span className="text-white text-[10px] font-medium">
                  {firstWorker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </>
  )

  return (
    <div className={`relative ${compact ? '' : 'bg-white border border-anthracite-100 rounded-2xl p-4'}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-anthracite-900">Localisation des workers</h3>
            <p className="text-xs text-anthracite-400">{workers.length} worker{workers.length > 1 ? 's' : ''} actif{workers.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-anthracite-900 rounded-full" />
              <span className="text-xs text-anthracite-500">Actif</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-anthracite-400 rounded-full" />
              <span className="text-xs text-anthracite-500">En pause</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-anthracite-200 rounded-full" />
              <span className="text-xs text-anthracite-500">Offline</span>
            </div>
          </div>
        </div>
      )}

      {/* Map container */}
      <div
        className="relative bg-anthracite-50 rounded-xl overflow-hidden"
        style={{ width: mapWidth, height: mapHeight }}
      >
        {useRealMap && !mapError ? (
          <>
            <div ref={mapContainerRef} className="absolute inset-0" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-anthracite-50">
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-anthracite-200 border-t-anthracite-600 rounded-full"
                  />
                  <span className="text-xs text-anthracite-400">Chargement de la carte...</span>
                </div>
              </div>
            )}
          </>
        ) : (
          renderSVGMap()
        )}
      </div>

      {/* Selected worker tooltip */}
      <AnimatePresence>
        {selectedWorker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 right-4 bg-anthracite-900 text-white rounded-xl p-4 shadow-xl z-20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-sm font-medium">
                {selectedWorker.avatar || selectedWorker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{selectedWorker.name}</h4>
                <p className="text-xs text-anthracite-400">{selectedWorker.location}</p>
              </div>
              <button
                onClick={() => {
                  sounds.tap()
                  setSelectedWorker(null)
                }}
                className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-anthracite-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            {selectedWorker.currentShift && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-anthracite-400">En cours</p>
                    <p className="text-sm">{selectedWorker.currentShift.mission}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-anthracite-400">Gains</p>
                    <p className="text-sm font-medium text-white">+{selectedWorker.currentShift.earnings.toFixed(2)}€</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-medium">{selectedWorker.stats.totalShifts}</p>
                <p className="text-[10px] text-anthracite-400">Shifts</p>
              </div>
              <div>
                <p className="text-lg font-medium">{selectedWorker.stats.totalHours.toFixed(0)}h</p>
                <p className="text-[10px] text-anthracite-400">Heures</p>
              </div>
              <div>
                <p className="text-lg font-medium flex items-center justify-center gap-1">
                  {selectedWorker.stats.rating.toFixed(1)}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </p>
                <p className="text-[10px] text-anthracite-400">Note</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
