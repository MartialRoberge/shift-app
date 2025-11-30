import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

/*
  STATION VIEW - Interface du client

  Analogie : Le client est une "Station" qui a besoin d'opérateurs
  - Il publie des "shifts" (créneaux de travail)
  - Il voit les candidats disponibles
  - Il valide les prestations effectuées
*/

interface ShiftPost {
  id: string
  role: string
  location: string
  date: string
  startTime: string
  endTime: string
  rate: number
  candidates: number
  status: 'open' | 'assigned' | 'completed'
}

interface Candidate {
  id: string
  name: string
  rating: number
  shiftsCompleted: number
}

const mockShiftPosts: ShiftPost[] = [
  {
    id: '1',
    role: 'Manutentionnaire',
    location: 'Entrepôt Nord',
    date: 'Aujourd\'hui',
    startTime: '06:00',
    endTime: '14:00',
    rate: 12.50,
    candidates: 4,
    status: 'open',
  },
  {
    id: '2',
    role: 'Agent logistique',
    location: 'Quai A3',
    date: 'Demain',
    startTime: '05:00',
    endTime: '13:00',
    rate: 13.00,
    candidates: 2,
    status: 'open',
  },
  {
    id: '3',
    role: 'Cariste',
    location: 'Zone B',
    date: 'Hier',
    startTime: '08:00',
    endTime: '16:00',
    rate: 14.50,
    candidates: 0,
    status: 'completed',
  },
]

const mockCandidates: Candidate[] = [
  { id: '1', name: 'Jean D.', rating: 4.8, shiftsCompleted: 45 },
  { id: '2', name: 'Marie M.', rating: 4.5, shiftsCompleted: 32 },
  { id: '3', name: 'Pierre L.', rating: 4.9, shiftsCompleted: 67 },
  { id: '4', name: 'Sophie B.', rating: 4.2, shiftsCompleted: 18 },
]

type View = 'home' | 'new-shift' | 'candidates' | 'confirm'

export function EmployerHome() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('home')
  const [selectedShift, setSelectedShift] = useState<ShiftPost | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    role: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    rate: '',
  })

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault()
    // API call here
    setView('home')
    setFormData({ role: '', location: '', date: '', startTime: '', endTime: '', rate: '' })
  }

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setView('confirm')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AnimatePresence mode="wait">
        {/* HOME VIEW */}
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 pt-12 md:pt-8 max-w-lg mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <button
                  onClick={() => navigate('/select-role')}
                  className="text-xs text-anthracite-400 hover:text-anthracite-600 transition-colors mb-1"
                >
                  ← Retour
                </button>
                <h1 className="text-xl font-medium text-anthracite-900">
                  Station
                </h1>
              </div>
              <Button
                size="sm"
                onClick={() => setView('new-shift')}
              >
                Nouveau shift
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">8</p>
                <p className="text-xs text-anthracite-400">Shifts actifs</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">23</p>
                <p className="text-xs text-anthracite-400">Complétés</p>
              </div>
              <div className="bg-white border border-anthracite-100 rounded-xl p-3 text-center">
                <p className="text-xl font-medium text-anthracite-900">98%</p>
                <p className="text-xs text-anthracite-400">Fiabilité</p>
              </div>
            </div>

            {/* Shift Posts */}
            <section>
              <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
                Vos shifts
              </p>
              <div className="space-y-2">
                {mockShiftPosts.map((shift) => (
                  <motion.div
                    key={shift.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                      shift.status === 'completed'
                        ? 'border-anthracite-50 opacity-60'
                        : 'border-anthracite-100 hover:border-anthracite-200'
                    }`}
                    onClick={() => {
                      if (shift.status === 'open') {
                        setSelectedShift(shift)
                        setView('candidates')
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-anthracite-900 text-sm">
                          {shift.role}
                        </h3>
                        <p className="text-xs text-anthracite-500">
                          {shift.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-anthracite-400">
                          {shift.date}
                        </p>
                        {shift.status === 'open' && shift.candidates > 0 && (
                          <p className="text-xs text-anthracite-900 font-medium">
                            {shift.candidates} candidats
                          </p>
                        )}
                        {shift.status === 'completed' && (
                          <p className="text-xs text-anthracite-400">
                            Terminé
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-anthracite-500">
                      <span>{shift.startTime} - {shift.endTime}</span>
                      <span className="font-medium text-anthracite-900">{shift.rate}€/h</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* NEW SHIFT VIEW */}
        {view === 'new-shift' && (
          <motion.div
            key="new-shift"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 pt-12 md:pt-8 max-w-lg mx-auto"
          >
            <button
              onClick={() => setView('home')}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Retour
            </button>

            <h1 className="text-xl font-medium text-anthracite-900 mb-6">
              Nouveau shift
            </h1>

            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="text-xs text-anthracite-500 mb-1 block">
                  Poste
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ex: Manutentionnaire"
                  className="w-full h-11 px-3 bg-white border border-anthracite-100 rounded-lg text-sm focus:outline-none focus:border-anthracite-900 focus:ring-1 focus:ring-anthracite-900 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-anthracite-500 mb-1 block">
                  Lieu
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Adresse ou zone"
                  className="w-full h-11 px-3 bg-white border border-anthracite-100 rounded-lg text-sm focus:outline-none focus:border-anthracite-900 focus:ring-1 focus:ring-anthracite-900 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-anthracite-500 mb-1 block">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full h-11 px-3 bg-white border border-anthracite-100 rounded-lg text-sm focus:outline-none focus:border-anthracite-900 focus:ring-1 focus:ring-anthracite-900 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-anthracite-500 mb-1 block">
                    Début
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-anthracite-100 rounded-lg text-sm focus:outline-none focus:border-anthracite-900 focus:ring-1 focus:ring-anthracite-900 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-anthracite-500 mb-1 block">
                    Fin
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-anthracite-100 rounded-lg text-sm focus:outline-none focus:border-anthracite-900 focus:ring-1 focus:ring-anthracite-900 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-anthracite-500 mb-1 block">
                  Taux horaire (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="12.50"
                  className="w-full h-11 px-3 bg-white border border-anthracite-100 rounded-lg text-sm focus:outline-none focus:border-anthracite-900 focus:ring-1 focus:ring-anthracite-900 transition-all"
                  required
                />
              </div>

              <Button type="submit" size="xl" className="w-full mt-6">
                Publier le shift
              </Button>
            </form>
          </motion.div>
        )}

        {/* CANDIDATES VIEW */}
        {view === 'candidates' && selectedShift && (
          <motion.div
            key="candidates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 pt-12 md:pt-8 max-w-lg mx-auto"
          >
            <button
              onClick={() => setView('home')}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Retour
            </button>

            <div className="mb-6">
              <h1 className="text-xl font-medium text-anthracite-900 mb-1">
                {selectedShift.role}
              </h1>
              <p className="text-sm text-anthracite-500">
                {selectedShift.date} · {selectedShift.startTime} - {selectedShift.endTime}
              </p>
            </div>

            <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-3">
              Candidats ({mockCandidates.length})
            </p>

            <div className="space-y-2">
              {mockCandidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-white border border-anthracite-100 rounded-xl p-4 cursor-pointer transition-all hover:border-anthracite-200"
                  onClick={() => handleSelectCandidate(candidate)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-anthracite-100 rounded-full flex items-center justify-center text-sm font-medium text-anthracite-600">
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-anthracite-900 text-sm">
                          {candidate.name}
                        </h3>
                        <p className="text-xs text-anthracite-500">
                          {candidate.shiftsCompleted} shifts · {candidate.rating}/5
                        </p>
                      </div>
                    </div>
                    <span className="text-anthracite-300">→</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CONFIRM VIEW */}
        {view === 'confirm' && selectedCandidate && selectedShift && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 pt-12 md:pt-8 max-w-lg mx-auto"
          >
            <button
              onClick={() => setView('candidates')}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              ← Retour
            </button>

            <h1 className="text-xl font-medium text-anthracite-900 mb-8">
              Confirmer la sélection
            </h1>

            {/* Candidate */}
            <div className="bg-white border border-anthracite-100 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-anthracite-100 rounded-full flex items-center justify-center text-base font-medium text-anthracite-600">
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-anthracite-900">
                    {selectedCandidate.name}
                  </h3>
                  <p className="text-sm text-anthracite-500">
                    {selectedCandidate.shiftsCompleted} shifts complétés
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-sm border-t border-anthracite-50 pt-3">
                <span className="text-anthracite-500">Note moyenne</span>
                <span className="text-anthracite-900 font-medium">{selectedCandidate.rating}/5</span>
              </div>
            </div>

            {/* Shift summary */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between py-2 border-b border-anthracite-100">
                <span className="text-anthracite-500 text-sm">Poste</span>
                <span className="text-anthracite-900 text-sm">{selectedShift.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-anthracite-100">
                <span className="text-anthracite-500 text-sm">Date</span>
                <span className="text-anthracite-900 text-sm">{selectedShift.date}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-anthracite-500 text-sm">Horaires</span>
                <span className="text-anthracite-900 text-sm">
                  {selectedShift.startTime} - {selectedShift.endTime}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                size="xl"
                className="w-full"
                onClick={() => {
                  // API call
                  setView('home')
                }}
              >
                Confirmer
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setView('candidates')}
              >
                Choisir un autre candidat
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
