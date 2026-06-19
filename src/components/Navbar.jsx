import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/helpers'
import '../styles/Navbar.css'

/**
 * Navbar — sticky top navigation bar
 * Shows different links based on auth state
 */
function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef(null)

  // Track scroll to add shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Close menu on route change
  const handleNavClick = () => setMenuOpen(false)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} ref={menuRef}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={handleNavClick}>
          <div className="navbar-logo-icon">🏠</div>
          <span className="navbar-logo-text">Nestora</span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            🏡 Home
          </NavLink>
          <NavLink
            to="/browse"
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            🔍 Browse Hostels
          </NavLink>
        </div>

        {/* Desktop Auth */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <div className="navbar-user-info">
                <div className="navbar-user-avatar">
                  {getInitials(user?.name || user?.full_name || 'U')}
                </div>
                <span className="navbar-user-name">
                  {user?.name || user?.full_name || 'Owner'}
                </span>
              </div>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `btn btn-secondary btn-sm ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                📊 Dashboard
              </NavLink>
              <button className="navbar-logout-btn" onClick={handleLogout}>
                🔓 Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline btn-sm" onClick={handleNavClick}>
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" onClick={handleNavClick}>
                Register Owner
              </NavLink>
            </>
          )}
        </div>

        {/* Hamburger Button */}
        <button
          id="navbar-hamburger"
          className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar-mobile-menu ${menuOpen ? 'open' : ''}`}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          🏡 Home
        </NavLink>
        <NavLink
          to="/browse"
          className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
          onClick={handleNavClick}
        >
          🔍 Browse Hostels
        </NavLink>

        <div className="navbar-mobile-divider" />

        <div className="navbar-mobile-auth">
          {isAuthenticated ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px' }}>
                <div className="navbar-user-avatar">
                  {getInitials(user?.name || user?.full_name || 'U')}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {user?.name || user?.full_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              <NavLink
                to="/dashboard"
                className="navbar-mobile-link"
                onClick={handleNavClick}
              >
                📊 Dashboard
              </NavLink>
              <button
                className="navbar-mobile-link"
                style={{
                  border: 'none',
                  background: '#FEF2F2',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onClick={handleLogout}
              >
                🔓 Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline btn-full" onClick={handleNavClick}>
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-full" onClick={handleNavClick}>
                Register Owner
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
