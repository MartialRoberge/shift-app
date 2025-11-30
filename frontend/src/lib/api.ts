const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }

  return response.json()
}

async function fetchWithAuthFormData(url: string, formData: FormData) {
  const token = localStorage.getItem('auth_token')

  const headers: HeadersInit = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }

  return response.json()
}

// ==================== AUTH API ====================
export const authApi = {
  register: (data: {
    name: string
    email?: string
    password?: string
    role: 'worker' | 'employer' | 'admin'
    xrpl_address?: string
  }) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email?: string; name?: string; password?: string }) =>
    fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // Get users by role (for demo login dropdown)
  getUsers: (role?: 'worker' | 'employer' | 'admin') =>
    fetchWithAuth(`/auth/users${role ? `?role=${role}` : ''}`),

  // Quick login by user ID (for demo)
  quickLoginById: (userId: string) =>
    fetchWithAuth('/auth/quick-login', { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
}

// ==================== WORKER API ====================
export const workerApi = {
  // Transcribe audio for preview (without creating a shift)
  transcribe: (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    return fetchWithAuthFormData('/worker/transcribe', formData)
  },

  // Start a shift with audio recording
  startShift: (data: {
    employer_id: string
    job_type?: string
    audioBlob?: Blob
    transcript?: string
    latitude?: number
    longitude?: number
  }) => {
    const formData = new FormData()
    formData.append('employer_id', data.employer_id)
    if (data.job_type) formData.append('job_type', data.job_type)
    if (data.transcript) formData.append('transcript', data.transcript)
    if (data.audioBlob) formData.append('audio', data.audioBlob, 'checkin.webm')
    if (data.latitude) formData.append('latitude', data.latitude.toString())
    if (data.longitude) formData.append('longitude', data.longitude.toString())
    return fetchWithAuthFormData('/worker/shifts/start', formData)
  },

  // End a shift with audio recording
  endShift: (data: {
    work_session_id: string
    audioBlob: Blob
    latitude?: number
    longitude?: number
    location_accuracy?: number
  }) => {
    const formData = new FormData()
    formData.append('work_session_id', data.work_session_id)
    formData.append('audio', data.audioBlob, 'checkout.webm')
    if (data.latitude) formData.append('latitude', data.latitude.toString())
    if (data.longitude) formData.append('longitude', data.longitude.toString())
    if (data.location_accuracy) formData.append('location_accuracy', data.location_accuracy.toString())
    return fetchWithAuthFormData('/worker/shifts/end', formData)
  },

  // Get worker's shifts
  getShifts: () => fetchWithAuth('/worker/shifts'),

  // Get available employers
  getEmployers: () => fetchWithAuth('/worker/employers'),

  // Get worker profile (with auto wallet generation)
  getProfile: () => fetchWithAuth('/worker/profile'),
}

// ==================== EMPLOYER API ====================
export const employerApi = {
  // Get shifts to validate (optionally filter by status)
  getShifts: (status?: string) =>
    fetchWithAuth(`/employer/shifts${status ? `?status=${status}` : ''}`),

  // Validate a shift (creates escrow + NFT on XRPL)
  validateShift: (
    shiftId: string,
    data?: {
      hourly_rate?: number
      start_time?: string
      end_time?: string
      adjustments?: string
    }
  ) =>
    fetchWithAuth(`/employer/shifts/${shiftId}/validate`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  // Refuse a shift
  refuseShift: (shiftId: string) =>
    fetchWithAuth(`/employer/shifts/${shiftId}/refuse`, { method: 'POST' }),
}

// ==================== SHIFTS API ====================
export const shiftsApi = {
  // Get shift details
  getShift: (shiftId: string) => fetchWithAuth(`/shifts/${shiftId}`),

  // Release payment from escrow
  releasePayment: (shiftId: string) =>
    fetchWithAuth(`/shifts/${shiftId}/release`, { method: 'POST' }),

  // Get available missions (from employers)
  getAvailableMissions: () => fetchWithAuth('/missions/available'),

  // Get my missions (accepted by worker)
  getMyMissions: () => fetchWithAuth('/missions/mine'),

  // Accept a mission
  acceptMission: (missionId: string) =>
    fetchWithAuth(`/missions/${missionId}/accept`, { method: 'POST' }),

  // Decline a mission
  declineMission: (missionId: string) =>
    fetchWithAuth(`/missions/${missionId}/decline`, { method: 'POST' }),
}

// ==================== MISSIONS API (for employers/agencies) ====================
export const missionsApi = {
  // Create a new mission
  create: (data: {
    title: string
    description: string
    location: string
    address: string
    hourly_rate: number
    total_hours_needed: number
    requirements?: string[]
  }) => fetchWithAuth('/missions', { method: 'POST', body: JSON.stringify(data) }),

  // Get my missions (as employer)
  getMyMissions: () => fetchWithAuth('/missions/employer'),

  // Get a specific mission
  getMission: (missionId: string) => fetchWithAuth(`/missions/${missionId}`),

  // Update a mission
  updateMission: (missionId: string, data: Record<string, unknown>) =>
    fetchWithAuth(`/missions/${missionId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Delete a mission
  deleteMission: (missionId: string) =>
    fetchWithAuth(`/missions/${missionId}`, { method: 'DELETE' }),

  // Get candidates for a mission
  getCandidates: (missionId: string) => fetchWithAuth(`/missions/${missionId}/candidates`),

  // Accept a candidate
  acceptCandidate: (missionId: string, workerId: string) =>
    fetchWithAuth(`/missions/${missionId}/candidates/${workerId}/accept`, { method: 'POST' }),

  // Reject a candidate
  rejectCandidate: (missionId: string, workerId: string) =>
    fetchWithAuth(`/missions/${missionId}/candidates/${workerId}/reject`, { method: 'POST' }),
}

// ==================== STATS API ====================
export const statsApi = {
  // Global stats (admin/employer)
  getGlobal: () => fetchWithAuth('/stats/global'),

  // Worker stats
  getWorkerStats: (workerId: string) => fetchWithAuth(`/stats/workers/${workerId}/shifts`),

  // Employer stats
  getEmployerStats: (employerId: string) => fetchWithAuth(`/stats/employers/${employerId}/shifts`),
}

// ==================== WALLET API ====================
export const walletApi = {
  // Connect XRPL wallet
  connect: (secret: string) =>
    fetchWithAuth('/wallet/connect', { method: 'POST', body: JSON.stringify({ secret }) }),

  // Get wallet balance
  getBalance: (address: string) => fetch(`${API_BASE}/wallet/balance/${address}`).then(r => r.json()),

  // Send XRP
  send: (data: { secret: string; destination: string; amount: number }) =>
    fetchWithAuth('/wallet/send', { method: 'POST', body: JSON.stringify(data) }),
}

// ==================== WORKERS API (for employers/agencies) ====================
export const workersApi = {
  // Get all workers
  getAll: () => fetchWithAuth('/workers'),

  // Get a specific worker
  getWorker: (workerId: string) => fetchWithAuth(`/workers/${workerId}`),

  // Get worker's shifts
  getWorkerShifts: (workerId: string) => fetchWithAuth(`/workers/${workerId}/shifts`),
}

// ==================== BLOCKCHAIN API ====================
export const blockchainApi = {
  // Verify shift on blockchain
  verifyShift: (shiftId: string) => fetchWithAuth(`/blockchain/verify/${shiftId}`),

  // Get blockchain proof
  getProof: (shiftId: string) => fetchWithAuth(`/blockchain/proof/${shiftId}`),
}

// ==================== XRPL API ====================
export const xrplApi = {
  // Get XRPL dashboard data (escrow balance, paid, transactions)
  getDashboard: () => fetchWithAuth('/xrpl/dashboard'),

  // Get all XRPL transactions
  getTransactions: (params?: { limit?: number; offset?: number; type?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.offset) queryParams.set('offset', params.offset.toString())
    if (params?.type) queryParams.set('type', params.type)
    const query = queryParams.toString()
    return fetchWithAuth(`/xrpl/transactions${query ? `?${query}` : ''}`)
  },

  // Get active escrows from XRPL
  getEscrows: () => fetchWithAuth('/xrpl/escrows'),

  // Verify a transaction on XRPL
  verifyTransaction: (hash: string) =>
    fetch(`${API_BASE}/xrpl/verify/${hash}`).then(r => r.json()),
}

// Keep old exports for backwards compatibility during migration
export const offersApi = missionsApi
