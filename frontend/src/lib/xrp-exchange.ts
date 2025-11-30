/**
 * XRP Exchange Rate Service
 * Fetches real-time EUR/XRP exchange rate from multiple sources
 */

import { useState, useEffect, useCallback } from 'react'

// Cache for exchange rate
let cachedRate: number | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60000 // 1 minute cache

interface ExchangeRateResponse {
  rate: number // EUR per 1 XRP
  source: string
  timestamp: number
}

/**
 * Fetches XRP/EUR rate from CoinGecko API (free, no auth required)
 */
async function fetchFromCoinGecko(): Promise<number> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=eur',
    { headers: { 'Accept': 'application/json' } }
  )
  if (!response.ok) throw new Error('CoinGecko API error')
  const data = await response.json()
  return data.ripple?.eur || 0
}

/**
 * Fetches XRP/EUR rate from CryptoCompare API (free tier)
 */
async function fetchFromCryptoCompare(): Promise<number> {
  const response = await fetch(
    'https://min-api.cryptocompare.com/data/price?fsym=XRP&tsyms=EUR',
    { headers: { 'Accept': 'application/json' } }
  )
  if (!response.ok) throw new Error('CryptoCompare API error')
  const data = await response.json()
  return data.EUR || 0
}

/**
 * Get current XRP/EUR exchange rate with fallback sources
 */
export async function getXRPRate(): Promise<ExchangeRateResponse> {
  // Check cache first
  if (cachedRate && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return {
      rate: cachedRate,
      source: 'cache',
      timestamp: cacheTimestamp,
    }
  }

  // Try primary source (CoinGecko)
  try {
    const rate = await fetchFromCoinGecko()
    if (rate > 0) {
      cachedRate = rate
      cacheTimestamp = Date.now()
      return { rate, source: 'coingecko', timestamp: cacheTimestamp }
    }
  } catch (e) {
    console.warn('CoinGecko fetch failed:', e)
  }

  // Fallback to CryptoCompare
  try {
    const rate = await fetchFromCryptoCompare()
    if (rate > 0) {
      cachedRate = rate
      cacheTimestamp = Date.now()
      return { rate, source: 'cryptocompare', timestamp: cacheTimestamp }
    }
  } catch (e) {
    console.warn('CryptoCompare fetch failed:', e)
  }

  // Last resort: use reasonable fallback rate
  // As of late 2024, XRP is typically around 0.50-0.70 EUR
  const fallbackRate = 0.55
  return {
    rate: cachedRate || fallbackRate,
    source: 'fallback',
    timestamp: Date.now(),
  }
}

/**
 * Convert EUR to XRP
 */
export function eurToXrp(eurAmount: number, rate: number): number {
  if (rate <= 0) return 0
  return eurAmount / rate
}

/**
 * Convert XRP to EUR
 */
export function xrpToEur(xrpAmount: number, rate: number): number {
  return xrpAmount * rate
}

/**
 * Format XRP amount with proper precision
 */
export function formatXRP(amount: number, decimals: number = 2): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format EUR amount
 */
export function formatEUR(amount: number): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * React hook for XRP exchange rate with auto-refresh
 */
export function useXRPExchangeRate(refreshInterval: number = 60000) {
  const [rate, setRate] = useState<number>(0.55) // Default fallback
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string>('initializing')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchRate = useCallback(async () => {
    try {
      const result = await getXRPRate()
      setRate(result.rate)
      setSource(result.source)
      setLastUpdate(new Date(result.timestamp))
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to fetch rate')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRate()
    const interval = setInterval(fetchRate, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchRate, refreshInterval])

  // Conversion helpers
  const toXRP = useCallback((eurAmount: number) => eurToXrp(eurAmount, rate), [rate])
  const toEUR = useCallback((xrpAmount: number) => xrpToEur(xrpAmount, rate), [rate])

  return {
    rate,
    loading,
    error,
    source,
    lastUpdate,
    refresh: fetchRate,
    toXRP,
    toEUR,
    formatXRP,
    formatEUR,
  }
}

/**
 * Dual amount display helper
 * Returns formatted string like "150.00€ (≈ 272.73 XRP)"
 */
export function formatDualAmount(
  eurAmount: number,
  rate: number,
  primaryCurrency: 'EUR' | 'XRP' = 'EUR'
): { primary: string; secondary: string; xrp: number; eur: number } {
  const xrpAmount = eurToXrp(eurAmount, rate)

  if (primaryCurrency === 'EUR') {
    return {
      primary: `${formatEUR(eurAmount)}€`,
      secondary: `≈ ${formatXRP(xrpAmount)} XRP`,
      xrp: xrpAmount,
      eur: eurAmount,
    }
  } else {
    return {
      primary: `${formatXRP(xrpAmount)} XRP`,
      secondary: `≈ ${formatEUR(eurAmount)}€`,
      xrp: xrpAmount,
      eur: eurAmount,
    }
  }
}
