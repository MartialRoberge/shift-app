/**
 * XRPL Service - Client-side blockchain integration
 * Gestion des données XRPL, conversion EUR/XRP, explorer links
 */

const XRPL_EXPLORER_TESTNET = 'https://testnet.xrpl.org'
const XRPL_EXPLORER_MAINNET = 'https://livenet.xrpl.org'

// Utiliser testnet par défaut
const EXPLORER_BASE = XRPL_EXPLORER_TESTNET

// Cache pour le taux de change
let cachedRate: { rate: number; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Récupère le taux de change XRP/EUR en temps réel
 */
export async function getXRPtoEURRate(): Promise<number> {
  // Utiliser le cache si valide
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate
  }

  try {
    // CoinGecko API (gratuite, pas de clé requise)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=eur'
    )
    const data = await response.json()
    const rate = data.ripple?.eur || 0.5 // Fallback à 0.5 EUR si erreur

    cachedRate = { rate, timestamp: Date.now() }
    return rate
  } catch (error) {
    console.warn('Failed to fetch XRP rate, using fallback:', error)
    return cachedRate?.rate || 0.5 // Utiliser cache ou fallback
  }
}

/**
 * Convertit EUR en XRP
 */
export async function eurToXRP(eurAmount: number): Promise<number> {
  const rate = await getXRPtoEURRate()
  return rate > 0 ? eurAmount / rate : eurAmount * 2 // Fallback: 1 EUR = 2 XRP approx
}

/**
 * Convertit XRP en EUR
 */
export async function xrpToEUR(xrpAmount: number): Promise<number> {
  const rate = await getXRPtoEURRate()
  return xrpAmount * rate
}

/**
 * Formate un montant XRP avec symbole
 */
export function formatXRP(amount: number, decimals: number = 2): string {
  return `${amount.toFixed(decimals)} XRP`
}

/**
 * Formate un montant EUR
 */
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Génère l'URL de l'explorer pour une transaction
 */
export function getTransactionURL(txHash: string): string {
  return `${EXPLORER_BASE}/transactions/${txHash}`
}

/**
 * Génère l'URL de l'explorer pour un compte
 */
export function getAccountURL(address: string): string {
  return `${EXPLORER_BASE}/accounts/${address}`
}

/**
 * Génère l'URL de l'explorer pour un NFT
 */
export function getNFTURL(nftId: string): string {
  return `${EXPLORER_BASE}/nft/${nftId}`
}

/**
 * Raccourcit une adresse XRPL pour l'affichage
 */
export function shortenAddress(address: string, chars: number = 6): string {
  if (!address) return ''
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Raccourcit un hash de transaction
 */
export function shortenHash(hash: string, chars: number = 8): string {
  if (!hash) return ''
  if (hash.length <= chars * 2) return hash
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

/**
 * Types de transaction XRPL avec labels français
 */
export const TRANSACTION_TYPES = {
  EscrowCreate: {
    label: 'Escrow créé',
    description: 'Fonds bloqués en attente de validation',
    icon: '🔒',
  },
  EscrowFinish: {
    label: 'Escrow libéré',
    description: 'Fonds transférés au travailleur',
    icon: '🔓',
  },
  NFTokenMint: {
    label: 'NFT créé',
    description: 'Certificat de travail blockchain',
    icon: '🎫',
  },
  Payment: {
    label: 'Paiement',
    description: 'Transfert de fonds',
    icon: '💸',
  },
} as const

/**
 * Statuts de shift avec infos XRPL
 */
export const SHIFT_BLOCKCHAIN_STATUS = {
  proposed: {
    label: 'En attente',
    description: 'Le shift attend validation par l\'agence',
    xrplStatus: 'Aucune transaction',
    color: 'anthracite',
  },
  validated: {
    label: 'Validé',
    description: 'Fonds bloqués en escrow XRPL',
    xrplStatus: 'Escrow actif',
    color: 'blue',
  },
  paid: {
    label: 'Payé',
    description: 'Paiement reçu via XRPL',
    xrplStatus: 'Transaction complétée',
    color: 'green',
  },
  refused: {
    label: 'Refusé',
    description: 'Shift non validé',
    xrplStatus: 'Annulé',
    color: 'red',
  },
} as const

/**
 * Informations sur le réseau XRPL
 */
export const XRPL_NETWORK_INFO = {
  testnet: {
    name: 'XRPL Testnet',
    description: 'Réseau de test Ripple',
    explorer: XRPL_EXPLORER_TESTNET,
    faucet: 'https://faucet.altnet.rippletest.net/accounts',
  },
  mainnet: {
    name: 'XRPL Mainnet',
    description: 'Réseau principal Ripple',
    explorer: XRPL_EXPLORER_MAINNET,
    faucet: null,
  },
}

/**
 * Hook pour utiliser les données XRPL avec conversion EUR
 */
import { useState, useEffect } from 'react'

export interface XRPLAmount {
  xrp: number
  eur: number
  loading: boolean
}

export function useXRPLAmount(eurAmount: number): XRPLAmount {
  const [xrp, setXRP] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function convert() {
      setLoading(true)
      const xrpAmount = await eurToXRP(eurAmount)
      if (mounted) {
        setXRP(xrpAmount)
        setLoading(false)
      }
    }

    convert()
    return () => { mounted = false }
  }, [eurAmount])

  return { xrp, eur: eurAmount, loading }
}

/**
 * Hook pour récupérer le taux de change actuel
 */
export function useXRPRate() {
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchRate() {
      const currentRate = await getXRPtoEURRate()
      if (mounted) {
        setRate(currentRate)
        setLoading(false)
      }
    }

    fetchRate()
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchRate, CACHE_DURATION)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { rate, loading }
}

/**
 * Calcule les frais XRPL estimés (en drops)
 * 1 XRP = 1,000,000 drops
 */
export function estimateXRPLFee(): number {
  return 12 // 12 drops = 0.000012 XRP (fee standard)
}

/**
 * Convertit drops en XRP
 */
export function dropsToXRP(drops: number): number {
  return drops / 1_000_000
}

/**
 * Convertit XRP en drops
 */
export function xrpToDrops(xrp: number): number {
  return Math.floor(xrp * 1_000_000)
}
