/**
 * AmountDisplay - Affichage cohérent EUR + XRP
 * Design épuré, professionnel
 */

import { motion } from 'framer-motion'
import { useXRPLAmount } from '@/lib/xrpl'

interface AmountDisplayProps {
  eurAmount: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showXRP?: boolean
  variant?: 'default' | 'positive' | 'pending' | 'muted'
  className?: string
}

export function AmountDisplay({
  eurAmount,
  size = 'md',
  showXRP = true,
  variant = 'default',
  className = ''
}: AmountDisplayProps) {
  const { xrp, loading } = useXRPLAmount(eurAmount)

  const sizeClasses = {
    sm: { eur: 'text-sm', xrp: 'text-xs' },
    md: { eur: 'text-base', xrp: 'text-xs' },
    lg: { eur: 'text-xl', xrp: 'text-sm' },
    xl: { eur: 'text-3xl', xrp: 'text-sm' },
  }

  const variantClasses = {
    default: 'text-anthracite-900',
    positive: 'text-anthracite-900',
    pending: 'text-anthracite-500',
    muted: 'text-anthracite-400',
  }

  return (
    <div className={`${className}`}>
      <div className={`font-medium ${sizeClasses[size].eur} ${variantClasses[variant]}`}>
        {variant === 'positive' && '+'}{eurAmount.toFixed(2)}€
      </div>
      {showXRP && (
        <div className={`${sizeClasses[size].xrp} text-anthracite-400 font-mono`}>
          {loading ? '...' : `≈ ${xrp.toFixed(2)} XRP`}
        </div>
      )}
    </div>
  )
}

/**
 * XRP Amount Display - Pour afficher les montants XRP avec équivalent EUR
 */
interface XRPAmountDisplayProps {
  xrpAmount: number
  size?: 'sm' | 'md' | 'lg'
  showEUR?: boolean
  className?: string
}

export function XRPAmountDisplay({
  xrpAmount,
  size = 'md',
  showEUR = true,
  className = ''
}: XRPAmountDisplayProps) {
  // Use approximate rate (will be fetched from API)
  const eurEquivalent = xrpAmount * 0.5 // Fallback rate

  const sizeClasses = {
    sm: { xrp: 'text-sm', eur: 'text-xs' },
    md: { xrp: 'text-base', eur: 'text-xs' },
    lg: { xrp: 'text-xl', eur: 'text-sm' },
  }

  return (
    <div className={`${className}`}>
      <div className={`font-medium font-mono ${sizeClasses[size].xrp} text-anthracite-900`}>
        {xrpAmount.toFixed(2)} XRP
      </div>
      {showEUR && (
        <div className={`${sizeClasses[size].eur} text-anthracite-400`}>
          ≈ {eurEquivalent.toFixed(2)}€
        </div>
      )}
    </div>
  )
}

/**
 * Compact inline display: "150.00€ (≈300 XRP)"
 */
interface InlineAmountProps {
  eurAmount: number
  showXRP?: boolean
  className?: string
}

export function InlineAmount({ eurAmount, showXRP = true, className = '' }: InlineAmountProps) {
  const { xrp, loading } = useXRPLAmount(eurAmount)

  return (
    <span className={`font-medium ${className}`}>
      {eurAmount.toFixed(2)}€
      {showXRP && (
        <span className="text-anthracite-400 font-normal ml-1">
          ({loading ? '...' : `≈${xrp.toFixed(0)} XRP`})
        </span>
      )}
    </span>
  )
}
