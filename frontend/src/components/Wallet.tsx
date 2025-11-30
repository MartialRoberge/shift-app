import { motion } from 'framer-motion'

interface WalletProps {
  balance: number
  pendingAmount?: number
  weeklyEarnings?: number[]
  totalHours?: number
  completedShifts?: number
  className?: string
}

export function Wallet({
  balance,
  pendingAmount = 0,
  weeklyEarnings = [45, 78, 92, 56, 0, 0, 0],
  totalHours = 32,
  completedShifts = 4,
  className = '',
}: WalletProps) {
  const maxEarning = Math.max(...weeklyEarnings, 1)
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div className={className}>
      {/* Solde principal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-anthracite-900 text-white rounded-2xl p-5 mb-4"
      >
        <p className="text-xs text-anthracite-400 mb-1">Solde disponible</p>
        <p className="text-3xl font-medium tracking-tight">
          {balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
        </p>
        {pendingAmount > 0 && (
          <p className="text-xs text-anthracite-400 mt-2">
            +{pendingAmount.toFixed(2)}€ en attente
          </p>
        )}
      </motion.div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-anthracite-100 rounded-xl p-4"
        >
          <p className="text-2xl font-medium text-anthracite-900">{totalHours}h</p>
          <p className="text-xs text-anthracite-400">Cette semaine</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-anthracite-100 rounded-xl p-4"
        >
          <p className="text-2xl font-medium text-anthracite-900">{completedShifts}</p>
          <p className="text-xs text-anthracite-400">Shifts complétés</p>
        </motion.div>
      </div>

      {/* Graphique de la semaine */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-anthracite-100 rounded-xl p-4"
      >
        <p className="text-xs text-anthracite-400 mb-4">Gains cette semaine</p>

        <div className="flex items-end justify-between h-20 gap-2">
          {weeklyEarnings.map((earning, i) => {
            const height = earning > 0 ? (earning / maxEarning) * 100 : 4
            const isToday = i === new Date().getDay() - 1

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
                  className={`w-full rounded-sm ${
                    earning > 0 ? 'bg-anthracite-900' : 'bg-anthracite-100'
                  } ${isToday ? 'ring-2 ring-anthracite-300 ring-offset-1' : ''}`}
                  style={{ minHeight: '4px' }}
                />
                <span
                  className={`text-[10px] ${
                    isToday ? 'text-anthracite-900 font-medium' : 'text-anthracite-400'
                  }`}
                >
                  {days[i]}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between mt-4 pt-3 border-t border-anthracite-50">
          <span className="text-xs text-anthracite-400">Total semaine</span>
          <span className="text-sm font-medium text-anthracite-900">
            {weeklyEarnings.reduce((a, b) => a + b, 0).toFixed(2)}€
          </span>
        </div>
      </motion.div>
    </div>
  )
}

// Mini version pour afficher juste le solde
export function WalletMini({
  balance,
  onClick,
  className = '',
}: {
  balance: number
  onClick?: () => void
  className?: string
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-2 bg-anthracite-900 text-white px-4 py-2 rounded-full ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" x2="23" y1="10" y2="10" />
      </svg>
      <span className="text-sm font-medium">{balance.toFixed(2)}€</span>
    </motion.button>
  )
}
