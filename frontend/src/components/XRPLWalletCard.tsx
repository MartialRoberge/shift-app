import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { walletApi } from '@/lib/api'

interface XRPLWalletCardProps {
  address: string
  compact?: boolean
  showTransactions?: boolean
  label?: string
}

interface WalletBalance {
  address: string
  balance: number
  reserve: number
  available: number
}

export function XRPLWalletCard({ address, compact = false, showTransactions = false, label }: XRPLWalletCardProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadBalance()
  }, [address])

  const loadBalance = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await walletApi.getBalance(address)
      setBalance(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load balance')
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatXRP = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount)
  }

  const shortAddress = `${address.slice(0, 8)}...${address.slice(-6)}`

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-anthracite-900 to-anthracite-800 rounded-xl p-4 text-white"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <span className="text-xs text-white/60">XRPL Testnet</span>
          </div>
          <button
            onClick={copyAddress}
            className="text-xs text-white/40 hover:text-white/80 transition-colors font-mono"
          >
            {copied ? '✓ Copié' : shortAddress}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-white/60">Chargement...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : balance && balance.balance > 0 ? (
          <div className="flex items-baseline gap-2">
            <motion.span
              key={balance?.balance}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold"
            >
              {formatXRP(balance?.balance || 0)}
            </motion.span>
            <span className="text-white/60">XRP</span>
          </div>
        ) : (
          <p className="text-sm text-white/50">Wallet XRPL enregistré</p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-anthracite-900 via-anthracite-800 to-anthracite-900 rounded-2xl p-6 text-white overflow-hidden relative"
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">{label || 'XRPL Wallet'}</p>
              <p className="text-xs text-white/50">Testnet</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadBalance}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <motion.svg
              animate={loading ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.83 1.02 6.5 2.67" />
              <polyline points="21 3 21 9 15 9" />
            </motion.svg>
          </motion.button>
        </div>

        {/* Balance - Ne pas afficher si solde = 0 */}
        {loading ? (
          <div className="mb-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white/60">Chargement...</span>
          </div>
        ) : error ? (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={loadBalance} className="text-xs text-red-400 underline mt-1">
              Réessayer
            </button>
          </div>
        ) : balance && balance.balance > 0 ? (
          <div className="mb-6">
            <p className="text-sm text-white/50 mb-1">Solde disponible</p>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={balance?.balance}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold"
              >
                {formatXRP(balance?.available || 0)}
              </motion.span>
              <span className="text-xl text-white/60">XRP</span>
            </div>
            <p className="text-xs text-white/40 mt-1">
              Reserve: {formatXRP(balance?.reserve || 0)} XRP
            </p>
          </div>
        ) : null}

        {/* Address */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 mb-1">Adresse</p>
              <p className="text-sm font-mono text-white/80">{shortAddress}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyAddress}
              className="px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors"
            >
              {copied ? '✓ Copié' : 'Copier'}
            </motion.button>
          </div>
        </div>

        {/* Explorer link */}
        <a
          href={`https://testnet.xrpl.org/accounts/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          <span>Voir sur XRPL Explorer</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </div>
    </motion.div>
  )
}
