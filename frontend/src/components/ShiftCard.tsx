import { motion } from 'framer-motion'

export interface Shift {
  id: string
  title: string
  company: string
  location: string
  address: string
  date: string
  startTime: string
  endTime: string
  duration: string
  hourlyRate: number
  totalAmount: number
  status: 'available' | 'pending' | 'accepted' | 'active' | 'completed' | 'validating'
  description?: string
  requirements?: string[]
}

interface ShiftCardProps {
  shift: Shift
  onClick?: () => void
  variant?: 'default' | 'compact' | 'active'
  className?: string
}

const statusConfig = {
  available: { label: 'Disponible', dotColor: 'bg-anthracite-300' },
  pending: { label: 'En attente', dotColor: 'bg-amber-400' },
  accepted: { label: 'Accepté', dotColor: 'bg-anthracite-900' },
  active: { label: 'En cours', dotColor: 'bg-anthracite-900 animate-pulse' },
  completed: { label: 'Terminé', dotColor: 'bg-anthracite-400' },
  validating: { label: 'Validation', dotColor: 'bg-amber-400 animate-pulse' },
}

export function ShiftCard({
  shift,
  onClick,
  variant = 'default',
  className = '',
}: ShiftCardProps) {
  const status = statusConfig[shift.status]

  if (variant === 'active') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-anthracite-900 text-white rounded-2xl p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
          <span className="text-xs text-anthracite-400 uppercase tracking-wide">
            {status.label}
          </span>
        </div>

        <h3 className="text-lg font-medium mb-1">{shift.title}</h3>
        <p className="text-sm text-anthracite-400 mb-4">{shift.company}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-anthracite-300">
            <span>{shift.startTime} - {shift.endTime}</span>
            <span>·</span>
            <span>{shift.location}</span>
          </div>
          <span className="font-medium">{shift.totalAmount.toFixed(2)}€</span>
        </div>
      </motion.div>
    )
  }

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={`bg-white border border-anthracite-100 rounded-xl p-3 cursor-pointer transition-all hover:border-anthracite-200 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-medium text-anthracite-900 truncate">
                {shift.title}
              </h3>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dotColor}`} />
            </div>
            <p className="text-xs text-anthracite-500 truncate">
              {shift.company} · {shift.date}
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-sm font-medium text-anthracite-900">
              {shift.hourlyRate}€/h
            </p>
            <p className="text-xs text-anthracite-400">{shift.duration}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white border border-anthracite-100 rounded-xl p-4 cursor-pointer transition-all hover:border-anthracite-200 hover:shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-anthracite-900 mb-0.5">{shift.title}</h3>
          <p className="text-sm text-anthracite-500">{shift.company}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
          <span className="text-xs text-anthracite-500">{status.label}</span>
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-4 text-xs text-anthracite-500 mb-3">
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          <span>{shift.date}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{shift.startTime} - {shift.endTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{shift.location}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-anthracite-50">
        <span className="text-sm text-anthracite-500">{shift.duration}</span>
        <div className="text-right">
          <span className="text-base font-medium text-anthracite-900">
            {shift.totalAmount.toFixed(2)}€
          </span>
          <span className="text-xs text-anthracite-400 ml-1">
            ({shift.hourlyRate}€/h)
          </span>
        </div>
      </div>
    </motion.div>
  )
}
