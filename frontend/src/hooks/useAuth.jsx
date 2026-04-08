import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { userService } from '../services/api'
import api from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'rms_token'
const USER_KEY  = 'rms_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  // Set token on mount
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (token) api.defaults.headers.common['x-auth-token'] = token
  }, [])

  const login = useCallback(async (email, password) => {
    const password_hash = btoa(password)
    const res = await userService.login({ email, password_hash })
    const { data: userData, token } = res

    setUser(userData)
    sessionStorage.setItem(USER_KEY, JSON.stringify(userData))
    sessionStorage.setItem(TOKEN_KEY, token)
    api.defaults.headers.common['x-auth-token'] = token

    return userData
  }, [])

  const register = useCallback(async (username, email, password, role, license_number) => {
    const password_hash = btoa(password)
    const res = await userService.register({
      username, email, password_hash,
      role: role || 'USER',
      license_number: role === 'OWNER' ? license_number : undefined
    })
    return res.message
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    delete api.defaults.headers.common['x-auth-token']
  }, [])

  // Update user data (e.g. after accepting admin invite)
  const updateUser = useCallback((newUserData, newToken) => {
    setUser(newUserData)
    sessionStorage.setItem(USER_KEY, JSON.stringify(newUserData))
    if (newToken) {
      sessionStorage.setItem(TOKEN_KEY, newToken)
      api.defaults.headers.common['x-auth-token'] = newToken
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
