// FIXED: Register.jsx
// KEY BUGS FIXED:
// 1. Frontend was sending { full_name } — backend expects { name }
// 2. Frontend was sending { confirmPassword } — backend expects { confirm_password }
//    (actually backend doesn't use confirm_password at all — validation is client-side)
// 3. role: "owner" is now explicitly sent
// 4. After register: if token returned → login() + navigate('/dashboard')
//    if no token returned → redirect to /login with success message

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import '../styles/Auth.css'

function getPasswordStrength(password) {
  if (!password) return { level: '', label: '' }
  const hasLower   = /[a-z]/.test(password)
  const hasUpper   = /[A-Z]/.test(password)
  const hasNum     = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  const score = [hasLower, hasUpper, hasNum, hasSpecial].filter(Boolean).length
  if (password.length < 6)  return { level: 'weak',   label: 'Too short' }
  if (score === 1)           return { level: 'weak',   label: 'Weak' }
  if (score === 2)           return { level: 'fair',   label: 'Fair' }
  if (score === 3)           return { level: 'good',   label: 'Good' }
  return                            { level: 'strong', label: 'Strong' }
}

function Register() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError]   = useState('')
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const watchedPassword = watch('password', '')

  useEffect(() => {
    document.title = 'Register as Owner — Nestora'
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const strength = getPasswordStrength(watchedPassword)

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setServerError('')

      // FIXED: map frontend field names to what the backend expects
      // Backend register() reads: name, email, phone, password, role
      const payload = {
        name:     data.full_name.trim(),   // FIXED: full_name → name
        email:    data.email.trim(),
        phone:    data.phone.trim(),
        password: data.password,
        role:     'owner',                 // always owner
      }

      const res = await api.post('/api/auth/register', payload)

      // Backend returns { success, message, data: { user } }
      // It does NOT return a token on register — redirect to login
      const { access_token, token } = res.data?.data || res.data || {}
      const jwtToken = access_token || token

      if (jwtToken) {
        // Some backends return token on register — handle it
        const userData = res.data?.data?.user || res.data?.user || payload
        login(jwtToken, userData)
        navigate('/dashboard', { replace: true })
      } else {
        // Normal flow: register returns no token → go to login
        navigate('/login', {
          replace: true,
          state: { message: '✅ Account created! Please log in.' },
        })
      }
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left Panel ── */}
      <div className="auth-left" aria-hidden="true">
        <div className="auth-left-content">
          <div className="auth-left-illustration">🏘️</div>
          <div className="auth-left-logo">Nestora</div>
          <p className="auth-left-tagline">
            Join thousands of property owners listing their PGs and hostels on Nestora.
          </p>
          <div
            style={{
              marginTop: 'var(--space-xl)',
              padding: 'var(--space-lg)',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {[
              '✅ Free to list your property',
              '📊 Manage listings from dashboard',
              '📞 Get direct student inquiries',
              '🔒 Secure & verified platform',
            ].map((item) => (
              <div
                key={item}
                style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', padding: '6px 0' }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          {/* Logo */}
          <div className="auth-form-header">
            <Link to="/" className="auth-form-logo" style={{ textDecoration: 'none' }}>
              <div className="auth-form-logo-icon">🏠</div>
              <span className="auth-form-logo-text">Nestora</span>
            </Link>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Register as an owner to list your property</p>
          </div>

          {serverError && (
            <div className="alert alert-error" role="alert">
              🚨 {serverError}
            </div>
          )}

          <form
            id="register-form"
            className="auth-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name *</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Your full name"
                  autoComplete="name"
                  {...register('full_name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
              </div>
              {errors.full_name && <p className="form-error">⚠️ {errors.full_name.message}</p>}
            </div>

            {/* Email + Phone Row */}
            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email *</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📧</span>
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email',
                      },
                    })}
                  />
                </div>
                {errors.email && <p className="form-error">⚠️ {errors.email.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Phone *</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📞</span>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    placeholder="10-digit mobile"
                    autoComplete="tel"
                    {...register('phone', {
                      required: 'Phone is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter a valid 10-digit mobile number',
                      },
                    })}
                  />
                </div>
                {errors.phone && <p className="form-error">⚠️ {errors.phone.message}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password *</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters required' },
                  })}
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              {errors.password && <p className="form-error">⚠️ {errors.password.message}</p>}

              {/* Password strength */}
              {watchedPassword && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div className={`password-strength-fill ${strength.level}`} />
                  </div>
                  <span className={`password-strength-label ${strength.level}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password *</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔐</span>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  {...register('confirm_password', {
                    required: 'Please confirm your password',
                    validate: (val) => val === watchedPassword || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? '👁️' : '🙈'}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="form-error">⚠️ {errors.confirm_password.message}</p>
              )}
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg auth-submit-btn"
              disabled={loading}
            >
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>

          <p className="auth-terms">
            By registering, you agree to our <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
