import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { sounds } from '@/lib/sounds'

interface SuccessOverlayProps {
  show: boolean
  type: 'validation' | 'payment' | 'login' | 'shift-start' | 'shift-end' | 'refuse'
  title?: string
  subtitle?: string
  amount?: number
  onComplete?: () => void
  duration?: number
}

const configs = {
  validation: {
    icon: (
      <motion.svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.polyline
          points="20 6 9 17 4 12"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        />
      </motion.svg>
    ),
    bgColor: 'from-emerald-500 to-emerald-600',
    defaultTitle: 'Shift validé !',
    defaultSubtitle: 'Escrow créé sur XRPL',
    sound: () => sounds.success(),
  },
  payment: {
    icon: (
      <motion.svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </motion.svg>
    ),
    bgColor: 'from-anthracite-800 to-anthracite-900',
    defaultTitle: 'Paiement effectué !',
    defaultSubtitle: 'Transfert XRPL confirmé',
    sound: () => sounds.payment(),
  },
  login: {
    icon: (
      <motion.svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
        <motion.circle
          cx="12"
          cy="7"
          r="4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3, type: 'spring' }}
        />
      </motion.svg>
    ),
    bgColor: 'from-anthracite-700 to-anthracite-800',
    defaultTitle: 'Bienvenue !',
    defaultSubtitle: 'Connexion réussie',
    sound: () => sounds.success(),
  },
  'shift-start': {
    icon: (
      <motion.svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
        <motion.polyline
          points="12 6 12 12 16 14"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
      </motion.svg>
    ),
    bgColor: 'from-blue-500 to-blue-600',
    defaultTitle: 'Shift démarré !',
    defaultSubtitle: 'Bon travail',
    sound: () => sounds.shiftStart(),
  },
  'shift-end': {
    icon: (
      <motion.svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.polyline
          points="20 6 9 17 4 12"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        />
      </motion.svg>
    ),
    bgColor: 'from-emerald-500 to-emerald-600',
    defaultTitle: 'Shift terminé !',
    defaultSubtitle: 'En attente de validation',
    sound: () => sounds.shiftEnd(),
  },
  refuse: {
    icon: (
      <motion.svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.line
          x1="18"
          y1="6"
          x2="6"
          y2="18"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        />
        <motion.line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        />
      </motion.svg>
    ),
    bgColor: 'from-red-500 to-red-600',
    defaultTitle: 'Shift refusé',
    defaultSubtitle: 'Le shift a été refusé',
    sound: () => sounds.error(),
  },
}

// Particules pour la célébration
function Particles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    delay: i * 0.03,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{
            x: '-50%',
            y: '-50%',
            scale: 0,
            opacity: 1
          }}
          animate={{
            x: `calc(-50% + ${Math.cos(p.angle * Math.PI / 180) * 80}px)`,
            y: `calc(-50% + ${Math.sin(p.angle * Math.PI / 180) * 80}px)`,
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.6,
            delay: 0.1 + p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

export function SuccessOverlay({
  show,
  type,
  title,
  subtitle,
  amount,
  onComplete,
  duration = 1800,
}: SuccessOverlayProps) {
  const config = configs[type]

  useEffect(() => {
    if (show) {
      // Play sound
      config.sound()

      // Auto-close
      const timer = setTimeout(() => {
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, onComplete, config])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`relative bg-gradient-to-br ${config.bgColor} rounded-3xl p-8 mx-6 max-w-sm w-full shadow-2xl`}
          >
            <Particles />

            {/* Icon circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              {config.icon}
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center text-white"
            >
              <h2 className="text-2xl font-bold mb-2">
                {title || config.defaultTitle}
              </h2>
              <p className="text-white/80">
                {subtitle || config.defaultSubtitle}
              </p>

              {/* Amount display for payments */}
              {amount !== undefined && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 bg-white/20 rounded-xl py-3 px-6 inline-block"
                >
                  <span className="text-3xl font-bold">{amount.toFixed(2)}€</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
