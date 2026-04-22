import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('sl_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('sl_token')
    if (storedToken) {
      authApi.me()
        .then(data => {
          if (data) setUser(data)
          else      clearAuth()
        })
        .catch(() => clearAuth())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Called after a successful login or register API call
  // authResp = { token, email, fullName, role, message }
  const login = (authResp) => {
    localStorage.setItem('sl_token', authResp.token)
    setToken(authResp.token)
    setUser({ email: authResp.email, fullName: authResp.fullName, role: authResp.role })
  }

  const clearAuth = () => {
    localStorage.removeItem('sl_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout: clearAuth, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
