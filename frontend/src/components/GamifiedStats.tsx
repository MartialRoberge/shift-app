import { motion } from 'framer-motion'
import { useSounds } from '@/lib/sounds'

interface GamifiedStatsProps {
  totalShifts: number
  totalHours: number
  totalEarnings: number
  streak?: number
}

export function GamifiedStats({
  totalShifts,
  totalHours,
  totalEarnings,
  streak = 0,
}: GamifiedStatsProps) {
  const sounds = useSounds()

  return (
    <div className="space-y-4">
      {/* Stats principales - Design épuré */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onTap={() => sounds.tap()}
          className="bg-white border border-anthracite-100 rounded-xl p-4 text-center cursor-default"
        >
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
            className="text-2xl font-medium text-anthracite-900"
          >
            {totalShifts}
          </motion.p>
          <p className="text-xs text-anthracite-400 mt-1">Shifts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onTap={() => sounds.tap()}
          className="bg-white border border-anthracite-100 rounded-xl p-4 text-center cursor-default"
        >
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.15 }}
            className="text-2xl font-medium text-anthracite-900"
          >
            {totalHours.toFixed(0)}
            <span className="text-sm text-anthracite-400">h</span>
          </motion.p>
          <p className="text-xs text-anthracite-400 mt-1">Travaillées</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onTap={() => sounds.tap()}
          className="bg-white border border-anthracite-100 rounded-xl p-4 text-center cursor-default"
        >
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
            className="text-2xl font-medium text-anthracite-900"
          >
            {totalEarnings.toFixed(0)}
            <span className="text-sm text-anthracite-400">€</span>
          </motion.p>
          <p className="text-xs text-anthracite-400 mt-1">Gagnés</p>
        </motion.div>
      </div>

      {/* Streak indicator - Minimaliste */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-anthracite-900 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </motion.div>
            </div>
            <div>
              <p className="text-white font-medium">{streak} jours</p>
              <p className="text-xs text-anthracite-400">Série en cours</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[...Array(Math.min(streak, 7))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="w-2 h-2 bg-white rounded-full"
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
