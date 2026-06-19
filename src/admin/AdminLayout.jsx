import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import './AdminLayout.css'

const NAV_ITEMS = [
  { to: '/admin',         label: 'Dashboard',   icon: '📊', end: true },
  { to: '/admin/users',   label: 'Users',        icon: '👥' },
  { to: '/admin/hostels', label: 'Hostels',      icon: '🏨' },
  { to: '/admin/reviews', label: 'Reviews',      icon: '⭐' },
]

function getInitials(name = '') {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'A'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getPageTitle(pathname) {
  if (pathname === '/admin')              return { title: 'Dashboard', crumb: 'Admin / Dashboard' }
  if (pathname.startsWith('/admin/users'))    return { title: 'Users', crumb: 'Admin / Users' }
  if (pathname.startsWith('/admin/hostels'))  return { title: 'Hostels', crumb: 'Admin / Hostels' }
  if (pathname.startsWith('/admin/reviews'))  return { title: 'Reviews', crumb: 'Admin / Reviews' }
  return { title: 'Admin Panel', crumb: 'Admin' }
}

export default function AdminLayout({ user, onLogout }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = window.location.pathname
  const { title, crumb } = getPageTitle(pathname)

  const handleLogout = () => {
    localStorage.removeItem('nestora_token')
    localStorage.removeItem('nestora_user')
    onLogout?.()
    navigate('/admin/login', { replace: true })
  }

  const adminName  = user?.name  || 'Admin'
  const adminEmail = user?.email || 'admin@nestora.com'

  return (
    <div className="admin-shell">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <Link to="/admin" className="admin-sidebar-logo" onClick={() => setSidebarOpen(false)}>
          <div className="admin-sidebar-logo-icon">🏠</div>
          <div className="admin-sidebar-logo-text">
            <span className="admin-sidebar-logo-name">Nestora</span>
            <span className="admin-sidebar-logo-tag">Admin Panel</span>
          </div>
        </Link>

        {/* Main Navigation */}
        <div className="admin-nav-section">Main Menu</div>
        <nav aria-label="Admin navigation">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <hr className="admin-nav-divider" />

        {/* External Links */}
        <div className="admin-nav-section">Quick Links</div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-nav-link"
        >
          <span className="admin-nav-icon">🔗</span>
          View Main Site
        </a>
        <button
          className="admin-nav-link"
          onClick={handleLogout}
          id="sidebar-logout-btn"
        >
          <span className="admin-nav-icon">🚪</span>
          Logout
        </button>

        {/* User Info at bottom */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{getInitials(adminName)}</div>
            <div>
              <div className="admin-user-name">{adminName}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <button
            className="admin-hamburger"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <div style={{ flex: 1 }}>
            <div className="admin-header-title">{title}</div>
            <div className="admin-header-breadcrumb">{crumb}</div>
          </div>

          <div className="admin-header-actions">
            <div className="admin-header-avatar">{getInitials(adminName)}</div>
            <span className="admin-header-name">{adminName}</span>
            <button
              className="admin-header-logout"
              onClick={handleLogout}
              id="header-logout-btn"
            >
              🚪 Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
