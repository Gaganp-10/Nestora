import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/**
 * NotFound — 404 page
 */
function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '404 — Page Not Found | Nestora'
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)',
        padding: '40px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(232,93,38,0.06)',
          top: '-100px',
          right: '-100px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(232,93,38,0.04)',
          bottom: '-80px',
          left: '-80px',
          pointerEvents: 'none',
        }}
      />

      {/* Content Card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-xl)',
          padding: '60px 48px',
          maxWidth: 520,
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Illustration */}
        <div
          style={{
            fontSize: '6rem',
            marginBottom: '24px',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
            animation: 'float 3s ease-in-out infinite',
          }}
        >
          🏚️
        </div>

        {/* 404 Number */}
        <div
          style={{
            fontSize: '7rem',
            fontWeight: 900,
            color: 'var(--primary)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            marginBottom: '12px',
          }}
        >
          404
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '12px',
          }}
        >
          Page Not Found
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.7,
            marginBottom: '36px',
          }}
        >
          Oops! The page you're looking for seems to have moved, or maybe it never existed.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn btn-outline-light btn-lg"
            onClick={() => navigate(-1)}
            id="go-back-btn"
          >
            ← Go Back
          </button>
          <Link to="/" className="btn btn-primary btn-lg" id="go-home-btn">
            🏠 Go Home
          </Link>
          <Link to="/browse" className="btn btn-lg"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            🔍 Browse Hostels
          </Link>
        </div>

        {/* Quick links */}
        <div
          style={{
            marginTop: '36px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
            Quick Links
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { to: '/', label: 'Home' },
              { to: '/browse', label: 'Browse' },
              { to: '/login', label: 'Login' },
              { to: '/register', label: 'Register' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}

export default NotFound
