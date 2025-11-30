import { motion } from 'framer-motion'

interface XRPLLinksProps {
  escrowTx?: string | null
  nftId?: string | null
  paymentTx?: string | null
  network?: 'testnet' | 'mainnet'
  compact?: boolean
}

export function XRPLLinks({ escrowTx, nftId, paymentTx, network = 'testnet', compact = false }: XRPLLinksProps) {
  const baseUrl = network === 'testnet'
    ? 'https://testnet.xrpl.org'
    : 'https://livenet.xrpl.org'

  const hasAnyLink = escrowTx || nftId || paymentTx

  if (!hasAnyLink) return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {escrowTx && (
          <a
            href={`${baseUrl}/transactions/${escrowTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Escrow
          </a>
        )}
        {nftId && (
          <a
            href={`${baseUrl}/nft/${nftId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full hover:bg-purple-100 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            NFT
          </a>
        )}
        {paymentTx && (
          <a
            href={`${baseUrl}/transactions/${paymentTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full hover:bg-green-100 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Paiement
          </a>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-anthracite-50 to-anthracite-100 rounded-xl p-4 border border-anthracite-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-anthracite-900 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-medium text-anthracite-900">Preuve Blockchain</h4>
          <p className="text-xs text-anthracite-500">XRPL {network === 'testnet' ? 'Testnet' : 'Mainnet'}</p>
        </div>
      </div>

      <div className="space-y-2">
        {escrowTx && (
          <a
            href={`${baseUrl}/transactions/${escrowTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-anthracite-100 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-anthracite-900">Escrow Transaction</p>
                <p className="text-xs text-anthracite-500 font-mono">{escrowTx.slice(0, 8)}...{escrowTx.slice(-8)}</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}

        {nftId && (
          <a
            href={`${baseUrl}/nft/${nftId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-anthracite-100 hover:border-purple-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-anthracite-900">NFT Certificat</p>
                <p className="text-xs text-anthracite-500 font-mono">{nftId.slice(0, 8)}...{nftId.slice(-8)}</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}

        {paymentTx && (
          <a
            href={`${baseUrl}/transactions/${paymentTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-anthracite-100 hover:border-green-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-anthracite-900">Paiement XRP</p>
                <p className="text-xs text-anthracite-500 font-mono">{paymentTx.slice(0, 8)}...{paymentTx.slice(-8)}</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>

      <p className="text-xs text-anthracite-400 mt-3 text-center">
        Cliquez pour vérifier sur l'explorateur XRPL
      </p>
    </motion.div>
  )
}
