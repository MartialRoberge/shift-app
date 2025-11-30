import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth } from '@/lib/auth'
import { authApi } from '@/lib/api'
import { SuccessOverlay } from '@/components'

interface DemoUser {
  id: string
  name: string
  email?: string
  role: 'worker' | 'employer'
  city?: string
  country?: string
}

const roles = [
  {
    id: 'worker',
    title: 'Je suis travailleur',
    description: 'Trouvez des missions, pointez, soyez paye',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    path: '/worker',
    backendRole: 'worker' as const,
  },
  {
    id: 'agency',
    title: 'Je suis agence',
    description: 'Postez des shifts, gerez vos workers, validez',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    path: '/agency',
    backendRole: 'employer' as const,
  },
]

export function SelectRole() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [selectedRole, setSelectedRole] = useState<typeof roles[0] | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [users, setUsers] = useState<DemoUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState('')
  const [showLoginSuccess, setShowLoginSuccess] = useState(false)
  const [loginUserName, setLoginUserName] = useState('')

  // Load users when role is selected
  useEffect(() => {
    if (selectedRole) {
      loadUsers(selectedRole.backendRole)
    }
  }, [selectedRole])

  const loadUsers = async (role: 'worker' | 'employer') => {
    setLoadingUsers(true)
    try {
      const response = await authApi.getUsers(role)
      setUsers(response.users || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleRoleClick = (role: typeof roles[0]) => {
    setSelectedRole(role)
    setShowLoginForm(true)
    setSelectedUserId('')
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !selectedUserId) return

    setIsLoading(true)
    setError('')

    try {
      await auth.quickLoginById(selectedUserId)
      // Get user name for success message
      const user = users.find(u => u.id === selectedUserId)
      setLoginUserName(user?.name || '')
      setShowLoginSuccess(true)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Erreur de connexion. Verifiez que le serveur est demarre.')
      setIsLoading(false)
    }
  }

  const handleLoginSuccessComplete = () => {
    setShowLoginSuccess(false)
    setIsLoading(false)
    if (selectedRole) {
      navigate(selectedRole.path)
    }
  }

  const handleBack = () => {
    setShowLoginForm(false)
    setSelectedRole(null)
    setSelectedUserId('')
    setUsers([])
    setError('')
  }

  // Get background based on selected role
  const getBackgroundStyle = () => {
    if (!showLoginForm || !selectedRole) return {}
    const bgImage = selectedRole.id === 'worker' ? '/fond-worker.png' : '/fond-agence.png'
    return {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-all duration-500 relative"
      style={{
        backgroundColor: showLoginForm && selectedRole?.id === 'worker' ? '#E87B4F' : '#F5F5F5',
        ...getBackgroundStyle()
      }}
    >
      {/* Overlay blanc pour atténuer les couleurs du fond */}
      {showLoginForm && selectedRole && (
        <div 
          className="absolute inset-0 bg-white/80 pointer-events-none z-0"
        />
      )}
      {/* Header */}
      <header className="p-6 pt-12 md:pt-10 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <img
            src="/logo-app-fair-work.png"
            alt="Fair Work"
            className="w-20 h-20 mb-4 rounded-2xl shadow-lg"
          />
          <h1 className={`text-2xl font-medium tracking-tight mb-1 ${showLoginForm && selectedRole?.id === 'worker' ? 'text-white' : 'text-anthracite-900'}`}>
            Fair Work
          </h1>
          <p className={`text-sm ${showLoginForm && selectedRole?.id === 'worker' ? 'text-white/80' : 'text-anthracite-400'}`}>
            Travail verifie. Paiement garanti.
          </p>
        </motion.div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-12 max-w-md mx-auto w-full relative z-10">
        {!showLoginForm ? (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-anthracite-500 mb-6 text-center"
            >
              Qui etes-vous ?
            </motion.p>

            <div className="space-y-4">
              {roles.map((role, index) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleClick(role)}
                  className="w-full text-left p-5 bg-white border border-anthracite-100 rounded-2xl transition-all duration-200 hover:border-anthracite-300 hover:shadow-md group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-anthracite-50 rounded-xl flex items-center justify-center text-anthracite-600 group-hover:bg-anthracite-900 group-hover:text-white transition-colors">
                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-medium text-anthracite-900 mb-0.5">
                        {role.title}
                      </h2>
                      <p className="text-sm text-anthracite-500">
                        {role.description}
                      </p>
                    </div>
                    <span className="text-anthracite-300 group-hover:text-anthracite-600 group-hover:translate-x-1 transition-all">
                      &rarr;
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={handleBack}
              className="text-sm text-anthracite-500 hover:text-anthracite-900 transition-colors mb-6"
            >
              &larr; Retour
            </button>

            <div className="bg-white border border-anthracite-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-anthracite-900 rounded-xl flex items-center justify-center text-white">
                  {selectedRole?.icon}
                </div>
                <div>
                  <h2 className="font-medium text-anthracite-900">{selectedRole?.title}</h2>
                  <p className="text-xs text-anthracite-500">{selectedRole?.description}</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-anthracite-500 mb-2 block">
                    {selectedRole?.backendRole === 'worker' ? 'Selectionnez un travailleur' : 'Selectionnez une agence'}
                  </label>

                  {loadingUsers ? (
                    <div className="w-full h-12 bg-anthracite-50 border border-anthracite-100 rounded-xl flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-anthracite-300 border-t-anthracite-600 rounded-full animate-spin" />
                    </div>
                  ) : users.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full h-12 px-4 bg-anthracite-50 border border-anthracite-100 rounded-xl text-sm focus:outline-none focus:border-anthracite-900 focus:ring-1 focus:ring-anthracite-900 transition-all appearance-none cursor-pointer"
                        required
                      >
                        <option value="">
                          {selectedRole?.backendRole === 'worker' ? 'Choisir un travailleur...' : 'Choisir une agence...'}
                        </option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} {user.city ? `(${user.city})` : ''} {user.email ? `- ${user.email}` : ''}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full p-4 bg-anthracite-50 border border-anthracite-100 rounded-xl text-center">
                      <p className="text-sm text-anthracite-500 mb-2">
                        Aucun {selectedRole?.backendRole === 'worker' ? 'travailleur' : 'employeur'} trouve
                      </p>
                      <p className="text-xs text-anthracite-400">
                        Verifiez que le backend est demarre et que des utilisateurs existent
                      </p>
                    </div>
                  )}

                  {/* Selected user preview */}
                  {selectedUserId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 bg-anthracite-50 rounded-lg p-3"
                    >
                      {(() => {
                        const user = users.find(u => u.id === selectedUserId)
                        if (!user) return null
                        return (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-anthracite-200 rounded-full flex items-center justify-center text-sm font-medium text-anthracite-700">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-anthracite-900">{user.name}</p>
                              {user.city && (
                                <p className="text-xs text-anthracite-500">{user.city}, {user.country || 'France'}</p>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </motion.div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || !selectedUserId}
                  className="w-full bg-anthracite-900 text-white py-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connexion...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-xs text-anthracite-300"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Chaque action est enregistree sur blockchain</span>
        </motion.div>
      </footer>

      {/* Login Success Overlay */}
      <SuccessOverlay
        show={showLoginSuccess}
        type="login"
        title={`Bienvenue ${loginUserName.split(' ')[0]} !`}
        subtitle={selectedRole?.id === 'worker' ? 'Espace Travailleur' : 'Espace Agence'}
        onComplete={handleLoginSuccessComplete}
        duration={1500}
      />
    </div>
  )
}
