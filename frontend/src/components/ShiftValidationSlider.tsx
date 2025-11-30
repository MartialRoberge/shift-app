import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface ShiftValidationSliderProps {
  onValidate: () => void
  onRefuse: () => void
  disabled?: boolean
  amount?: number
  isSubmitting?: boolean
}

export function ShiftValidationSlider({
  onValidate,
  onRefuse,
  disabled = false,
  amount = 0,
  isSubmitting = false,
}: ShiftValidationSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [action, setAction] = useState<'none' | 'validate' | 'refuse'>('none')
  const constraintsRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)

  // Thresholds
  const threshold = 100

  // Subtle background opacity based on position
  const validateBg = useTransform(x, [0, threshold], [0, 0.08])
  const refuseBg = useTransform(x, [-threshold, 0], [0.08, 0])

  // Icon opacity
  const validateIconOpacity = useTransform(x, [30, threshold], [0.3, 1])
  const refuseIconOpacity = useTransform(x, [-threshold, -30], [1, 0.3])

  // Progress indicator
  const progress = useTransform(x, [-threshold, 0, threshold], [-100, 0, 100])

  const handleDragEnd = () => {
    setIsDragging(false)
    const currentX = x.get()

    if (currentX > threshold * 0.8) {
      setAction('validate')
      // Animate to end then trigger
      animate(x, threshold + 20, { duration: 0.15, ease: 'easeOut' }).then(() => {
        onValidate()
      })
    } else if (currentX < -threshold * 0.8) {
      setAction('refuse')
      animate(x, -threshold - 20, { duration: 0.15, ease: 'easeOut' }).then(() => {
        onRefuse()
      })
    } else {
      // Spring back to center
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
      setAction('none')
    }
  }

  if (isSubmitting) {
    return (
      <div className="relative h-14 bg-anthracite-50 rounded-2xl flex items-center justify-center border border-anthracite-100">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-anthracite-900 border-t-transparent rounded-full"
          />
          <span className="text-sm text-anthracite-600 font-medium">
            {action === 'validate' ? 'Création escrow...' : action === 'refuse' ? 'Refus...' : 'Traitement...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Minimal instruction */}
      <p className="text-center text-xs text-anthracite-400 tracking-wide">
        Glisser pour décider
      </p>

      {/* Slider container */}
      <div
        ref={trackRef}
        className="relative h-14 rounded-2xl overflow-hidden bg-anthracite-50 border border-anthracite-100"
      >
        {/* Background indicators */}
        <motion.div
          style={{ opacity: refuseBg }}
          className="absolute inset-0 bg-red-500"
        />
        <motion.div
          style={{ opacity: validateBg }}
          className="absolute inset-0 bg-emerald-500"
        />

        {/* Left icon (refuse) */}
        <motion.div
          style={{ opacity: refuseIconOpacity }}
          className="absolute left-4 top-1/2 -translate-y-1/2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </motion.div>

        {/* Right icon (validate) */}
        <motion.div
          style={{ opacity: validateIconOpacity }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        {/* Drag constraints */}
        <div
          ref={constraintsRef}
          className="absolute inset-0"
        />

        {/* Thumb */}
        <motion.div
          drag={disabled ? false : 'x'}
          dragConstraints={constraintsRef}
          dragElastic={0.05}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            w-12 h-10 rounded-xl
            ${disabled ? 'bg-anthracite-200' : 'bg-anthracite-900'}
            shadow-sm flex items-center justify-center
            cursor-grab active:cursor-grabbing
            transition-shadow duration-150
            ${isDragging ? 'shadow-md' : ''}
          `}
        >
          {/* Grip lines */}
          <div className="flex gap-[3px]">
            <div className="w-[2px] h-4 bg-white/25 rounded-full" />
            <div className="w-[2px] h-4 bg-white/25 rounded-full" />
            <div className="w-[2px] h-4 bg-white/25 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Amount preview */}
      {amount > 0 && (
        <p className="text-center text-xs text-anthracite-400">
          <span className="font-medium text-anthracite-600">{amount.toFixed(2)}€</span> en escrow XRPL
        </p>
      )}
    </div>
  )
}
