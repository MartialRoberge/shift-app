/**
 * XRPLStats - Statistiques blockchain détaillées
 * Design professionnel sans emojis
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSounds } from '@/lib/sounds'
import { useXRPRate, getTransactionURL, shortenHash } from '@/lib/xrpl'

interface XRPLTransaction {
  hash: string
  type: 'escrow_create' | 'escrow_finish' | 'nft_mint' | 'payment'
  amount: number
  eurAmount?: number
  timestamp: string
  status: 'success' | 'pending' | 'failed'
  workerName?: string
  shiftId?: string
}

interface XRPLStatsProps {
  escrowBalance: number
  totalPaid: number
  pendingTransactions: number
  recentTransactions: XRPLTransaction[]
  walletAddress?: string
  onRefresh?: () => void
  loading?: boolean
}

const TRANSACTION_LABELS: Record<string, string> = {
  escrow_create: 'Escrow créé',
  escrow_finish: 'Escrow libéré',
  nft_mint: 'Certificat NFT',
  payment: 'Paiement',
}

export function XRPLStats({
  escrowBalance,
  totalPaid,
  pendingTransactions,
  recentTransactions,
  walletAddress,
  onRefresh,
  loading = false
}: XRPLStatsProps) {
  const sounds = useSounds()
  const { rate, loading: rateLoading } = useXRPRate()
  const [expandedTx, setExpandedTx] = useState<string | null>(null)

  const formatAmount = (xrp: number) => xrp.toFixed(2)

  const xrpToEur = (xrp: number) => {
    // Use real rate, fallback to 0.55 (approximate current rate Dec 2024)
    return xrp * (rate || 0.55)
  }

  const handleTxClick = (hash: string) => {
    sounds.tap()
    setExpandedTx(expandedTx === hash ? null : hash)
  }

  const handleRefresh = () => {
    sounds.blockchain()
    onRefresh?.()
  }

  const totalVolume = escrowBalance + totalPaid

  return (
    <div className="space-y-4">
      {/* Header with rate */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-anthracite-900">Blockchain XRPL</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-anthracite-400">Taux:</span>
            {rateLoading ? (
              <span className="text-xs text-anthracite-400">...</span>
            ) : (
              <span className="text-xs font-mono text-anthracite-600">
                1 XRP = {rate?.toFixed(4) || '0.50'}€
              </span>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={loading}
          className="w-8 h-8 bg-anthracite-100 rounded-lg flex items-center justify-center text-anthracite-600 hover:bg-anthracite-200 transition-colors disabled:opacity-50"
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

      {/* Main stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Escrow balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-anthracite-900 text-white rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-xs text-anthracite-400">Escrow</span>
          </div>
          <p className="text-xl font-bold">{formatAmount(escrowBalance)} XRP</p>
          <p className="text-xs text-anthracite-400 mt-0.5">
            ≈ {xrpToEur(escrowBalance).toFixed(2)}€
          </p>
        </motion.div>

        {/* Total paid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-anthracite-100 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-xs text-anthracite-400">Payé</span>
          </div>
          <p className="text-xl font-bold text-anthracite-900">{formatAmount(totalPaid)} XRP</p>
          <p className="text-xs text-anthracite-400 mt-0.5">
            ≈ {xrpToEur(totalPaid).toFixed(2)}€
          </p>
        </motion.div>

        {/* Pending */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-anthracite-100 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs text-anthracite-400">En attente</span>
          </div>
          <p className="text-xl font-bold text-anthracite-900">{pendingTransactions}</p>
          <p className="text-xs text-anthracite-400 mt-0.5">transactions</p>
        </motion.div>
      </div>

      {/* Volume bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white border border-anthracite-100 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-anthracite-500">Volume total</span>
          <span className="text-sm font-medium text-anthracite-900">
            {formatAmount(totalVolume)} XRP
          </span>
        </div>
        <div className="h-2 bg-anthracite-100 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: totalVolume > 0 ? `${(escrowBalance / totalVolume) * 100}%` : '0%' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full bg-anthracite-900"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: totalVolume > 0 ? `${(totalPaid / totalVolume) * 100}%` : '0%' }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full bg-anthracite-400"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-anthracite-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-anthracite-900 rounded-full" />
            Escrow
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-anthracite-400 rounded-full" />
            Payé
          </span>
        </div>
      </motion.div>

      {/* Recent transactions */}
      {recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-2">
            Transactions récentes
          </p>
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((tx, i) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                <button
                  onClick={() => handleTxClick(tx.hash)}
                  className="w-full bg-white border border-anthracite-100 rounded-xl p-3 text-left hover:border-anthracite-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${tx.status === 'success' ? 'bg-anthracite-100' :
                        tx.status === 'pending' ? 'bg-anthracite-50' : 'bg-anthracite-50'}
                    `}>
                      {tx.type === 'escrow_create' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                      {tx.type === 'escrow_finish' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          <line x1="12" y1="11" x2="12" y2="17" />
                        </svg>
                      )}
                      {tx.type === 'nft_mint' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}
                      {tx.type === 'payment' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-anthracite-900">
                          {TRANSACTION_LABELS[tx.type]}
                        </span>
                        {tx.status === 'pending' && (
                          <motion.span
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-xs bg-anthracite-100 text-anthracite-600 px-1.5 py-0.5 rounded"
                          >
                            En cours
                          </motion.span>
                        )}
                      </div>
                      <p className="text-xs text-anthracite-400 truncate">
                        {tx.workerName || shortenHash(tx.hash, 8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        tx.type === 'payment' || tx.type === 'escrow_finish' ? 'text-anthracite-600' : 'text-anthracite-900'
                      }`}>
                        {tx.type === 'payment' || tx.type === 'escrow_finish' ? '-' : '+'}{formatAmount(tx.amount)} XRP
                      </p>
                      <p className="text-xs text-anthracite-400">
                        {new Date(tx.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expandedTx === tx.hash && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-anthracite-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-anthracite-400">Hash</span>
                            <a
                              href={getTransactionURL(tx.hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation()
                                sounds.blockchain()
                              }}
                              className="text-anthracite-600 hover:text-anthracite-900 font-mono flex items-center gap-1"
                            >
                              {shortenHash(tx.hash, 10)}
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-anthracite-400">Équivalent EUR</span>
                            <span className="text-anthracite-600">{(tx.eurAmount ?? xrpToEur(tx.amount)).toFixed(2)}€</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-anthracite-400">Heure</span>
                            <span className="text-anthracite-600">
                              {new Date(tx.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Wallet address footer */}
      {walletAddress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-anthracite-50 rounded-xl p-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-anthracite-400 mb-0.5">Wallet</p>
              <p className="text-xs font-mono text-anthracite-600">{shortenHash(walletAddress, 10)}</p>
            </div>
            <a
              href={`https://testnet.xrpl.org/accounts/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.blockchain()}
              className="text-xs text-anthracite-500 hover:text-anthracite-900 flex items-center gap-1 transition-colors"
            >
              Explorer
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </motion.div>
      )}
    </div>
  )
}
