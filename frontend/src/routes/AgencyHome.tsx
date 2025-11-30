import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BottomNav, NavIcons } from '@/components/BottomNav'
import { XRPLLinks, MapPreview, AddressAutocomplete, AIInsights, ShiftValidationSlider, ShiftBlockchainFlow, XRPLWalletCard, XRPLStats, SuccessOverlay, DualAmount, ExchangeRateBadge } from '@/components'
import { auth } from '@/lib/auth'
import { employerApi, missionsApi, workersApi, statsApi, shiftsApi, xrplApi } from '@/lib/api'
import { useSounds } from '@/lib/sounds'
import { useXRPExchangeRate } from '@/lib/xrp-exchange'

// Types
interface Shift {
  id: string
  worker_id: string
  worker_name: string
  worker_xrpl_address?: string
  employer_id: string
  employer_name: string
  mission_id?: string
  mission_title?: string
  start_time: string
  end_time?: string
  hours?: number
  hourly_rate?: number
  amount_total?: number
  status: 'proposed' | 'validated' | 'paid' | 'refused'
  stt_start_text?: string
  stt_end_text?: string
  llm_structured_json?: {
    job_type?: string
    notes?: string
    summary?: string
    issues?: string[]
    risk_flags?: string[]
    legal_flags?: string[]
    confidence?: number
    sentiment?: 'positive' | 'neutral' | 'negative'
    energy_level?: number
    mood?: string
    key_phrases?: string[]
    recommendations?: string[]
  }
  xrpl_nft_id?: string
  xrpl_escrow_tx?: string
  xrpl_payment_tx?: string
}

interface Mission {
  id: string
  title: string
  description: string
  location: string
  address: string
  hourly_rate: number
  total_hours_needed: number
  hours_completed: number
  status: 'active' | 'completed' | 'draft' | 'cancelled'
  pending_candidates?: number
  active_workers?: number
  created_at: string
}

interface Worker {
  id: string
  name: string
  email?: string
  avatar?: string
  xrpl_address?: string
  total_shifts: number
  completed_shifts: number
  total_hours: number
  rating: number
  last_shift?: string
}

interface Candidate {
  id: string
  worker_id: string
  worker_name: string
  worker_email?: string
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
  completed_shifts?: number
  avg_rating?: number
}

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

interface XRPLDashboardData {
  escrowBalance: number
  totalPaid: number
  pendingTransactions: number
  recentTransactions: XRPLTransaction[]
  walletAddress?: string
}

// Nav items
const navItems = [
  { id: 'home', label: 'Accueil', icon: NavIcons.home },
  { id: 'missions', label: 'Missions', icon: NavIcons.briefcase },
  { id: 'wallet', label: 'Stats', icon: NavIcons.wallet },
  { id: 'profile', label: 'Profil', icon: NavIcons.profile },
]

export function AgencyHome() {
  const navigate = useNavigate()
  const user = auth.getUser()
  const sounds = useSounds()
  const { rate: xrpRate, toXRP } = useXRPExchangeRate()
  const [tab, setTab] = useState<'home' | 'missions' | 'wallet' | 'profile'>('home')
  const [view, setView] = useState<'main' | 'shift-detail' | 'mission-detail' | 'worker-detail' | 'new-mission' | 'candidates'>('main')

  // Data states
  const [pendingShifts, setPendingShifts] = useState<Shift[]>([])
  const [validatedShifts, setValidatedShifts] = useState<Shift[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [stats, setStats] = useState<{ total_hours: number; total_escrow: number; total_paid: number; total_shifts: number } | null>(null)
  const [xrplDashboard, setXrplDashboard] = useState<XRPLDashboardData | null>(null)
  const [xrplLoading, setXrplLoading] = useState(false)

  // Selected items
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [workerShifts, setWorkerShifts] = useState<Shift[]>([])
  const [workerDetails, setWorkerDetails] = useState<{ total_earned?: number } | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Success overlay state
  const [successOverlay, setSuccessOverlay] = useState<{
    show: boolean
    type: 'validation' | 'payment' | 'refuse'
    amount?: number
  }>({ show: false, type: 'validation' })

  // New mission form
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    location: '',
    address: '',
    hourly_rate: 15,
    total_hours_needed: 100,
    latitude: 48.8566,
    longitude: 2.3522,
  })

  // Load XRPL dashboard data
  const loadXrplDashboard = useCallback(async () => {
    try {
      setXrplLoading(true)
      const data = await xrplApi.getDashboard()
      // Add eurAmount using real-time rate
      const transactionsWithEur = data.recentTransactions.map((tx: XRPLTransaction) => ({
        ...tx,
        eurAmount: tx.amount * xrpRate, // Use real-time rate
      }))
      setXrplDashboard({
        ...data,
        recentTransactions: transactionsWithEur,
      })
    } catch (err: any) {
      console.warn('Could not load XRPL dashboard:', err.message)
    } finally {
      setXrplLoading(false)
    }
  }, [xrpRate])

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [shiftsRes, missionsRes, workersRes, statsRes] = await Promise.all([
        employerApi.getShifts(),
        missionsApi.getMyMissions().catch(() => ({ missions: [] })),
        workersApi.getAll().catch(() => ({ workers: [] })),
        statsApi.getGlobal().catch(() => null),
      ])

      const allShifts = shiftsRes.shifts || []
      setPendingShifts(allShifts.filter((s: Shift) => s.status === 'proposed'))
      setValidatedShifts(allShifts.filter((s: Shift) => s.status === 'validated' || s.status === 'paid'))
      setMissions(missionsRes.missions || [])
      setWorkers(workersRes.workers || [])
      setStats(statsRes)
      
      // Mettre à jour le shift sélectionné s'il existe
      if (selectedShift) {
        const updatedShift = allShifts.find((s: Shift) => s.id === selectedShift.id)
        if (updatedShift) {
          setSelectedShift(updatedShift)
        }
      }

      // Load XRPL dashboard separately
      loadXrplDashboard()
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [loadXrplDashboard])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers
  const handleTabChange = (id: string) => {
    setTab(id as typeof tab)
    setView('main')
    setSelectedShift(null)
    setSelectedMission(null)
    setSelectedWorker(null)
  }

  const handleValidateShift = async (shiftId: string, adjustments?: { hourly_rate?: number }) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await employerApi.validateShift(shiftId, adjustments)

      // Show success overlay FIRST with amount from result
      setSuccessOverlay({
        show: true,
        type: 'validation',
        amount: result.amount_total || selectedShift?.amount_total,
      })

      // Recharger les données en arrière-plan
      loadData()

    } catch (err: any) {
      console.error('❌ Error validating shift:', err)
      console.error('Error details:', err.response?.data || err.message)

      // Afficher un message d'erreur détaillé
      const errorMessage = err.response?.data?.details ||
                          err.response?.data?.error ||
                          err.message ||
                          'Erreur lors de la validation du shift'
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleSuccessOverlayComplete = () => {
    setSuccessOverlay({ show: false, type: 'validation' })
    setIsSubmitting(false)
    setView('main')
    setSelectedShift(null)
  }

  const handleRefuseShift = async (shiftId: string) => {
    setIsSubmitting(true)
    try {
      await employerApi.refuseShift(shiftId)
      // Show refuse overlay
      setSuccessOverlay({
        show: true,
        type: 'refuse',
      })
      await loadData()
    } catch (err: any) {
      console.error('Error refusing shift:', err)
      setError(err.message || 'Erreur lors du refus')
      setIsSubmitting(false)
    }
  }

  const handleReleasePayment = async (shiftId: string) => {
    setIsSubmitting(true)
    try {
      await shiftsApi.releasePayment(shiftId)
      // Show payment success overlay
      setSuccessOverlay({
        show: true,
        type: 'payment',
        amount: selectedShift?.amount_total,
      })
      await loadData()
    } catch (err: any) {
      console.error('Error releasing payment:', err)
      setError(err.message || 'Erreur lors du paiement')
      setIsSubmitting(false)
    }
  }

  const handleCreateMission = async () => {
    if (!newMission.title) {
      setError('Le titre est requis')
      return
    }

    setIsSubmitting(true)
    try {
      await missionsApi.create(newMission)
      await loadData()
      setView('main')
      setNewMission({
        title: '',
        description: '',
        location: '',
        address: '',
        hourly_rate: 15,
        total_hours_needed: 100,
        latitude: 48.8566,
        longitude: 2.3522,
      })
    } catch (err: any) {
      console.error('Error creating mission:', err)
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoadCandidates = async (missionId: string) => {
    try {
      const res = await missionsApi.getCandidates(missionId)
      setCandidates(res.candidates || [])
    } catch (err: any) {
      console.error('Error loading candidates:', err)
    }
  }

  const handleLoadWorkerDetails = async (workerId: string) => {
    try {
      const [detailsRes, shiftsRes] = await Promise.all([
        workersApi.getWorker(workerId),
        workersApi.getWorkerShifts(workerId)
      ])
      setWorkerDetails(detailsRes)
      setWorkerShifts(shiftsRes.shifts || [])
    } catch (err: any) {
      console.error('Error loading worker details:', err)
    }
  }

  const handleAcceptCandidate = async (missionId: string, workerId: string) => {
    setIsSubmitting(true)
    try {
      await missionsApi.acceptCandidate(missionId, workerId)
      await handleLoadCandidates(missionId)
      await loadData()
    } catch (err: any) {
      console.error('Error accepting candidate:', err)
      setError(err.message || 'Erreur lors de l\'acceptation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectCandidate = async (missionId: string, workerId: string) => {
    setIsSubmitting(true)
    try {
      await missionsApi.rejectCandidate(missionId, workerId)
      await handleLoadCandidates(missionId)
    } catch (err: any) {
      console.error('Error rejecting candidate:', err)
      setError(err.message || 'Erreur lors du rejet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    auth.logout()
    navigate('/select-role')
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'proposed': return 'En attente'
      case 'validated': return 'Validé'
      case 'paid': return 'Payé'
      case 'refused': return 'Refusé'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'bg-anthracite-100 text-anthracite-600'
      case 'validated': return 'bg-anthracite-200 text-anthracite-700'
      case 'paid': return 'bg-anthracite-900 text-white'
      case 'refused': return 'bg-anthracite-50 text-anthracite-400 line-through'
      default: return 'bg-anthracite-100 text-anthracite-700'
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR')
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const showBottomNav = view === 'main'

  // Loading
  if (isLoading && !pendingShifts.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-anthracite-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-anthracite-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">

        {/* ==================== HOME TAB ==================== */}
        {tab === 'home' && view === 'main' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-6 pt-12 pb-28 max-w-lg mx-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <button
                  onClick={() => navigate('/select-role')}
                  className="text-xs text-anthracite-400 hover:text-anthracite-600 transition-colors mb-1"
                >
                  ← Changer
                </button>
                <h1 className="text-2xl font-medium text-anthracite-900">
                  Bonjour{user?.name ? `, ${user.name.split(' ')[0]}` : ''} !
                </h1>
                <p className="text-anthracite-400 text-sm">Agence</p>
              </div>
              {stats && (
                <motion.div
                  className="text-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <p className="text-2xl font-medium text-anthracite-900">{stats.total_shifts}</p>
                  <p className="text-xs text-anthracite-400">shifts total</p>
                </motion.div>
              )}
            </div>

            {/* XRPL Blockchain Status Card - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-anthracite-900 via-anthracite-800 to-anthracite-900 rounded-2xl p-5 mb-6 relative overflow-hidden"
            >
              {/* Animated blockchain network lines */}
              <div className="absolute inset-0 overflow-hidden">
                <svg className="absolute w-full h-full opacity-10" viewBox="0 0 400 200">
                  <motion.path
                    d="M0 100 Q 100 50, 200 100 T 400 100"
                    stroke="white"
                    strokeWidth="1"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.path
                    d="M0 150 Q 100 100, 200 150 T 400 150"
                    stroke="white"
                    strokeWidth="1"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                  />
                </svg>
                {/* Floating nodes */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white/20 rounded-full"
                    style={{
                      left: `${15 + i * 15}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Animated blockchain icon */}
                    <motion.div
                      className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative"
                      whileHover={{ scale: 1.1 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/10 rounded-xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </motion.div>
                    <div>
                      <p className="text-white font-semibold text-base">XRP Ledger</p>
                      <div className="flex items-center gap-2">
                        <motion.span
                          className="w-2 h-2 bg-emerald-400 rounded-full"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="text-emerald-400 text-xs font-medium">Testnet Live</span>
                        <span className="text-white/40 text-[10px]">|</span>
                        <motion.span
                          className="text-white/60 text-[10px] font-mono"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          Ledger #...
                        </motion.span>
                      </div>
                    </div>
                  </div>
                  <ExchangeRateBadge className="text-white/60" />
                </div>

                {/* Stats with animated counters */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <motion.div
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/5"
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <p className="text-white/60 text-[10px]">Escrow</p>
                    </div>
                    <motion.p
                      className="text-white font-bold text-xl"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={xrplDashboard?.escrowBalance}
                    >
                      {xrplDashboard?.escrowBalance?.toFixed(1) || '0'}
                    </motion.p>
                    <p className="text-white/40 text-[10px]">
                      XRP ~ {((xrplDashboard?.escrowBalance || 0) * xrpRate).toFixed(0)}€
                    </p>
                  </motion.div>
                  <motion.div
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/5"
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <p className="text-white/60 text-[10px]">Paye</p>
                    </div>
                    <motion.p
                      className="text-white font-bold text-xl"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={xrplDashboard?.totalPaid}
                    >
                      {xrplDashboard?.totalPaid?.toFixed(1) || '0'}
                    </motion.p>
                    <p className="text-white/40 text-[10px]">
                      XRP ~ {((xrplDashboard?.totalPaid || 0) * xrpRate).toFixed(0)}€
                    </p>
                  </motion.div>
                  <motion.div
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/5 relative"
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                    {pendingShifts.length > 0 && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <p className="text-white/60 text-[10px]">En attente</p>
                    </div>
                    <p className="text-white font-bold text-xl">{pendingShifts.length}</p>
                    <p className="text-white/40 text-[10px]">shifts</p>
                  </motion.div>
                </div>

                {/* Transaction flow indicator */}
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between text-[10px] text-white/50 mb-2">
                    <span>Flux de transactions</span>
                    <span>3-5 sec/ledger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 via-white to-emerald-400"
                        style={{ width: '30%' }}
                        animate={{ x: ['0%', '250%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <motion.div
                      className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-9-9c2.52 0 4.83 1.02 6.5 2.67" />
                        <polyline points="21 3 21 9 15 9" />
                      </svg>
                    </motion.div>
                  </div>
                </div>

                <a
                  href={`https://testnet.xrpl.org/accounts/rN8fs9GwbvkjGLjh4CMTfHX9rcF8LSSTV3`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-all rounded-xl py-3 text-white/90 hover:text-white text-sm font-medium group"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span>Explorer le compte XRPL</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </motion.div>

            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
              >
                <p className="text-sm text-red-700">{error}</p>
                <button onClick={() => setError(null)} className="text-xs text-red-500 underline mt-1">Fermer</button>
              </motion.div>
            )}

            {/* Pending shifts to validate */}
            {pendingShifts.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">
                    À valider ({pendingShifts.length})
                  </p>
                  <span className="w-2 h-2 bg-anthracite-600 rounded-full animate-pulse" />
                </div>
                <div className="space-y-3">
                  {pendingShifts.slice(0, 5).map((shift, i) => (
                    <motion.button
                      key={shift.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedShift(shift)
                        setView('shift-detail')
                      }}
                      className="w-full bg-white border border-anthracite-200 rounded-xl p-4 text-left hover:border-anthracite-300"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-anthracite-900">{shift.worker_name}</h3>
                          <p className="text-xs text-anthracite-500">{shift.mission_title || 'Shift direct'}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(shift.status)}`}>
                          {getStatusLabel(shift.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-anthracite-500">
                          {formatDate(shift.start_time)} · {shift.hours?.toFixed(1) || '?'}h
                        </span>
                        <span className="font-medium text-anthracite-900">{shift.amount_total?.toFixed(2) || '0'}€</span>
                      </div>
                      {shift.llm_structured_json?.confidence && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-anthracite-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-anthracite-900 rounded-full"
                              style={{ width: `${(shift.llm_structured_json.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-anthracite-400">
                            {(shift.llm_structured_json.confidence * 100).toFixed(0)}% IA
                          </span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Recent validated shifts */}
            {validatedShifts.length > 0 && (
              <section>
                <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                  Récents ({validatedShifts.length})
                </p>
                <div className="space-y-2">
                  {validatedShifts.slice(0, 5).map((shift, i) => (
                    <motion.button
                      key={shift.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      onClick={() => {
                        setSelectedShift(shift)
                        setView('shift-detail')
                      }}
                      className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-anthracite-900 text-sm">{shift.worker_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(shift.status)}`}>
                          {getStatusLabel(shift.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-anthracite-500">
                          {formatDate(shift.start_time)} · {shift.hours?.toFixed(1)}h
                        </span>
                        <span className="font-medium text-anthracite-900">{shift.amount_total?.toFixed(2)}€</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {pendingShifts.length === 0 && validatedShifts.length === 0 && (
              <div className="bg-anthracite-50 rounded-xl p-6 text-center">
                <p className="text-anthracite-500">Aucun shift pour le moment</p>
                <p className="text-xs text-anthracite-400 mt-1">Les shifts soumis par vos workers apparaîtront ici</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== MISSIONS TAB ==================== */}
        {tab === 'missions' && view === 'main' && (
          <motion.div
            key="missions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-6 pt-12 pb-28 max-w-lg mx-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-medium text-anthracite-900">Missions</h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('new-mission')}
                className="bg-anthracite-900 text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                + Nouvelle
              </motion.button>
            </div>

            {missions.length > 0 ? (
              <div className="space-y-3">
                {missions.map((mission, i) => (
                  <motion.button
                    key={mission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedMission(mission)
                      handleLoadCandidates(mission.id)
                      setView('mission-detail')
                    }}
                    className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-anthracite-900">{mission.title}</h3>
                          {mission.pending_candidates && mission.pending_candidates > 0 && (
                            <span className="bg-anthracite-200 text-anthracite-700 text-xs px-2 py-0.5 rounded-full">
                              {mission.pending_candidates} candidat{mission.pending_candidates > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-anthracite-500">{mission.location}</p>
                      </div>
                      <span className="font-medium text-anthracite-900">{mission.hourly_rate}€/h</span>
                    </div>
                    <div className="mt-3">
                      <div className="h-1 bg-anthracite-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-anthracite-900 rounded-full"
                          style={{ width: `${((mission.hours_completed || 0) / (mission.total_hours_needed || 100)) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-anthracite-400">
                        <span>{mission.hours_completed || 0}h / {mission.total_hours_needed}h</span>
                        <span>{mission.active_workers || 0} worker{(mission.active_workers || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="bg-anthracite-50 rounded-xl p-6 text-center">
                <p className="text-anthracite-500">Aucune mission</p>
                <p className="text-xs text-anthracite-400 mt-1">Créez votre première mission</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== STATS TAB - ENRICHED ==================== */}
        {tab === 'wallet' && view === 'main' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-6 pt-12 pb-28 max-w-lg mx-auto"
          >
            <h1 className="text-2xl font-medium text-anthracite-900 mb-6">Dashboard</h1>


            {/* XRPL Stats Dashboard - Real data from API */}
            <section className="mb-6">
              <XRPLStats
                escrowBalance={xrplDashboard?.escrowBalance || (stats?.total_escrow || 0)}
                totalPaid={xrplDashboard?.totalPaid || (stats?.total_paid || 0)}
                pendingTransactions={xrplDashboard?.pendingTransactions || pendingShifts.length}
                recentTransactions={xrplDashboard?.recentTransactions || []}
                walletAddress={xrplDashboard?.walletAddress || user?.xrpl_address}
                onRefresh={() => {
                  loadData()
                  loadXrplDashboard()
                }}
                loading={xrplLoading || isLoading}
              />
            </section>

            {/* Quick stats summary */}
            <section className="mb-6">
              <div className="grid grid-cols-4 gap-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-anthracite-900 text-white rounded-xl p-3 text-center"
                >
                  <p className="text-xl font-bold">{stats?.total_shifts || 0}</p>
                  <p className="text-[10px] text-anthracite-400">Shifts</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white border border-anthracite-100 rounded-xl p-3 text-center"
                >
                  <p className="text-xl font-bold text-anthracite-900">{stats?.total_hours?.toFixed(0) || 0}h</p>
                  <p className="text-[10px] text-anthracite-400">Heures</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border border-anthracite-100 rounded-xl p-3 text-center"
                >
                  <p className="text-xl font-bold text-anthracite-900">{workers.length}</p>
                  <p className="text-[10px] text-anthracite-400">Workers</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white border border-anthracite-100 rounded-xl p-3 text-center"
                >
                  <p className="text-xl font-bold text-anthracite-900">{missions.length}</p>
                  <p className="text-[10px] text-anthracite-400">Missions</p>
                </motion.div>
              </div>
            </section>

            {/* Workers list */}
            {workers.length > 0 && (
              <section>
                <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                  Workers ({workers.length})
                </p>
                <div className="space-y-2">
                  {workers.map((worker, i) => (
                    <motion.button
                      key={worker.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        sounds.tap()
                        setSelectedWorker(worker)
                        handleLoadWorkerDetails(worker.id)
                        setView('worker-detail')
                      }}
                      className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-anthracite-100 rounded-full flex items-center justify-center text-sm font-medium text-anthracite-600">
                          {worker.avatar || worker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-anthracite-900">{worker.name}</h3>
                          <p className="text-xs text-anthracite-500">
                            {worker.completed_shifts} shifts · {worker.total_hours.toFixed(0)}h
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-anthracite-900">
                            <span className="text-sm font-medium">{worker.rating.toFixed(1)}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-anthracite-400">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {/* ==================== PROFILE TAB ==================== */}
        {tab === 'profile' && view === 'main' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-6 pt-12 pb-28 max-w-lg mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-anthracite-100 rounded-full flex items-center justify-center text-2xl font-medium text-anthracite-600 mx-auto mb-3">
                {user?.avatar || user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'}
              </div>
              <h1 className="text-xl font-medium text-anthracite-900">{user?.name || 'Agence'}</h1>
              <p className="text-sm text-anthracite-500">Employeur</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">{missions.length}</p>
                <p className="text-xs text-anthracite-400">Missions</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">{workers.length}</p>
                <p className="text-xs text-anthracite-400">Workers</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">{stats?.total_shifts || 0}</p>
                <p className="text-xs text-anthracite-400">Shifts</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-white border border-anthracite-100 rounded-xl hover:border-anthracite-200 transition-colors text-anthracite-600"
              >
                <span className="text-sm">Déconnexion</span>
                <span className="text-anthracite-300">→</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== SHIFT DETAIL ==================== */}
        {view === 'shift-detail' && selectedShift && (
          <motion.div
            key="shift-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen p-6 pt-12 pb-8 max-w-lg mx-auto"
          >
            <button
              onClick={() => { setView('main'); setSelectedShift(null) }}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Retour
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-12 h-12 bg-anthracite-100 rounded-full flex items-center justify-center"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-medium text-anthracite-900">{selectedShift.worker_name}</h1>
                    <p className="text-sm text-anthracite-500">{selectedShift.mission_title || 'Shift direct'}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedShift.status)}`}>
                  {getStatusLabel(selectedShift.status)}
                </span>
              </div>
            </div>

            {/* Time & earnings card with animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-anthracite-900 to-anthracite-800 text-white rounded-2xl p-5 mb-6 relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/60 mb-1">Durée</p>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
                      className="text-3xl font-bold"
                    >
                      {selectedShift.hours?.toFixed(1) || '?'}h
                    </motion.p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60 mb-1">Montant</p>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
                      className="text-3xl font-bold text-white"
                    >
                      {selectedShift.amount_total?.toFixed(2) || '0'}€
                    </motion.p>
                  </div>
                </div>

                {/* Energy level bar */}
                {selectedShift.llm_structured_json?.energy_level !== undefined && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60">Niveau d'énergie</span>
                      <span className="text-sm font-medium">
                        {Math.round(selectedShift.llm_structured_json.energy_level * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedShift.llm_structured_json.energy_level * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className={`h-full rounded-full ${
                          selectedShift.llm_structured_json.energy_level > 0.7 ? 'bg-white' :
                          selectedShift.llm_structured_json.energy_level > 0.4 ? 'bg-white/70' : 'bg-white/40'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-xs text-white/40">Taux</p>
                    <p className="text-sm font-medium">{selectedShift.hourly_rate}€/h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/40">Date</p>
                    <p className="text-sm font-medium">{formatDate(selectedShift.start_time)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/40">Horaires</p>
                    <p className="text-sm font-medium">{formatTime(selectedShift.start_time)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Analysis with new component */}
            {selectedShift.llm_structured_json && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <AIInsights
                  analysis={selectedShift.llm_structured_json}
                  startTranscript={selectedShift.stt_start_text}
                  endTranscript={selectedShift.stt_end_text}
                />
              </motion.div>
            )}

            {/* Blockchain Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <ShiftBlockchainFlow
                status={selectedShift.status}
                escrowTx={selectedShift.xrpl_escrow_tx}
                nftId={selectedShift.xrpl_nft_id}
                paymentTx={selectedShift.xrpl_payment_tx}
                amount={selectedShift.amount_total}
              />
            </motion.div>

            {/* Actions with slider for proposed shifts */}
            {selectedShift.status === 'proposed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ShiftValidationSlider
                  onValidate={() => handleValidateShift(selectedShift.id)}
                  onRefuse={() => handleRefuseShift(selectedShift.id)}
                  disabled={isSubmitting}
                  amount={selectedShift.amount_total}
                  isSubmitting={isSubmitting}
                />
              </motion.div>
            )}

            {selectedShift.status === 'validated' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="bg-anthracite-50 border border-anthracite-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-sm font-medium text-anthracite-700">Fonds en escrow</span>
                  </div>
                  <p className="text-xs text-anthracite-600">
                    {selectedShift.amount_total?.toFixed(2)}€ sont bloqués sur XRPL.
                    Libérez-les pour payer le travailleur.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReleasePayment(selectedShift.id)}
                  disabled={isSubmitting}
                  className="w-full bg-anthracite-900 text-white py-4 rounded-xl font-medium shadow-lg shadow-anthracite-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Paiement en cours...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      Libérer {selectedShift.amount_total?.toFixed(2)}€ sur XRPL
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            {selectedShift.status === 'paid' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-anthracite-50 border border-anthracite-200 rounded-xl p-6 text-center"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
                  className="w-16 h-16 bg-anthracite-900 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <motion.svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <motion.polyline
                      points="20 6 9 17 4 12"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
                    />
                  </motion.svg>
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg font-semibold text-anthracite-900 mb-1"
                >
                  Paiement effectué
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-anthracite-600"
                >
                  {selectedShift.amount_total?.toFixed(2)}€ ont été transférés au travailleur via XRPL
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ==================== MISSION DETAIL ==================== */}
        {view === 'mission-detail' && selectedMission && (
          <motion.div
            key="mission-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen p-6 pt-12 pb-8 max-w-lg mx-auto"
          >
            <button
              onClick={() => { setView('main'); setSelectedMission(null); setCandidates([]) }}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Retour
            </button>

            <div className="mb-6">
              <h1 className="text-xl font-medium text-anthracite-900 mb-1">{selectedMission.title}</h1>
              <p className="text-anthracite-500">{selectedMission.location}</p>
            </div>

            <div className="bg-anthracite-900 text-white rounded-2xl p-5 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-anthracite-400 mb-1">Taux horaire</p>
                  <p className="text-2xl font-medium">{selectedMission.hourly_rate}€/h</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-anthracite-400 mb-1">Workers actifs</p>
                  <p className="text-2xl font-medium">{selectedMission.active_workers || 0}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-anthracite-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${((selectedMission.hours_completed || 0) / (selectedMission.total_hours_needed || 100)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-anthracite-400">
                  <span>{selectedMission.hours_completed || 0}h effectuées</span>
                  <span>{selectedMission.total_hours_needed}h objectif</span>
                </div>
              </div>
            </div>

            {selectedMission.description && (
              <div className="bg-white border border-anthracite-100 rounded-xl p-4 mb-6">
                <p className="text-xs text-anthracite-400 mb-1">Description</p>
                <p className="text-sm text-anthracite-900">{selectedMission.description}</p>
              </div>
            )}

            {/* Candidates */}
            {candidates.length > 0 && (
              <section>
                <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                  Candidatures ({candidates.length})
                </p>
                <div className="space-y-2">
                  {candidates.map((candidate, i) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white border border-anthracite-100 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-anthracite-100 rounded-full flex items-center justify-center text-sm font-medium text-anthracite-600">
                            {candidate.worker_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-medium text-anthracite-900">{candidate.worker_name}</h3>
                            <p className="text-xs text-anthracite-500 flex items-center gap-1">
                              {candidate.completed_shifts || 0} shifts · {candidate.avg_rating ? candidate.avg_rating.toFixed(1) : '?'}
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-anthracite-400">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                              </svg>
                            </p>
                          </div>
                        </div>
                      </div>
                      {candidate.message && (
                        <p className="text-sm text-anthracite-600 bg-anthracite-50 rounded-lg p-2 mb-3">
                          "{candidate.message}"
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptCandidate(selectedMission.id, candidate.worker_id)}
                          disabled={isSubmitting}
                          className="flex-1 bg-anthracite-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRejectCandidate(selectedMission.id, candidate.worker_id)}
                          disabled={isSubmitting}
                          className="flex-1 border border-anthracite-200 text-anthracite-600 py-2 rounded-lg text-sm font-medium hover:bg-anthracite-50 disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {/* ==================== NEW MISSION ==================== */}
        {view === 'new-mission' && (
          <motion.div
            key="new-mission"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen p-6 pt-12 pb-8 max-w-lg mx-auto"
          >
            <button
              onClick={() => setView('main')}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Annuler
            </button>

            <h1 className="text-xl font-medium text-anthracite-900 mb-6">Nouvelle mission</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-anthracite-500 mb-1 block">Titre *</label>
                <input
                  type="text"
                  value={newMission.title}
                  onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                  placeholder="Ex: Aide ménagère - Famille Martin"
                  className="w-full h-12 px-4 bg-anthracite-50 border border-anthracite-100 rounded-xl text-sm focus:outline-none focus:border-anthracite-900"
                />
              </div>

              <div>
                <label className="text-xs text-anthracite-500 mb-1 block">Description</label>
                <textarea
                  value={newMission.description}
                  onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                  placeholder="Décrivez la mission..."
                  rows={3}
                  className="w-full px-4 py-3 bg-anthracite-50 border border-anthracite-100 rounded-xl text-sm focus:outline-none focus:border-anthracite-900 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-anthracite-500 mb-1 block">Lieu (secteur)</label>
                <input
                  type="text"
                  value={newMission.location}
                  onChange={(e) => setNewMission({ ...newMission, location: e.target.value })}
                  placeholder="Ex: Paris 15e"
                  className="w-full h-12 px-4 bg-anthracite-50 border border-anthracite-100 rounded-xl text-sm focus:outline-none focus:border-anthracite-900"
                />
              </div>

              <AddressAutocomplete
                label="Adresse exacte"
                value={newMission.address}
                onChange={(address, coords) => {
                  setNewMission({
                    ...newMission,
                    address,
                    latitude: coords?.lat || newMission.latitude,
                    longitude: coords?.lng || newMission.longitude,
                  })
                }}
                placeholder="Rechercher une adresse..."
              />

              {/* Carte preview */}
              {newMission.address && (
                <div className="space-y-2">
                  <label className="text-xs text-anthracite-500 block">Localisation</label>
                  <MapPreview
                    latitude={newMission.latitude}
                    longitude={newMission.longitude}
                    address={newMission.address}
                    height="180px"
                    zoom={15}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-anthracite-500 mb-1 block">Taux horaire (€)</label>
                  <input
                    type="number"
                    value={newMission.hourly_rate}
                    onChange={(e) => setNewMission({ ...newMission, hourly_rate: parseFloat(e.target.value) || 0 })}
                    min="10"
                    step="0.5"
                    className="w-full h-12 px-4 bg-anthracite-50 border border-anthracite-100 rounded-xl text-sm focus:outline-none focus:border-anthracite-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-anthracite-500 mb-1 block">Heures total</label>
                  <input
                    type="number"
                    value={newMission.total_hours_needed}
                    onChange={(e) => setNewMission({ ...newMission, total_hours_needed: parseFloat(e.target.value) || 0 })}
                    min="1"
                    className="w-full h-12 px-4 bg-anthracite-50 border border-anthracite-100 rounded-xl text-sm focus:outline-none focus:border-anthracite-900"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateMission}
                disabled={isSubmitting || !newMission.title}
                className="w-full bg-anthracite-900 text-white py-4 rounded-xl font-medium disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Création...' : 'Créer la mission'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ==================== WORKER DETAIL ==================== */}
        {view === 'worker-detail' && selectedWorker && (
          <motion.div
            key="worker-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen p-6 pt-12 pb-8 max-w-lg mx-auto"
          >
            <button
              onClick={() => { setView('main'); setSelectedWorker(null); setWorkerShifts([]); setWorkerDetails(null) }}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Retour
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-anthracite-100 rounded-full flex items-center justify-center text-2xl font-medium text-anthracite-600 mx-auto mb-3">
                {selectedWorker.avatar || selectedWorker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <h1 className="text-xl font-medium text-anthracite-900">{selectedWorker.name}</h1>
              {selectedWorker.email && <p className="text-sm text-anthracite-500">{selectedWorker.email}</p>}
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="font-medium text-anthracite-900">{selectedWorker.rating.toFixed(1)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-anthracite-400">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>

            {/* Stats cards with total earned */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="bg-anthracite-900 text-white rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{workerDetails?.total_earned?.toFixed(0) || 0}€</p>
                <p className="text-[10px] text-anthracite-400">Gagne</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-anthracite-900">{selectedWorker.total_shifts}</p>
                <p className="text-[10px] text-anthracite-400">Shifts</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-anthracite-900">{selectedWorker.completed_shifts}</p>
                <p className="text-[10px] text-anthracite-400">Payes</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-anthracite-900">{selectedWorker.total_hours.toFixed(0)}h</p>
                <p className="text-[10px] text-anthracite-400">Heures</p>
              </div>
            </div>

            {/* XRPL address */}
            <div className="bg-white border border-anthracite-100 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-500">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <p className="text-xs text-anthracite-400">Adresse XRPL</p>
              </div>
              {selectedWorker.xrpl_address ? (
                <div>
                  <p className="text-xs text-anthracite-600 font-mono break-all mb-2">{selectedWorker.xrpl_address}</p>
                  <a
                    href={`https://testnet.xrpl.org/accounts/${selectedWorker.xrpl_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-anthracite-500 hover:text-anthracite-900 flex items-center gap-1 transition-colors"
                  >
                    Voir sur l'explorateur XRPL
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-anthracite-400 italic">Aucune adresse XRPL (sera générée automatiquement)</p>
              )}
            </div>

            {/* Shifts history */}
            <section>
              <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                Historique des shifts ({workerShifts.length})
              </p>
              {workerShifts.length > 0 ? (
                <div className="space-y-2">
                  {workerShifts.map((shift, i) => (
                    <motion.button
                      key={shift.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => {
                        setSelectedShift(shift)
                        setView('shift-detail')
                      }}
                      className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-anthracite-900">
                            {shift.mission_title || 'Shift direct'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(shift.status)}`}>
                            {getStatusLabel(shift.status)}
                          </span>
                        </div>
                        <span className="font-medium text-anthracite-900">{shift.amount_total?.toFixed(2) || 0}€</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-anthracite-500">
                        <span>{formatDate(shift.start_time)}</span>
                        <span>{shift.hours?.toFixed(1) || '?'}h @ {shift.hourly_rate || 0}€/h</span>
                      </div>
                      {shift.xrpl_payment_tx && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-anthracite-400">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Paye sur XRPL
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="bg-anthracite-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-anthracite-500">Aucun shift pour le moment</p>
                </div>
              )}
            </section>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav
          items={navItems}
          activeId={tab}
          onSelect={handleTabChange}
        />
      )}

      {/* Success Overlay */}
      <SuccessOverlay
        show={successOverlay.show}
        type={successOverlay.type}
        amount={successOverlay.amount}
        onComplete={handleSuccessOverlayComplete}
      />
    </div>
  )
}
