// FIXED: Login.jsx
// KEY BUGS FIXED:
// 1. Backend returns { success, message, data: { access_token, user } }
//    — must extract token from response.data.data.access_token
// 2. After calling login(token, user), navigate('/dashboard')
// 3. Shows success message if redirected here from Register
// 4. User object from backend has user_id and name — stored as-is

import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import '../styles/Auth.css'

function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [serverError,   setServerError]   = useState('')
  const [loading,       setLoading]       = useState(false)
  const [showPassword,  setShowPassword]  = useState(false)

  // Message passed from Register page on success
  const registerMessage = location.state?.message || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    document.title = 'Login — Nestora'
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setServerError('')

      const res = await api.post('/api/auth/login', {
        email:    data.email.trim().toLowerCase(),
        password: data.password,
      })

      // FIXED: Backend wraps data in res.data.data
      // Shape: { success, message, data: { access_token, token_type, user } }
      const payload    = res.data?.data || res.data || {}
      const jwtToken   = payload.access_token || payload.token
      const userData   = payload.user || {}

      if (!jwtToken) {
        throw new Error('Server did not return a token. Please try again.')
      }

      // FIXED: call login() THEN navigate — this updates context state
      login(jwtToken, userData)
      navigate('/dashboard', { replace: true })

    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left Panel ── */}
      <div className="auth-left" aria-hidden="true">
        <div className="auth-left-content">
          <div className="auth-left-illustration">🏠</div>
          <div className="auth-left-logo">Nestora</div>
          <p className="auth-left-tagline">
            Manage your PG & hostel listings from one powerful dashboard.
          </p>
          <div className="auth-left-stats">
            <div className="auth-left-stat">
              <div className="auth-left-stat-num">500+</div>
              <div className="auth-left-stat-label">Listings</div>
            </div>
            <div className="auth-left-stat">
              <div className="auth-left-stat-num">20+</div>
              <div className="auth-left-stat-label">Cities</div>
            </div>
            <div className="auth-left-stat">
              <div className="auth-left-stat-num">10K+</div>
              <div className="auth-left-stat-label">Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <Link to="/" className="auth-form-logo" style={{ textDecoration: 'none' }}>
              <div className="auth-form-logo-icon">🏠</div>
              <span className="auth-form-logo-text">Nestora</span>
            </Link>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your owner account</p>
          </div>

          {/* Success message from Register page */}
          {registerMessage && (
            <div className="alert alert-success" role="status">{registerMessage}</div>
          )}

          {serverError && (
            <div className="alert alert-error" role="alert">🚨 {serverError}</div>
          )}

          <form
            id="login-form"
            className="auth-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">📧</span>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address',
                    },
                  })}
                />
              </div>
              {errors.email && <p className="form-error">⚠️ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your password"
                  autoComplete="current-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              {errors.password && <p className="form-error">⚠️ {errors.password.message}</p>}
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg auth-submit-btn"
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '🔑 Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register as Owner</Link>
          </p>

          <p className="auth-terms">
            By signing in, you agree to our <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
