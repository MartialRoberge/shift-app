import { authApi } from './api'

export type UserRole = 'worker' | 'employer' | 'agency' | 'admin'

export interface User {
  id: string
  name: string
  email?: string
  role: UserRole
  xrpl_address?: string
  avatar?: string
}

const AUTH_TOKEN_KEY = 'auth_token'
const USER_KEY = 'user'

export const auth = {
  getToken: (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },

  setToken: (token: string): void => {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  },

  removeToken: (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  },

  getUser: (): User | null => {
    const userData = localStorage.getItem(USER_KEY)
    return userData ? JSON.parse(userData) : null
  },

  setUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  removeUser: (): void => {
    localStorage.removeItem(USER_KEY)
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_TOKEN_KEY)
  },

  // Real login using backend API
  login: async (credentials: {
    email?: string
    name?: string
    password?: string
  }): Promise<{ user: User; token: string }> => {
    try {
      const response = await authApi.login(credentials)

      // Map backend role to frontend role (employer becomes agency in frontend)
      const frontendRole: UserRole = response.user.role === 'employer' ? 'agency' : response.user.role

      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: frontendRole,
        xrpl_address: response.user.xrpl_address,
        avatar: response.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      }

      auth.setToken(response.token)
      auth.setUser(user)

      return { user, token: response.token }
    } catch (error) {
      throw error
    }
  },

  // Real registration using backend API
  register: async (data: {
    name: string
    email?: string
    password?: string
    role: 'worker' | 'employer' | 'admin'
    xrpl_address?: string
  }): Promise<{ user: User; token: string }> => {
    try {
      const response = await authApi.register(data)

      // Map backend role to frontend role
      const frontendRole: UserRole = response.user.role === 'employer' ? 'agency' : response.user.role

      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: frontendRole,
        xrpl_address: response.user.xrpl_address,
        avatar: response.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      }

      auth.setToken(response.token)
      auth.setUser(user)

      return { user, token: response.token }
    } catch (error) {
      throw error
    }
  },

  // Quick login by name and role (for demo purposes) - legacy method
  quickLogin: async (name: string, role: 'worker' | 'employer'): Promise<{ user: User; token: string }> => {
    // Create a unique identifier based on name + role to separate worker/employer accounts
    const loginName = `${name}_${role}`

    try {
      // Try to login first with role-specific name
      return await auth.login({ name: loginName })
    } catch {
      // If user doesn't exist, register them with the original name but store with role suffix
      const response = await auth.register({ name: loginName, role })

      // Update the displayed name to be clean (without role suffix)
      const user = auth.getUser()
      if (user) {
        user.name = name
        auth.setUser(user)
      }

      return { ...response, user: { ...response.user, name } }
    }
  },

  // Quick login by user ID (for demo dropdown selection)
  quickLoginById: async (userId: string): Promise<{ user: User; token: string }> => {
    try {
      const response = await authApi.quickLoginById(userId)

      // Map backend role to frontend role (employer becomes agency in frontend)
      const frontendRole: UserRole = response.user.role === 'employer' ? 'agency' : response.user.role

      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: frontendRole,
        xrpl_address: response.user.xrpl_address,
        avatar: response.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      }

      auth.setToken(response.token)
      auth.setUser(user)

      return { user, token: response.token }
    } catch (error) {
      throw error
    }
  },

  logout: (): void => {
    auth.removeToken()
    auth.removeUser()
  },
}
