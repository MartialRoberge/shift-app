import { motion } from 'framer-motion'
import { useSounds } from '@/lib/sounds'
import {
  getTransactionURL,
  getNFTURL,
  shortenHash,
  useXRPLAmount
} from '@/lib/xrpl'

interface TimelineStep {
  id: string
  label: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  txHash?: string
  nftId?: string
  amount?: number
}

interface BlockchainTimelineProps {
  steps: TimelineStep[]
  compact?: boolean
}

export function BlockchainTimeline({ steps, compact = false }: BlockchainTimelineProps) {
  const sounds = useSounds()

  const handleLinkClick = () => {
    sounds.blockchain()
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3"
        >
          {/* Indicateur de statut */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.1, duration: 0.3, ease: 'easeOut' }}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium
                ${step.status === 'completed' ? 'bg-anthracite-900 text-white' : ''}
                ${step.status === 'processing' ? 'bg-anthracite-200 text-anthracite-600' : ''}
                ${step.status === 'pending' ? 'bg-anthracite-50 text-anthracite-300 border border-anthracite-200' : ''}
                ${step.status === 'failed' ? 'bg-anthracite-100 text-anthracite-400' : ''}
              `}
            >
              {step.status === 'completed' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {step.status === 'processing' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                </motion.div>
              )}
              {step.status === 'pending' && (
                <span>{index + 1}</span>
              )}
              {step.status === 'failed' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </motion.div>

            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div className={`w-0.5 h-6 mt-1 ${
                step.status === 'completed' ? 'bg-anthracite-900' : 'bg-anthracite-200'
              }`} />
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0 pb-3">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-medium ${
                step.status === 'completed' ? 'text-anthracite-900' :
                step.status === 'processing' ? 'text-anthracite-600' : 'text-anthracite-400'
              }`}>
                {step.label}
              </p>

              {/* Lien vers l'explorer */}
              {step.txHash && (
                <motion.a
                  href={getTransactionURL(step.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs text-anthracite-400 hover:text-anthracite-900 font-mono flex items-center gap-1 transition-colors"
                >
                  {shortenHash(step.txHash, 6)}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </motion.a>
              )}
              {step.nftId && (
                <motion.a
                  href={getNFTURL(step.nftId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs text-anthracite-400 hover:text-anthracite-900 font-mono flex items-center gap-1 transition-colors"
                >
                  NFT
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </motion.a>
              )}
            </div>

            {!compact && (
              <p className="text-xs text-anthracite-400 mt-0.5">
                {step.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Composant pré-configuré pour un shift avec conversion EUR/XRP
 */
interface ShiftBlockchainFlowProps {
  escrowTx?: string
  nftId?: string
  paymentTx?: string
  status: 'proposed' | 'validated' | 'paid' | 'refused'
  amount?: number
}

export function ShiftBlockchainFlow({
  escrowTx,
  nftId,
  paymentTx,
  status,
  amount = 0
}: ShiftBlockchainFlowProps) {
  const xrplAmount = useXRPLAmount(amount)

  const getStepStatus = (stepKey: 'escrow' | 'nft' | 'payment'): TimelineStep['status'] => {
    if (status === 'refused') return 'failed'

    switch (stepKey) {
      case 'escrow':
        return escrowTx ? 'completed' : status === 'proposed' ? 'pending' : 'processing'
      case 'nft':
        return nftId ? 'completed' : escrowTx ? 'processing' : 'pending'
      case 'payment':
        return paymentTx ? 'completed' : status === 'validated' ? 'pending' : 'pending'
      default:
        return 'pending'
    }
  }

  const steps: TimelineStep[] = [
    {
      id: 'escrow',
      label: 'Escrow XRPL',
      description: escrowTx
        ? `${xrplAmount.loading ? '...' : xrplAmount.xrp.toFixed(2)} XRP bloqués`
        : 'Fonds en attente de blocage',
      status: getStepStatus('escrow'),
      txHash: escrowTx,
      amount: xrplAmount.xrp,
    },
    {
      id: 'nft',
      label: 'NFT Certificat',
      description: nftId ? 'Preuve de travail créée' : 'Certificat en attente',
      status: getStepStatus('nft'),
      nftId: nftId,
    },
    {
      id: 'payment',
      label: 'Paiement',
      description: paymentTx ? 'Fonds libérés vers le worker' : 'En attente de libération',
      status: getStepStatus('payment'),
      txHash: paymentTx,
    },
  ]

  // Si aucune transaction, afficher un état vide élégant
  if (!escrowTx && !nftId && !paymentTx && status === 'proposed') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-anthracite-50 rounded-xl p-4 text-center"
      >
        <div className="w-10 h-10 bg-anthracite-100 rounded-lg flex items-center justify-center mx-auto mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <p className="text-sm text-anthracite-500">En attente de validation</p>
        <p className="text-xs text-anthracite-400 mt-1">Les transactions seront créées après validation</p>
      </motion.div>
    )
  }

  return <BlockchainTimeline steps={steps} />
}
