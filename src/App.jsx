// App.jsx — Full routing including admin panel
// Admin routes: /admin/login (public), /admin/* (admin-only)
// AdminProtectedRoute: reads token from localStorage, checks role === 'admin'

import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'

// Main site pages
import Navbar       from './components/Navbar'
import Home         from './pages/Home'
import Browse       from './pages/Browse'
import HostelDetail from './pages/HostelDetail'
import Login        from './pages/Login'
import Register     from './pages/Register'
import Dashboard    from './pages/Dashboard'
import AddHostel    from './pages/AddHostel'
import EditHostel   from './pages/EditHostel'
import NotFound     from './pages/NotFound'

// Admin panel
import AdminLayout    from './admin/AdminLayout'
import AdminLogin     from './admin/pages/AdminLogin'
import AdminDashboard from './admin/pages/AdminDashboard'
import AdminUsers     from './admin/pages/AdminUsers'
import AdminHostels   from './admin/pages/AdminHostels'
import AdminReviews   from './admin/pages/AdminReviews'

// ── Admin Auth helpers ────────────────────────────────────────────────────
function getAdminUser() {
  try {
    const raw = localStorage.getItem('nestora_user')
    if (!raw) return null
    const user = JSON.parse(raw)
    const token = localStorage.getItem('nestora_token')
    if (token && user?.role === 'admin') return user
    return null
  } catch {
    return null
  }
}

// ── AdminProtectedRoute ───────────────────────────────────────────────────
// Reads token + user from localStorage (no React context needed for admin)
function AdminProtectedRoute({ children }) {
  const adminUser = getAdminUser()
  if (!adminUser) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

// ── AdminApp — manages admin user state ──────────────────────────────────
// Wraps admin routes; tracks logged-in admin for sidebar/header
function AdminApp() {
  const [adminUser, setAdminUser] = useState(getAdminUser)

  // Sync state if localStorage changes (e.g. login from another component)
  useEffect(() => {
    const onStorage = () => setAdminUser(getAdminUser())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleLoginSuccess = (user) => setAdminUser(user)
  const handleLogout = () => setAdminUser(null)

  return (
    <Routes>
      {/* Public admin login — no sidebar */}
      <Route
        path="login"
        element={
          adminUser
            ? <Navigate to="/admin" replace />
            : <AdminLogin onLoginSuccess={handleLoginSuccess} />
        }
      />

      {/* Protected admin pages — with AdminLayout */}
      <Route
        index={false}
        path="*"
        element={
          <AdminProtectedRoute>
            <AdminLayout user={adminUser} onLogout={handleLogout}>
              {/* AdminLayout uses <Outlet /> */}
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
    </Routes>
  )
}

// ── Layout wrapper: hides Navbar on /admin routes ────────────────────────
function MainLayout({ children }) {
  // Hide main site Navbar when under /admin prefix
  const isAdmin = window.location.pathname.startsWith('/admin')
  return (
    <>
      {!isAdmin && <Navbar />}
      {children}
    </>
  )
}

// ── Root App ─────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── ADMIN ROUTES ── (own layout, no main Navbar) */}
          <Route path="/admin/login" element={<AdminLogin onLoginSuccess={() => {}} />} />

          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayoutWrapper />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users"   element={<AdminUsers />} />
            <Route path="hostels" element={<AdminHostels />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>

          {/* ── MAIN SITE ROUTES ── */}
          <Route path="/*" element={<MainSiteRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

// Wraps AdminLayout and passes user state
function AdminLayoutWrapper() {
  const [adminUser, setAdminUser] = useState(getAdminUser)

  useEffect(() => {
    const onStorage = () => setAdminUser(getAdminUser())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return <AdminLayout user={adminUser} onLogout={() => setAdminUser(null)} />
}

// Main site routes with Navbar
function MainSiteRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/browse"   element={<Browse />} />
        <Route path="/hostels/:id" element={<HostelDetail />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected owner routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/dashboard/add" element={
          <ProtectedRoute><AddHostel /></ProtectedRoute>
        } />
        <Route path="/dashboard/edit/:id" element={
          <ProtectedRoute><EditHostel /></ProtectedRoute>
        } />

        {/* Redirects */}
        <Route path="/home"    element={<Navigate to="/" replace />} />
        <Route path="/hostels" element={<Navigate to="/browse" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
