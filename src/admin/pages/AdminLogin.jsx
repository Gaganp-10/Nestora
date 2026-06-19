// AdminLogin.jsx — Standalone dark-themed admin login page
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function AdminLogin({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password.'); return }
    try {
      setLoading(true)
      setError('')

      const res = await api.post('/api/auth/login', { email: email.trim().toLowerCase(), password })
      const payload  = res.data?.data || res.data || {}
      const token    = payload.access_token || payload.token
      const userData = payload.user || {}

      if (!token) throw new Error('No token returned from server.')

      // ADMIN CHECK — role must be "admin"
      if (userData.role !== 'admin') {
        setError('Access denied. This portal is for administrators only.')
        return
      }

      localStorage.setItem('nestora_token', token)
      localStorage.setItem('nestora_user',  JSON.stringify(userData))
      localStorage.setItem('nestora_admin', 'true')

      onLoginSuccess?.(userData)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A1A2E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-50%', left: '-20%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(232,93,38,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30%', right: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '48px 44px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60,
            background: 'linear-gradient(135deg, #E85D26, #c94a1e)',
            borderRadius: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(232,93,38,0.3)',
          }}>🏠</div>
          <h1 style={{
            fontSize: '1.5rem', fontWeight: 800,
            color: '#1E293B', letterSpacing: '-0.02em', marginBottom: 4,
          }}>Admin Portal</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Nestora Management System</p>
        </div>

        {error && (
          <div style={{
            background: '#FFF5F5', border: '1.5px solid #FECACA',
            borderRadius: 10, padding: '12px 16px',
            color: '#7F1D1D', fontSize: '0.875rem',
            fontWeight: 600, marginBottom: 20,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            🚨 {error}
          </div>
        )}

        <form id="admin-login-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="admin-email" style={{
              display: 'block', marginBottom: 6,
              fontSize: '0.8rem', fontWeight: 700,
              color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@nestora.com"
              autoComplete="email"
              style={{
                width: '100%', padding: '11px 14px',
                border: '1.5px solid #E2E8F0',
                borderRadius: 10, fontSize: '0.9rem',
                color: '#1E293B', background: '#F8FAFC',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#E85D26'}
              onBlur={e  => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label htmlFor="admin-password" style={{
              display: 'block', marginBottom: 6,
              fontSize: '0.8rem', fontWeight: 700,
              color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '11px 44px 11px 14px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10, fontSize: '0.9rem',
                  color: '#1E293B', background: '#F8FAFC',
                  outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#E85D26'}
                onBlur={e  => e.target.style.borderColor = '#E2E8F0'}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: '1rem',
                }}
                aria-label="Toggle password"
              >{showPw ? '👁️' : '🙈'}</button>
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #E85D26, #c94a1e)',
              color: '#fff', border: 'none',
              borderRadius: 10, fontSize: '0.95rem',
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(232,93,38,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ Signing in...' : '🔑 Login as Admin'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/" style={{ color: '#64748B', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← Back to Main Site
          </a>
        </div>

        <div style={{
          marginTop: 24, padding: '14px',
          background: '#F8FAFC', borderRadius: 10,
          border: '1px dashed #CBD5E1', fontSize: '0.78rem', color: '#64748B',
        }}>
          <strong>Demo Credentials:</strong><br />
          📧 admin@nestora.com<br />
          🔑 Admin@1234
        </div>
      </div>
    </div>
  )
}
