import { motion } from 'framer-motion'
import { useSounds } from '@/lib/sounds'
import { getNFTURL, shortenHash } from '@/lib/xrpl'

interface NFTCertificateProps {
  nftId: string
  shiftDetails?: {
    date: string
    hours: number
    amount: number
    employer: string
    jobType?: string
  }
  compact?: boolean
}

export function NFTCertificate({ nftId, shiftDetails, compact = false }: NFTCertificateProps) {
  const sounds = useSounds()

  const handleClick = () => {
    sounds.blockchain()
    window.open(getNFTURL(nftId), '_blank')
  }

  if (compact) {
    return (
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 bg-gradient-to-r from-anthracite-900 to-anthracite-800 text-white px-3 py-2 rounded-lg text-sm"
      >
        <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </div>
        <span className="font-mono text-xs">{shortenHash(nftId, 8)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-anthracite-900 via-anthracite-800 to-anthracite-900 rounded-2xl p-5 text-white overflow-hidden relative"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
              className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </motion.div>
            <div>
              <p className="text-xs text-anthracite-400 uppercase tracking-wide">Certificat NFT</p>
              <h3 className="font-medium">Preuve de Travail</h3>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Vérifié
          </motion.div>
        </div>

        {/* Shift details */}
        {shiftDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-anthracite-400 mb-1">Date</p>
              <p className="text-sm font-medium">{shiftDetails.date}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-anthracite-400 mb-1">Durée</p>
              <p className="text-sm font-medium">{shiftDetails.hours.toFixed(1)}h</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-anthracite-400 mb-1">Montant</p>
              <p className="text-sm font-medium">{shiftDetails.amount.toFixed(2)}€</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-anthracite-400 mb-1">Employeur</p>
              <p className="text-sm font-medium truncate">{shiftDetails.employer}</p>
            </div>
            {shiftDetails.jobType && (
              <div className="col-span-2 bg-white/5 rounded-lg p-3">
                <p className="text-xs text-anthracite-400 mb-1">Type de travail</p>
                <p className="text-sm font-medium">{shiftDetails.jobType}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* NFT ID */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-xs text-anthracite-400 mb-1">Token ID</p>
            <p className="font-mono text-xs">{shortenHash(nftId, 12)}</p>
          </div>
          <motion.button
            onClick={handleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Voir sur XRPL
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Holographic effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
      />
    </motion.div>
  )
}

/**
 * Simple badge for inline NFT display
 */
export function NFTBadge({ nftId }: { nftId: string }) {
  const sounds = useSounds()

  return (
    <motion.a
      href={getNFTURL(nftId)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => sounds.blockchain()}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 bg-anthracite-900 text-white px-2 py-1 rounded text-xs font-mono"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      NFT
    </motion.a>
  )
}
