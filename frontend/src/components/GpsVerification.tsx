import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'

interface GpsVerificationProps {
  missionLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  maxDistanceMeters?: number
  onVerified?: (result: GpsVerificationResult) => void
  compact?: boolean
}

export interface GpsVerificationResult {
  verified: boolean
  distance?: number
  userLocation?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  error?: string
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

type VerificationStatus = 'idle' | 'locating' | 'verified' | 'far' | 'error' | 'no-mission'

export function GpsVerification({
  missionLocation,
  maxDistanceMeters = 500,
  onVerified,
  compact = false
}: GpsVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [distance, setDistance] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isVerifyingRef = useRef(false)
  const lastVerificationRef = useRef<number>(0)
  const hasVerifiedOnceRef = useRef(false)

  const verifyLocation = useCallback(async () => {
    // Éviter les vérifications multiples simultanées
    if (isVerifyingRef.current) return
    
    // Éviter les vérifications trop fréquentes (min 3 secondes entre chaque)
    const now = Date.now()
    if (now - lastVerificationRef.current < 3000) return

    if (!missionLocation) {
      setStatus('no-mission')
      onVerified?.({ verified: true, error: 'No mission location to verify' })
      return
    }

    isVerifyingRef.current = true
    setStatus('locating')
    setError(null)
    lastVerificationRef.current = now

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Réduire la précision pour stabiliser
          timeout: 8000,
          maximumAge: 5000 // Utiliser une position en cache si disponible (5 secondes)
        })
      })

      const userLat = position.coords.latitude
      const userLng = position.coords.longitude
      const userAccuracy = position.coords.accuracy

      setAccuracy(userAccuracy)

      const dist = calculateDistance(
        userLat, userLng,
        missionLocation.latitude, missionLocation.longitude
      )

      setDistance(dist)

      const isVerified = dist <= maxDistanceMeters

      if (isVerified) {
        setStatus('verified')
        // Pas de son pour éviter le bruit répétitif
      } else {
        setStatus('far')
        // Pas de son pour éviter le bruit répétitif
      }

      onVerified?.({
        verified: isVerified,
        distance: dist,
        userLocation: {
          latitude: userLat,
          longitude: userLng,
          accuracy: userAccuracy
        }
      })

    } catch (err: any) {
      console.error('GPS Error:', err)
      setStatus('error')

      let errorMessage = 'Impossible de récupérer la position'
      if (err.code === 1) {
        errorMessage = 'Permission GPS refusée'
      } else if (err.code === 2) {
        errorMessage = 'Position indisponible'
      } else if (err.code === 3) {
        errorMessage = 'Timeout GPS'
      }

      setError(errorMessage)
      onVerified?.({ verified: false, error: errorMessage })
    } finally {
      isVerifyingRef.current = false
      hasVerifiedOnceRef.current = true
    }
  }, [missionLocation, maxDistanceMeters, onVerified])

  // Vérification unique au montage (une seule fois, seulement si on n'a pas encore vérifié)
  useEffect(() => {
    if (missionLocation && !hasVerifiedOnceRef.current && status === 'idle') {
      verifyLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionLocation?.latitude, missionLocation?.longitude]) // Seulement quand la position de la mission change vraiment

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {status === 'locating' && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-anthracite-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-anthracite-400">Vérification...</span>
          </div>
        )}
        {status === 'verified' && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-xs text-emerald-600 font-medium">Sur site</span>
          </div>
        )}
        {status === 'far' && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-xs text-amber-600 font-medium">
              {distance ? formatDistance(distance) : ''} du site
            </span>
          </div>
        )}
        {(status === 'error' || status === 'idle') && (
          <button
            onClick={verifyLocation}
            className="flex items-center gap-1.5 text-xs text-anthracite-400 hover:text-anthracite-600"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Vérifier GPS
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-anthracite-100 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-anthracite-600 font-medium">Localisation</span>
        <AnimatePresence mode="wait">
          {status === 'locating' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-anthracite-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-anthracite-400">Vérification...</span>
            </div>
          )}
          {status === 'verified' && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-xs text-emerald-600 font-medium">Sur site</span>
            </div>
          )}
          {status === 'far' && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-xs text-amber-600 font-medium">Trop loin</span>
            </div>
          )}
          {status === 'error' && (
            <button
              onClick={verifyLocation}
              className="text-xs text-anthracite-400 hover:text-anthracite-600"
            >
              Réessayer
            </button>
          )}
        </AnimatePresence>
      </div>
      {status === 'far' && distance !== null && (
        <p className="text-xs text-amber-600 mt-1">
          {formatDistance(distance)} du site (max: {formatDistance(maxDistanceMeters)})
        </p>
      )}
      {status === 'error' && error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

/**
 * Hook to use GPS verification imperatively
 */
export function useGpsVerification(missionLocation?: { latitude: number; longitude: number }) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<GpsVerificationResult | null>(null)

  const verify = useCallback(async (maxDistance = 500): Promise<GpsVerificationResult> => {
    if (!missionLocation) {
      return { verified: true, error: 'No mission location' }
    }

    setIsVerifying(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const distance = calculateDistance(
        position.coords.latitude, position.coords.longitude,
        missionLocation.latitude, missionLocation.longitude
      )

      const res: GpsVerificationResult = {
        verified: distance <= maxDistance,
        distance,
        userLocation: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      }

      setResult(res)
      return res

    } catch (err: any) {
      const res: GpsVerificationResult = {
        verified: false,
        error: err.message || 'GPS error'
      }
      setResult(res)
      return res

    } finally {
      setIsVerifying(false)
    }
  }, [missionLocation])

  return { verify, isVerifying, result }
}
