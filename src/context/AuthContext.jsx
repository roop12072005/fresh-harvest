import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    try {
      const me = await api('/api/auth/me')
      setUser(me)
      return me
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const register = useCallback(async (payload) => {
    const created = await api('/api/auth/register', { method: 'POST', body: payload })
    setUser(created)
    setMessage(`Welcome to FreshHarvest, ${created.name.split(' ')[0]}!`)
    return created
  }, [])

  const login = useCallback(async (payload) => {
    const session = await api('/api/auth/login', { method: 'POST', body: payload })
    setUser(session)
    setMessage(`Welcome back, ${session.name.split(' ')[0]}!`)
    return session
  }, [])

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setMessage('You have been logged out successfully.')
  }, [])

  useEffect(() => {
    if (!message) return undefined
    const timeoutId = window.setTimeout(() => setMessage(''), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const value = useMemo(
    () => ({ user, loading, register, login, logout, refresh, message, dismissMessage: () => setMessage('') }),
    [user, loading, register, login, logout, refresh, message]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
