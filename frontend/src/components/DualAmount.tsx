/**
 * DualAmount - Affiche un montant en EUR et XRP
 * Utilise le taux de change en temps réel
 */

import { motion } from 'framer-motion'
import { useXRPExchangeRate, formatEUR, formatXRP } from '@/lib/xrp-exchange'

interface DualAmountProps {
  /** Montant en EUR */
  eurAmount: number
  /** Taille: 'sm' | 'md' | 'lg' | 'xl' */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Afficher EUR en premier (default) ou XRP */
  primaryCurrency?: 'EUR' | 'XRP'
  /** Mode compact (une seule ligne) */
  compact?: boolean
  /** Couleur du texte principal */
  className?: string
  /** Animation au changement */
  animate?: boolean
  /** Afficher l'icone XRPL */
  showIcon?: boolean
}

const sizeClasses = {
  sm: { primary: 'text-sm font-medium', secondary: 'text-[10px]' },
  md: { primary: 'text-base font-semibold', secondary: 'text-xs' },
  lg: { primary: 'text-xl font-bold', secondary: 'text-sm' },
  xl: { primary: 'text-3xl font-bold', secondary: 'text-base' },
}

export function DualAmount({
  eurAmount,
  size = 'md',
  primaryCurrency = 'EUR',
  compact = false,
  className = '',
  animate = true,
  showIcon = false,
}: DualAmountProps) {
  const { rate, toXRP } = useXRPExchangeRate()
  const xrpAmount = toXRP(eurAmount)

  const classes = sizeClasses[size]

  const Wrapper = animate ? motion.div : 'div'
  const animationProps = animate
    ? {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        key: `${eurAmount}-${rate}`,
      }
    : {}

  if (compact) {
    return (
      <Wrapper {...animationProps} className={`flex items-baseline gap-1.5 ${className}`}>
        {primaryCurrency === 'EUR' ? (
          <>
            <span className={classes.primary}>{formatEUR(eurAmount)}€</span>
            <span className={`${classes.secondary} text-anthracite-400`}>
              ({formatXRP(xrpAmount)} XRP)
            </span>
          </>
        ) : (
          <>
            {showIcon && (
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            )}
            <span className={classes.primary}>{formatXRP(xrpAmount)} XRP</span>
            <span className={`${classes.secondary} text-anthracite-400`}>
              ({formatEUR(eurAmount)}€)
            </span>
          </>
        )}
      </Wrapper>
    )
  }

  return (
    <Wrapper {...animationProps} className={className}>
      {primaryCurrency === 'EUR' ? (
        <>
          <div className={`${classes.primary} flex items-center gap-1`}>
            <span>{formatEUR(eurAmount)}</span>
            <span className="text-anthracite-400">€</span>
          </div>
          <div className={`${classes.secondary} text-anthracite-400 flex items-center gap-1`}>
            {showIcon && (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            )}
            <span>≈ {formatXRP(xrpAmount)} XRP</span>
          </div>
        </>
      ) : (
        <>
          <div className={`${classes.primary} flex items-center gap-1`}>
            {showIcon && (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            )}
            <span>{formatXRP(xrpAmount)}</span>
            <span className="text-anthracite-400">XRP</span>
          </div>
          <div className={`${classes.secondary} text-anthracite-400`}>
            ≈ {formatEUR(eurAmount)}€
          </div>
        </>
      )}
    </Wrapper>
  )
}

/**
 * ExchangeRateBadge - Affiche le taux de change actuel
 */
export function ExchangeRateBadge({ className = '' }: { className?: string }) {
  const { rate, source, loading, lastUpdate } = useXRPExchangeRate()

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1.5 bg-anthracite-100 px-2 py-1 rounded-lg">
        <svg className="w-3 h-3 text-anthracite-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        {loading ? (
          <span className="text-anthracite-400">...</span>
        ) : (
          <>
            <span className="font-medium text-anthracite-700">1 XRP = {rate.toFixed(3)}€</span>
            {source === 'fallback' && (
              <span className="text-anthracite-400">(estimé)</span>
            )}
          </>
        )}
      </div>
      {lastUpdate && (
        <span className="text-anthracite-400 hidden sm:inline">
          {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}

/**
 * XRPLogo - Icone XRPL stylisée
 */
export function XRPLogo({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}
