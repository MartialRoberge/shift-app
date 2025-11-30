import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { BottomNav, NavIcons } from '@/components/BottomNav'
import { XRPLLinks, XRPLWalletCard, GamifiedStats, ShiftBlockchainFlow, AIInsights, GpsVerification, NFTCertificate, SuccessOverlay } from '@/components'
import { auth } from '@/lib/auth'
import { workerApi, shiftsApi } from '@/lib/api'
import { useSounds } from '@/lib/sounds'

// Types
interface Mission {
  id: string
  title: string
  employer_name: string
  description: string
  location: string
  address: string
  latitude?: number
  longitude?: number
  hourly_rate: number
  total_hours_needed: number
  hours_completed: number
  status: 'active' | 'completed' | 'draft'
  is_member?: boolean
  can_apply?: boolean
}

interface Employer {
  id: string
  name: string
  email?: string
  xrpl_address?: string
}

interface Shift {
  id: string
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
    sentiment?: 'positive' | 'neutral' | 'negative'
    energy_level?: number
    mood?: string
    key_phrases?: string[]
    recommendations?: string[]
    confidence?: number
  }
  xrpl_escrow_tx?: string
  xrpl_nft_id?: string
  xrpl_payment_tx?: string
}

// Nav items
const navItems = [
  { id: 'home', label: 'Accueil', icon: NavIcons.home },
  { id: 'missions', label: 'Missions', icon: NavIcons.briefcase },
  { id: 'wallet', label: 'Wallet', icon: NavIcons.wallet },
  { id: 'profile', label: 'Profil', icon: NavIcons.profile },
]

// Main Component
export function WorkerHome() {
  const navigate = useNavigate()
  const user = auth.getUser()
  const sounds = useSounds()
  const [tab, setTab] = useState<'home' | 'missions' | 'wallet' | 'profile'>('home')
  const [view, setView] = useState<'main' | 'mission-detail' | 'shift-detail' | 'shift-start' | 'shift-active' | 'shift-end' | 'shift-submitted'>('main')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [missions, setMissions] = useState<Mission[]>([])
  const [myMissions, setMyMissions] = useState<Mission[]>([])
  const [employers, setEmployers] = useState<Employer[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)

  // Shift state
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null)
  const [startTranscript, setStartTranscript] = useState<string>('')

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStep, setSubmissionStep] = useState<'uploading' | 'transcribing' | 'analyzing' | 'creating' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gpsVerified, setGpsVerified] = useState<boolean | null>(null)
  const [gpsDistance, setGpsDistance] = useState<number | null>(null)
  const [gpsWarning, setGpsWarning] = useState<string | null>(null)

  // Success overlay state
  const [successOverlay, setSuccessOverlay] = useState<{
    show: boolean
    type: 'shift-start' | 'shift-end' | 'validation' | 'payment'
    title?: string
    subtitle?: string
    amount?: number
  }>({ show: false, type: 'shift-start' })

  // Derived data
  const paidShifts = shifts.filter(s => s.status === 'paid')
  const pendingShifts = shifts.filter(s => s.status === 'proposed' || s.status === 'validated')
  const totalEarnings = paidShifts.reduce((sum, s) => sum + (s.amount_total || 0), 0)
  const pendingEarnings = pendingShifts.reduce((sum, s) => sum + (s.amount_total || 0), 0)
  const totalHoursWorked = paidShifts.reduce((sum, s) => sum + (s.hours || 0), 0)

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [shiftsRes, employersRes, availableRes, myMissionsRes] = await Promise.all([
        workerApi.getShifts(),
        workerApi.getEmployers(),
        shiftsApi.getAvailableMissions().catch(() => ({ missions: [] })),
        shiftsApi.getMyMissions().catch(() => ({ missions: [] })),
      ])

      setShifts(shiftsRes.shifts || [])
      setEmployers(employersRes.employers || [])
      setMissions(availableRes.missions || [])
      setMyMissions(myMissionsRes.missions || [])

      // Vérifier et mettre à jour l'adresse XRPL de l'utilisateur si nécessaire
      const currentUser = auth.getUser()
      if (currentUser && (!currentUser.xrpl_address || !currentUser.xrpl_address.startsWith('r'))) {
        try {
          const profile = await workerApi.getProfile()
          if (profile.xrpl_address) {
            auth.setUser({ ...currentUser, xrpl_address: profile.xrpl_address })
          }
        } catch (err) {
          console.warn('Could not update user XRPL address:', err)
        }
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Elapsed time during shift
  useEffect(() => {
    if (view === 'shift-active' && shiftStartTime) {
      const interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - shiftStartTime.getTime()) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [view, shiftStartTime])

  const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const calculateEarnings = (seconds: number, rate: number) => {
    return ((seconds / 3600) * rate).toFixed(2)
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

  // Handlers
  const handleTabChange = (id: string) => {
    sounds.tap()
    setTab(id as typeof tab)
    setView('main')
    setSelectedMission(null)
    setSelectedEmployer(null)
    setGpsVerified(null)
    setGpsDistance(null)
    setGpsWarning(null)
  }

  // Callback stable pour la vérification GPS
  const handleGpsVerification = useCallback((result: { verified: boolean; error?: string; distance?: number }) => {
    setGpsVerified(result.verified)
    setGpsDistance(result.distance || null)
    
    if (result.error) {
      setGpsWarning(null)
      setError(result.error)
    } else if (!result.verified && result.distance) {
      // Avertissement si on est loin mais on ne bloque pas
      const distanceKm = result.distance >= 1000 
        ? `${(result.distance / 1000).toFixed(1)} km`
        : `${Math.round(result.distance)} m`
      setGpsWarning(`Vous semblez loin du site (${distanceKm}). La distance sera enregistrée.`)
      setError(null)
    } else if (result.verified) {
      setGpsWarning(null)
      setError(null)
    } else {
      setGpsWarning(null)
      setError(null)
    }
  }, [])

  const handleStartShiftRecording = async (audioBlob: Blob, duration: number) => {
    if (!selectedEmployer) return

    // On ne bloque plus le démarrage, même si on est loin
    // La distance sera enregistrée dans les données du shift

    setIsSubmitting(true)
    setSubmissionStep('uploading')
    setGpsWarning(null) // Effacer l'avertissement pendant la soumission

    try {
      // Get current position
      let latitude: number | undefined
      let longitude: number | undefined
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      } catch {
        console.warn('Could not get location')
      }

      // Simulate step progression (API does all in one call, but we show steps)
      setSubmissionStep('transcribing')
      await new Promise(resolve => setTimeout(resolve, 500))
      setSubmissionStep('analyzing')
      await new Promise(resolve => setTimeout(resolve, 300))
      setSubmissionStep('creating')

      const response = await workerApi.startShift({
        employer_id: selectedEmployer.id,
        audioBlob,
        latitude,
        longitude,
      })

      setActiveShiftId(response.work_session_id)
      setStartTranscript(response.transcript || response.stt_start_text || '')
      setShiftStartTime(new Date(response.start_time))
      setElapsedSeconds(0)
      // Rediriger directement vers la vue du shift actif
      setView('shift-active')
      setIsSubmitting(false)
      setSubmissionStep(null)
    } catch (err: any) {
      console.error('Error starting shift:', err)
      setError(err.message || 'Erreur lors du demarrage du shift')
    } finally {
      setIsSubmitting(false)
      setSubmissionStep(null)
    }
  }

  const handleEndShift = () => {
    setView('shift-end')
  }

  const handleEndShiftRecording = async (audioBlob: Blob, duration: number) => {
    if (!activeShiftId) return

    setIsSubmitting(true)
    setSubmissionStep('uploading')

    try {
      // Get current location for check-out verification
      let endLat: number | undefined
      let endLng: number | undefined
      let endAccuracy: number | undefined

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          })
        })
        endLat = position.coords.latitude
        endLng = position.coords.longitude
        endAccuracy = position.coords.accuracy
      } catch {
        // Geolocation not available
      }

      // Simulate step progression for better UX
      setSubmissionStep('transcribing')
      await new Promise(resolve => setTimeout(resolve, 400))
      setSubmissionStep('analyzing')
      await new Promise(resolve => setTimeout(resolve, 300))
      setSubmissionStep('creating')

      await workerApi.endShift({
        work_session_id: activeShiftId,
        audioBlob,
        latitude: endLat,
        longitude: endLng,
        location_accuracy: endAccuracy,
      })

      // Calculate earnings for display
      const hours = elapsedSeconds / 3600
      const rate = selectedMission?.hourly_rate || 15
      const earnings = hours * rate

      // Rediriger directement vers l'écran de confirmation avec la coche
      setView('shift-submitted')
      setIsSubmitting(false)
      setSubmissionStep(null)

      // Reload data
      await loadData()
    } catch (err: any) {
      console.error('Error ending shift:', err)
      setError(err.message || 'Erreur lors de la fin du shift')
      setView('shift-active') // Go back to active shift
    } finally {
      setIsSubmitting(false)
      setSubmissionStep(null)
    }
  }

  // Helper function to get step label
  const getStepLabel = (step: typeof submissionStep) => {
    switch (step) {
      case 'uploading': return 'Envoi de l\'audio...'
      case 'transcribing': return 'Transcription vocale...'
      case 'analyzing': return 'Analyse IA...'
      case 'creating': return 'Creation du shift...'
      default: return 'Traitement...'
    }
  }

  const handleAcceptMission = async (mission: Mission) => {
    try {
      await shiftsApi.acceptMission(mission.id)
      await loadData()
      sounds.success()
      setView('main')
      setTab('home')
    } catch (err: any) {
      console.error('Error accepting mission:', err)
      // Handle "already member" error gracefully
      if (err.message?.includes('Already a member') || err.message?.includes('deja membre')) {
        await loadData() // Refresh to show correct state
        setView('main')
        setTab('home')
      } else {
        setError(err.message || 'Erreur lors de l\'acceptation')
      }
    }
  }

  const handleLogout = () => {
    auth.logout()
    navigate('/select-role')
  }

  // Show bottom nav only on main views
  const showBottomNav = view === 'main'

  // Get employer for mission or shift
  const getEmployerForShift = (mission?: Mission | null): Employer | undefined => {
    if (!mission) return employers[0]
    // Find employer by name match
    return employers.find(e => e.name === mission.employer_name) || employers[0]
  }

  // Loading state
  if (isLoading && !shifts.length) {
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
            <div className="flex items-start justify-between mb-6">
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
                <p className="text-anthracite-400 text-sm">{formatTime(currentTime)}</p>
              </div>
              {(totalEarnings > 0 || pendingEarnings > 0) ? (
                <motion.div
                  className="text-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <p className="text-2xl font-medium text-anthracite-900">
                    {totalEarnings.toFixed(2)}€
                  </p>
                  <div className="flex items-center justify-end gap-1 text-xs">
                    <span className="text-green-600">reçu</span>
                    {pendingEarnings > 0 && (
                      <>
                        <span className="text-anthracite-300">·</span>
                        <span className="text-amber-600">+{pendingEarnings.toFixed(2)}€ en attente</span>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <img src="/logo.png" alt="Fair Work" className="w-10 h-10" />
                </motion.div>
              )}
            </div>

            {/* Onboarding banner for new users */}
            {shifts.length === 0 && myMissions.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-anthracite-900 text-white rounded-2xl p-5 mb-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Bienvenue sur Fair Work</h3>
                    <p className="text-sm text-anthracite-300 mb-3">
                      Commencez par explorer les missions disponibles et acceptez celles qui vous interessent.
                    </p>
                    <button
                      onClick={() => setTab('missions')}
                      className="text-sm font-medium bg-white text-anthracite-900 px-4 py-2 rounded-lg hover:bg-anthracite-100 transition-colors"
                    >
                      Voir les missions
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
              >
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-500 underline mt-1"
                >
                  Fermer
                </button>
              </motion.div>
            )}

            {/* Pending earnings banner */}
            {pendingEarnings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-sm text-amber-700">En attente de validation</span>
                  </div>
                  <span className="font-medium text-amber-900">+{pendingEarnings.toFixed(2)}€</span>
                </div>
              </motion.div>
            )}

            {/* Quick action - Start a shift */}
            <section className="mb-8">
              <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                Commencer un shift
              </p>

              {/* My missions - clickable cards */}
              {myMissions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {myMissions.slice(0, 3).map((mission, i) => (
                    <motion.button
                      key={mission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedMission(mission)
                        const employer = getEmployerForShift(mission)
                        if (employer) setSelectedEmployer(employer)
                        setView('shift-start')
                      }}
                      className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-anthracite-900">{mission.title}</h3>
                            <span className="w-2 h-2 bg-anthracite-900 rounded-full" />
                          </div>
                          <p className="text-sm text-anthracite-500">{mission.employer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-anthracite-900">{mission.hourly_rate}€/h</p>
                          <p className="text-xs text-anthracite-400">
                            {mission.hours_completed || 0}h / {mission.total_hours_needed}h
                          </p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1 bg-anthracite-100 rounded-full overflow-hidden mt-3">
                        <div
                          className="h-full bg-anthracite-900 rounded-full transition-all"
                          style={{ width: `${((mission.hours_completed || 0) / (mission.total_hours_needed || 100)) * 100}%` }}
                        />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Message si pas de missions */}
              {myMissions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-anthracite-100 rounded-xl p-6 text-center"
                >
                  <div className="w-12 h-12 bg-anthracite-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <p className="text-sm text-anthracite-600 mb-1 font-medium">Aucune mission en cours</p>
                  <p className="text-xs text-anthracite-400 mb-4">Acceptez une mission pour commencer a travailler</p>
                  <button
                    onClick={() => setTab('missions')}
                    className="text-sm bg-anthracite-900 text-white px-4 py-2 rounded-lg hover:bg-anthracite-800 transition-colors"
                  >
                    Voir les missions disponibles
                  </button>
                </motion.div>
              )}

            </section>

            {/* Recent shifts */}
            {shifts.length > 0 && (
              <section>
                <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                  Mes derniers shifts
                </p>
                <div className="space-y-2">
                  {shifts.slice(0, 5).map((shift, i) => (
                    <motion.button
                      key={shift.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedShift(shift)
                        setView('shift-detail')
                      }}
                      className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-anthracite-900 text-sm">
                            {shift.mission_title || shift.employer_name}
                          </h3>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(shift.status)}`}>
                          {getStatusLabel(shift.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-anthracite-500">
                          {shift.llm_structured_json?.job_type && (
                            <span className="bg-anthracite-100 px-1.5 py-0.5 rounded text-xs mr-2">{shift.llm_structured_json.job_type}</span>
                          )}
                          {new Date(shift.start_time).toLocaleDateString('fr-FR')} ·
                          {shift.hours ? ` ${shift.hours.toFixed(1)}h` : ''}
                        </span>
                        {shift.amount_total && (
                          <span className="font-medium text-anthracite-900">
                            {shift.status === 'paid' ? '+' : ''}{shift.amount_total.toFixed(2)}€
                          </span>
                        )}
                      </div>
                      {/* Liens blockchain */}
                      <XRPLLinks
                        escrowTx={shift.xrpl_escrow_tx}
                        nftId={shift.xrpl_nft_id}
                        paymentTx={shift.xrpl_payment_tx}
                        compact
                      />
                    </motion.button>
                  ))}
                </div>
              </section>
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
            <h1 className="text-2xl font-medium text-anthracite-900 mb-6">Missions</h1>

            {/* My missions */}
            {myMissions.length > 0 && (
              <section className="mb-8">
                <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                  Mes missions ({myMissions.length})
                </p>
                <div className="space-y-3">
                  {myMissions.map((mission, i) => (
                    <motion.button
                      key={mission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedMission(mission)
                        setView('mission-detail')
                      }}
                      className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-anthracite-900">{mission.title}</h3>
                            <span className="w-2 h-2 bg-anthracite-900 rounded-full" />
                          </div>
                          <p className="text-sm text-anthracite-500">{mission.employer_name}</p>
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
                        <p className="text-xs text-anthracite-400 mt-1">
                          {mission.hours_completed || 0}h / {mission.total_hours_needed || 100}h
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Available missions */}
            <section>
              <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                Disponibles ({missions.filter(m => !m.is_member).length})
              </p>
              {missions.filter(m => !m.is_member).length > 0 ? (
                <div className="space-y-3">
                  {missions.filter(m => !m.is_member).map((mission, i) => (
                    <motion.button
                      key={mission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedMission(mission)
                        setView('mission-detail')
                      }}
                      className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-anthracite-900">{mission.title}</h3>
                          <p className="text-sm text-anthracite-500">{mission.employer_name}</p>
                          <p className="text-xs text-anthracite-400 mt-1">{mission.location}</p>
                        </div>
                        <span className="font-medium text-anthracite-900">{mission.hourly_rate}€/h</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="bg-anthracite-50 rounded-xl p-6 text-center">
                  <p className="text-anthracite-500">Aucune mission disponible</p>
                </div>
              )}
            </section>
          </motion.div>
        )}

        {/* ==================== WALLET TAB ==================== */}
        {tab === 'wallet' && view === 'main' && (
          <motion.div
            key="wallet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-6 pt-12 pb-28 max-w-lg mx-auto"
          >
            <h1 className="text-2xl font-medium text-anthracite-900 mb-6">Wallet</h1>

            {/* Gamified Stats */}
            <GamifiedStats
              totalShifts={shifts.length}
              totalHours={totalHoursWorked}
              totalEarnings={totalEarnings}
              streak={0}
            />

            {/* XRPL Wallet Card */}
            {user?.xrpl_address ? (
              <div className="mt-6">
                <XRPLWalletCard
                  address={user.xrpl_address}
                  label="Mon wallet XRPL"
                />
              </div>
            ) : (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-700 mb-2">
                  Wallet XRPL en cours de génération...
                </p>
                <button
                  onClick={loadData}
                  className="text-xs text-amber-600 hover:text-amber-800 underline"
                >
                  Actualiser
                </button>
              </div>
            )}

            {/* Pending earnings */}
            {pendingEarnings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-anthracite-50 border border-anthracite-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-anthracite-200 rounded-full flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-anthracite-900">En attente</p>
                      <p className="text-xs text-anthracite-500">{pendingShifts.length} shift(s) non validé(s)</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-anthracite-900">+{pendingEarnings.toFixed(2)}€</span>
                </div>
              </motion.div>
            )}

            {/* Transactions */}
            {shifts.length > 0 && (
              <section className="mt-6">
                <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                  Historique des shifts
                </p>
                <div className="space-y-3">
                  {shifts.map((shift, i) => (
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
                      className="w-full bg-white border border-anthracite-100 rounded-xl p-4 text-left hover:border-anthracite-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-anthracite-900 text-sm">{shift.employer_name}</h3>
                        </div>
                        <span className="font-medium text-anthracite-900">
                          {shift.status === 'paid' ? '+' : shift.status === 'refused' ? '' : '~'}{shift.amount_total?.toFixed(2) || '0.00'}€
                        </span>
                      </div>

                      {/* Job type & time */}
                      <div className="flex items-center justify-between text-xs text-anthracite-500 mb-2">
                        <span>
                          {shift.llm_structured_json?.job_type && (
                            <span className="bg-anthracite-100 px-2 py-0.5 rounded mr-2">{shift.llm_structured_json.job_type}</span>
                          )}
                          {new Date(shift.start_time).toLocaleDateString('fr-FR')} · {shift.hours?.toFixed(1) || '?'}h
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${getStatusColor(shift.status)}`}>
                          {getStatusLabel(shift.status)}
                        </span>
                      </div>

                      {/* Energy bar if available */}
                      {shift.llm_structured_json?.energy_level !== undefined && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-anthracite-400">Énergie</span>
                            <span className="text-anthracite-600">{Math.round(shift.llm_structured_json.energy_level * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-anthracite-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${shift.llm_structured_json.energy_level * 100}%` }}
                              className={`h-full rounded-full ${
                                shift.llm_structured_json.energy_level > 0.7 ? 'bg-anthracite-900' :
                                shift.llm_structured_json.energy_level > 0.4 ? 'bg-anthracite-600' : 'bg-anthracite-400'
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {/* XRPL Links */}
                      <XRPLLinks
                        escrowTx={shift.xrpl_escrow_tx}
                        nftId={shift.xrpl_nft_id}
                        paymentTx={shift.xrpl_payment_tx}
                        compact
                      />
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
            {/* Avatar & Name */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-anthracite-100 rounded-full flex items-center justify-center text-2xl font-medium text-anthracite-600 mx-auto mb-3">
                {user?.avatar || user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </div>
              <h1 className="text-xl font-medium text-anthracite-900">{user?.name || 'Utilisateur'}</h1>
              <p className="text-sm text-anthracite-500">Worker</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">{shifts.length}</p>
                <p className="text-xs text-anthracite-400">Shifts</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">{totalHoursWorked.toFixed(0)}</p>
                <p className="text-xs text-anthracite-400">Heures</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">{paidShifts.length}</p>
                <p className="text-xs text-anthracite-400">Payés</p>
              </div>
            </div>

            {/* Earnings card */}
            <div className="bg-anthracite-900 text-white rounded-xl p-4 mb-6">
              <p className="text-xs text-anthracite-400 mb-1">Total gagné</p>
              <p className="text-2xl font-medium">{totalEarnings.toFixed(2)}€</p>
            </div>

            {/* Menu */}
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
              onClick={() => {
                setView('main')
                setSelectedMission(null)
              }}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Retour
            </button>

            <div className="mb-6">
              <h1 className="text-xl font-medium text-anthracite-900 mb-1">{selectedMission.title}</h1>
              <p className="text-anthracite-500">{selectedMission.employer_name}</p>
            </div>

            <div className="bg-anthracite-900 text-white rounded-2xl p-5 mb-6">
              <p className="text-xs text-anthracite-400 mb-1">Taux horaire</p>
              <p className="text-3xl font-medium">{selectedMission.hourly_rate}€<span className="text-lg text-anthracite-400">/h</span></p>
            </div>

            <div className="bg-white border border-anthracite-100 rounded-xl p-4 mb-6 space-y-3">
              {selectedMission.description && (
                <div>
                  <p className="text-xs text-anthracite-400 mb-1">Description</p>
                  <p className="text-sm text-anthracite-900">{selectedMission.description}</p>
                </div>
              )}
              {selectedMission.location && (
                <div>
                  <p className="text-xs text-anthracite-400 mb-1">Lieu</p>
                  <p className="text-sm text-anthracite-900">{selectedMission.location}</p>
                  {selectedMission.address && <p className="text-xs text-anthracite-500">{selectedMission.address}</p>}
                </div>
              )}
              <div>
                <p className="text-xs text-anthracite-400 mb-1">Objectif mission</p>
                <p className="text-sm text-anthracite-900">{selectedMission.total_hours_needed}h de travail cumulé</p>
              </div>
            </div>

            {selectedMission.is_member ? (
              <>
                <div className="bg-white border border-anthracite-100 rounded-xl p-4 mb-6">
                  <p className="text-xs text-anthracite-400 mb-3">Votre progression</p>
                  <div className="relative mb-2">
                    <div className="h-2 bg-anthracite-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((selectedMission.hours_completed || 0) / (selectedMission.total_hours_needed || 100)) * 100}%` }}
                        className="h-full bg-anthracite-900 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-anthracite-600">{selectedMission.hours_completed || 0}h effectuées</span>
                    <span className="text-anthracite-400">{selectedMission.total_hours_needed}h</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const employer = getEmployerForShift(selectedMission)
                    if (employer) setSelectedEmployer(employer)
                    setView('shift-start')
                  }}
                  className="w-full bg-anthracite-900 text-white py-4 rounded-xl font-medium"
                >
                  Commencer un shift
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAcceptMission(selectedMission)}
                className="w-full bg-anthracite-900 text-white py-4 rounded-xl font-medium"
              >
                Accepter la mission
              </motion.button>
            )}
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
              onClick={() => {
                setView('main')
                setSelectedShift(null)
              }}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Retour
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1">
                <h1 className="text-xl font-medium text-anthracite-900">
                  {selectedShift.mission_title || selectedShift.employer_name}
                </h1>
                <p className="text-anthracite-500">{selectedShift.employer_name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedShift.status)}`}>
                {getStatusLabel(selectedShift.status)}
              </span>
            </div>

            {/* Amount card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 mb-6 bg-anthracite-900 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm opacity-70 mb-1">Montant</p>
                  <p className="text-3xl font-medium">{selectedShift.amount_total?.toFixed(2) || '0.00'}€</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-70 mb-1">Durée</p>
                  <p className="text-2xl font-medium">{selectedShift.hours?.toFixed(1) || '?'}h</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm opacity-70 pt-3 border-t border-white/20">
                <span>{new Date(selectedShift.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <span>{selectedShift.hourly_rate}€/h</span>
              </div>
            </motion.div>

            {/* AI Insights */}
            {selectedShift.llm_structured_json && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <AIInsights
                  llmData={selectedShift.llm_structured_json}
                  startTranscript={selectedShift.stt_start_text}
                  endTranscript={selectedShift.stt_end_text}
                />
              </motion.div>
            )}

            {/* Blockchain Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h3 className="text-sm font-medium text-anthracite-900 mb-3">Transactions Blockchain</h3>
              <ShiftBlockchainFlow
                escrowTx={selectedShift.xrpl_escrow_tx}
                nftId={selectedShift.xrpl_nft_id}
                paymentTx={selectedShift.xrpl_payment_tx}
                status={selectedShift.status}
              />
            </motion.div>

            {/* NFT Certificate - prominent display for worker */}
            {selectedShift.xrpl_nft_id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mb-6"
              >
                <h3 className="text-sm font-medium text-anthracite-900 mb-3">Votre Certificat de Travail</h3>
                <NFTCertificate
                  nftId={selectedShift.xrpl_nft_id}
                  shiftDetails={{
                    date: new Date(selectedShift.start_time).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }),
                    hours: selectedShift.hours || 0,
                    amount: selectedShift.amount_total || 0,
                    employer: selectedShift.employer_name,
                    jobType: selectedShift.llm_structured_json?.job_type
                  }}
                />
              </motion.div>
            )}

            {/* Timestamps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-anthracite-100 rounded-xl p-4"
            >
              <h3 className="text-sm font-medium text-anthracite-900 mb-3">Horaires</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                    </div>
                    <span className="text-sm text-anthracite-600">Check-in</span>
                  </div>
                  <span className="font-mono text-sm text-anthracite-900">
                    {new Date(selectedShift.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {selectedShift.end_time && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                      </div>
                      <span className="text-sm text-anthracite-600">Check-out</span>
                    </div>
                    <span className="font-mono text-sm text-anthracite-900">
                      {new Date(selectedShift.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ==================== SHIFT START ==================== */}
        {view === 'shift-start' && (selectedMission || selectedEmployer) && (
          <motion.div
            key="shift-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col p-6 pt-12 pb-8 max-w-lg mx-auto"
          >
            <button
              onClick={() => {
                setView('main')
                setTab('home')
                setSelectedMission(null)
                setSelectedEmployer(null)
              }}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-8"
            >
              ← Annuler
            </button>

            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <p className="text-sm text-anthracite-400 mb-1">Check-in pour</p>
                <h1 className="text-xl font-medium text-anthracite-900 mb-1">
                  {selectedMission?.title || selectedEmployer?.name}
                </h1>
                <p className="text-anthracite-500">
                  {selectedMission?.employer_name || selectedEmployer?.email || ''}
                </p>
              </motion.div>

              {/* Time & GPS Verification */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full space-y-3 mb-8"
              >
                {/* Current time */}
                <div className="bg-white border border-anthracite-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-400">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-sm text-anthracite-500">Heure actuelle</span>
                    </div>
                    <span className="font-mono font-medium text-anthracite-900">{formatTime(currentTime)}</span>
                  </div>
                </div>

                {/* GPS Verification with animation */}
                <GpsVerification
                  missionLocation={selectedMission?.latitude && selectedMission?.longitude ? {
                    latitude: selectedMission.latitude,
                    longitude: selectedMission.longitude,
                    address: selectedMission.address
                  } : undefined}
                  maxDistanceMeters={500}
                  onVerified={handleGpsVerification}
                />
                
                {/* Avertissement si on est loin */}
                {gpsWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-3"
                  >
                    <div className="flex items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 mt-0.5 flex-shrink-0">
                        <path d="M12 9v4M12 17h.01" />
                      </svg>
                      <p className="text-sm text-amber-700">{gpsWarning}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <VoiceRecorder
                  prompt="Décrivez votre arrivée et la situation sur place"
                  onRecordingComplete={handleStartShiftRecording}
                />
              </motion.div>

              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-anthracite-900 text-white rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="font-medium">{getStepLabel(submissionStep)}</p>
                      <p className="text-xs text-anthracite-400">Veuillez patienter</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['uploading', 'transcribing', 'analyzing', 'creating'] as const).map((step, i) => (
                      <div key={step} className="text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                          submissionStep === step ? 'bg-white text-anthracite-900' :
                          (['uploading', 'transcribing', 'analyzing', 'creating'].indexOf(submissionStep || '') > i) ? 'bg-white/30' : 'bg-white/10'
                        }`}>
                          {(['uploading', 'transcribing', 'analyzing', 'creating'].indexOf(submissionStep || '') > i) ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span className="text-xs">{i + 1}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-anthracite-400">
                          {step === 'uploading' ? 'Envoi' : step === 'transcribing' ? 'Transcription' : step === 'analyzing' ? 'Analyse' : 'Creation'}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== SHIFT ACTIVE ==================== */}
        {view === 'shift-active' && (selectedMission || selectedEmployer) && (
          <motion.div
            key="shift-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col bg-anthracite-900 text-white"
          >
            <div className="p-6 pt-12">
              <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-1">En cours</p>
              <h1 className="text-lg font-medium">{selectedMission?.title || selectedEmployer?.name}</h1>
              <p className="text-sm text-anthracite-400">{selectedMission?.employer_name || ''}</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.3 }}
                className="text-center"
              >
                <p className="text-6xl font-mono font-light tracking-tight mb-4">
                  {formatElapsed(elapsedSeconds)}
                </p>
                <p className="text-anthracite-400 mb-2">Temps de travail</p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/10 rounded-full px-6 py-2 inline-block"
                >
                  <span className="text-xl font-medium">
                    +{calculateEarnings(elapsedSeconds, selectedMission?.hourly_rate || 15)}€
                  </span>
                </motion.div>
              </motion.div>
            </div>

            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm text-anthracite-400">Shift en cours</span>
              </div>
            </div>

            <div className="p-6 pb-12">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEndShift}
                className="w-full bg-white text-anthracite-900 py-4 rounded-xl font-medium"
              >
                Terminer le shift
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ==================== SHIFT END ==================== */}
        {view === 'shift-end' && (selectedMission || selectedEmployer) && (
          <motion.div
            key="shift-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col p-6 pt-12 pb-8 max-w-lg mx-auto"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <p className="text-sm text-anthracite-400 mb-1">Check-out</p>
                <h1 className="text-xl font-medium text-anthracite-900 mb-4">
                  {selectedMission?.title || selectedEmployer?.name}
                </h1>
                <div className="bg-anthracite-900 text-white rounded-2xl p-5 mb-4">
                  <p className="text-3xl font-mono font-light mb-2">{formatElapsed(elapsedSeconds)}</p>
                  <p className="text-2xl font-medium">
                    +{calculateEarnings(elapsedSeconds, selectedMission?.hourly_rate || 15)}€
                  </p>
                </div>
              </motion.div>

              {/* Time & GPS Verification for checkout */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full space-y-3 mb-8"
              >
                {/* End time */}
                <div className="bg-white border border-anthracite-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-400">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-sm text-anthracite-500">Heure de fin</span>
                    </div>
                    <span className="font-mono font-medium text-anthracite-900">{formatTime(currentTime)}</span>
                  </div>
                </div>

                {/* GPS Verification for checkout */}
                <GpsVerification
                  missionLocation={selectedMission?.latitude && selectedMission?.longitude ? {
                    latitude: selectedMission.latitude,
                    longitude: selectedMission.longitude,
                    address: selectedMission.address
                  } : undefined}
                  maxDistanceMeters={500}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <VoiceRecorder
                  prompt="Décrivez le travail effectué et votre départ"
                  onRecordingComplete={handleEndShiftRecording}
                />
              </motion.div>

              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-anthracite-900 text-white rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="font-medium">{getStepLabel(submissionStep)}</p>
                      <p className="text-xs text-anthracite-400">Finalisation du shift</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['uploading', 'transcribing', 'analyzing', 'creating'] as const).map((step, i) => (
                      <div key={step} className="text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                          submissionStep === step ? 'bg-white text-anthracite-900' :
                          (['uploading', 'transcribing', 'analyzing', 'creating'].indexOf(submissionStep || '') > i) ? 'bg-white/30' : 'bg-white/10'
                        }`}>
                          {(['uploading', 'transcribing', 'analyzing', 'creating'].indexOf(submissionStep || '') > i) ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span className="text-xs">{i + 1}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-anthracite-400">
                          {step === 'uploading' ? 'Envoi' : step === 'transcribing' ? 'Transcription' : step === 'analyzing' ? 'Analyse' : 'Envoi'}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== SHIFT SUBMITTED ==================== */}
        {view === 'shift-submitted' && (
          <motion.div
            key="shift-submitted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 bg-anthracite-900 text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-lg"
            >
              <motion.svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
              >
                <motion.polyline
                  points="20 6 9 17 4 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                />
              </motion.svg>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-medium mb-3"
            >
              Shift terminé !
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-anthracite-300 text-center text-lg mb-8"
            >
              En attente de validation par l'employeur
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={() => {
                setView('main')
                setTab('home')
                setShiftStartTime(null)
                setElapsedSeconds(0)
                setSelectedMission(null)
                setSelectedEmployer(null)
                setActiveShiftId(null)
                setStartTranscript('')
              }}
              className="px-6 py-3 bg-white text-anthracite-900 rounded-xl font-medium hover:bg-anthracite-50 transition-colors"
            >
              Retour à l'accueil
            </motion.button>
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

      {/* Success Overlay - Ne pas afficher pour shift-start et shift-end */}
      {successOverlay.type !== 'shift-start' && successOverlay.type !== 'shift-end' && (
        <SuccessOverlay
          show={successOverlay.show}
          type={successOverlay.type}
          title={successOverlay.title}
          subtitle={successOverlay.subtitle}
          amount={successOverlay.amount}
          onComplete={() => {
            setSuccessOverlay({ show: false, type: 'shift-start' })
          }}
        />
      )}
    </div>
  )
}
