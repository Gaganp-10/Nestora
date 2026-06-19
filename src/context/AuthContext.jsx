// FIXED: AuthContext.jsx
// - login() now correctly saves token AND user to state AND localStorage
// - logout() clears both keys
// - ProtectedRoute uses Navigate component (no hook-in-render issue)
// - Loading state prevents flash-redirect while hydrating from localStorage

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true) // true while reading localStorage

  // ── Hydrate from localStorage on first render ──────────────────────────
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('nestora_token')
      const savedUser  = localStorage.getItem('nestora_user')

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
        setIsAuthenticated(true)
      }
    } catch (err) {
      // Corrupted storage — wipe it
      console.error('Failed to restore auth state:', err)
      localStorage.removeItem('nestora_token')
      localStorage.removeItem('nestora_user')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── login ──────────────────────────────────────────────────────────────
  // FIXED: updates all three pieces of state AND persists to localStorage
  const login = (newToken, userData) => {
    setToken(newToken)
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('nestora_token', newToken)
    localStorage.setItem('nestora_user', JSON.stringify(userData))
  }

  // ── logout ─────────────────────────────────────────────────────────────
  const logout = () => {
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('nestora_token')
    localStorage.removeItem('nestora_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── useAuth hook ───────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────
// FIXED: uses <Navigate> declaratively — no hooks inside render functions
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  // Wait until localStorage hydration completes before deciding
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div className="loader-spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
      </div>
    )
  }

  // FIXED: not authenticated → redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default AuthContext
