import { createContext, useContext, useState, useCallback } from 'react'
import { userService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('rms_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    // Simple SHA-256 placeholder — use bcrypt in production
    const password_hash = btoa(password) // base64 for demo
    const res = await userService.login({ email, password_hash })
    const userData = res.data
    setUser(userData)
    sessionStorage.setItem('rms_user', JSON.stringify(userData))
    return userData
  }, [])

  const register = useCallback(async (username, email, password) => {
    const password_hash = btoa(password)
    const res = await userService.register({ username, email, password_hash })
    return res
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('rms_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
