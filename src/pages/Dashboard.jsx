// FIXED: Dashboard.jsx
// KEY BUGS FIXED:
// 1. Endpoint confirmed as GET /api/hostels/my (correct)
// 2. Response shape: { success, message, data: { hostels, total, pages } }
//    — must extract from res.data.data.hostels
// 3. Hostel model uses hostel_id (not id) and hostel_name (not name)
//    — all references updated with safe fallbacks
// 4. Mobile card grid shown via state, not CSS override

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import Footer from '../components/Footer'
import api from '../api/axios'
import { getGenderLabel, getGenderBadgeClass, getImageUrl } from '../utils/helpers'
import '../styles/Dashboard.css'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [hostels,     setHostels]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,    setDeleting]    = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Backend user object uses 'name' field
  const ownerName = user?.name || user?.full_name || 'Owner'

  useEffect(() => {
    document.title = 'Dashboard — Nestora'
    fetchMyHostels()
  }, [])

  const fetchMyHostels = async () => {
    try {
      setLoading(true)
      setError(null)
      // FIXED: endpoint is /api/hostels/my — token attached by interceptor
      const res = await api.get('/api/hostels/my')
      // FIXED: backend wraps in nested data object
      // Shape: { success, message, data: { hostels, total, page, pages } }
      const inner = res.data?.data || res.data || {}
      const list  = inner.hostels || inner.data || []
      setHostels(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Dashboard fetch error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      // FIXED: use hostel_id (backend primary key)
      await api.delete(`/api/hostels/${deleteTarget.hostel_id || deleteTarget.id}`)
      setHostels(prev => prev.filter(h => (h.hostel_id || h.id) !== (deleteTarget.hostel_id || deleteTarget.id)))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  // Stats computed from hostel list
  const totalRooms    = hostels.reduce((sum, h) => sum + (h.rooms?.length || 0), 0)
  const totalReviews  = hostels.reduce((sum, h) => sum + (h.review_count || 0), 0)
  const activeListings = hostels.filter(h => h.is_active !== false).length

  const STATS = [
    { icon: '🏠', label: 'Total Listings',   value: hostels.length, colorClass: 'orange' },
    { icon: '🛏️', label: 'Total Rooms',      value: totalRooms,    colorClass: 'blue'   },
    { icon: '⭐', label: 'Total Reviews',    value: totalReviews,  colorClass: 'purple' },
    { icon: '✅', label: 'Active Listings',  value: activeListings, colorClass: 'green' },
  ]

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-welcome">
            <div className="dashboard-welcome-tag">👋 Welcome back</div>
            <h1>Hello, <span>{ownerName}</span></h1>
          </div>
          <Link to="/dashboard/add" id="add-hostel-btn" className="btn btn-primary btn-lg">
            ➕ Add New Hostel
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stats-grid">
          {STATS.map(stat => (
            <div className="dashboard-stat-card" key={stat.label}>
              <div className={`dashboard-stat-icon ${stat.colorClass}`}>{stat.icon}</div>
              <div>
                <div className="dashboard-stat-value">{stat.value}</div>
                <div className="dashboard-stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">🏠 My Listings</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={fetchMyHostels}>🔄 Refresh</button>
              <Link to="/dashboard/add" className="btn btn-primary btn-sm">➕ Add New</Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ margin: '16px 20px' }}>
              ⚠️ {error}
              <button className="btn btn-sm btn-outline" onClick={fetchMyHostels} style={{ marginLeft: 10 }}>
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <Loader text="Loading your listings..." />
          ) : hostels.length === 0 ? (
            <div className="dashboard-empty">
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏠</div>
              <h3>No listings yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                Start earning by listing your PG or hostel on Nestora today!
              </p>
              <Link to="/dashboard/add" className="btn btn-primary">➕ Add Your First Hostel</Link>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="dashboard-table-wrap">
                <table className="dashboard-table" aria-label="My hostels">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>#</th>
                      <th>Hostel Name</th>
                      <th>Location</th>
                      <th>Gender</th>
                      <th>Rooms</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostels.map((hostel, idx) => {
                      const hId      = hostel.hostel_id || hostel.id
                      const hName    = hostel.hostel_name || hostel.name || '—'
                      const priImg   = hostel.images?.find(i => i.is_primary) || hostel.images?.[0]
                      const thumbUrl = priImg ? getImageUrl(priImg.image_url) : null
                      return (
                        <tr key={hId}>
                          {/* Thumbnail */}
                          <td>
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={hName}
                                style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', display: 'block', border: '2px solid #E2E8F0' }}
                                loading="lazy"
                                onError={e => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : (
                              <div style={{ width: 50, height: 50, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', border: '2px solid #E2E8F0' }}>🏠</div>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{idx + 1}</td>
                          <td>
                            <div className="dashboard-table-name">{hName}</div>
                            {hostel.avg_rating > 0 && (
                              <div className="dashboard-table-sub">
                                ⭐ {hostel.avg_rating?.toFixed(1)} ({hostel.review_count || 0} reviews)
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{hostel.city}</div>
                            {hostel.area && <div className="dashboard-table-sub">{hostel.area}</div>}
                          </td>
                          <td>
                            <span className={`badge ${getGenderBadgeClass(hostel.gender)}`}>
                              {getGenderLabel(hostel.gender)}
                            </span>
                          </td>
                          <td>{hostel.rooms?.length || 0} room{hostel.rooms?.length !== 1 ? 's' : ''}</td>
                          <td>
                            <span className={`badge ${hostel.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
                              {hostel.is_active !== false ? '✅ Active' : '⏸️ Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="dashboard-actions">
                              <Link to={`/hostels/${hId}`} className="dashboard-action-btn view">
                                👁️ View
                              </Link>
                              <Link to={`/dashboard/edit/${hId}`} className="dashboard-action-btn edit">
                                ✏️ Edit
                              </Link>
                              <button className="dashboard-action-btn delete"
                                onClick={() => setDeleteTarget(hostel)}>
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Grid */}
              <div className="dashboard-cards-grid">
                {hostels.map(hostel => {
                  const hId   = hostel.hostel_id || hostel.id
                  const hName = hostel.hostel_name || hostel.name || '—'
                  return (
                    <div className="dashboard-listing-card" key={hId}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                        {/* Thumbnail */}
                        {(() => {
                          const primaryImg = hostel.images?.find(i => i.is_primary) || hostel.images?.[0]
                          const thumbUrl   = primaryImg ? getImageUrl(primaryImg.image_url) : null
                          return thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={hName}
                              style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '2px solid #E2E8F0' }}
                              loading="lazy"
                              onError={e => { e.currentTarget.style.display = 'none' }}
                            />
                          ) : (
                            <div style={{ width: 56, height: 56, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🏠</div>
                          )
                        })()}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            📍 {hostel.area ? `${hostel.area}, ` : ''}{hostel.city}
                          </div>
                          <span className={`badge ${hostel.is_active !== false ? 'badge-active' : 'badge-inactive'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                            {hostel.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="dashboard-actions" style={{ flexWrap: 'wrap' }}>
                        <Link to={`/hostels/${hId}`} className="dashboard-action-btn view">👁️ View</Link>
                        <Link to={`/dashboard/edit/${hId}`} className="dashboard-action-btn edit">✏️ Edit</Link>
                        <button className="dashboard-action-btn delete"
                          onClick={() => setDeleteTarget(hostel)}>🗑️ Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <span className="confirm-dialog-icon">🗑️</span>
            <h3>Delete Listing?</h3>
            <p>
              Are you sure you want to delete{' '}
              <strong>"{deleteTarget.hostel_name || deleteTarget.name}"</strong>?
              This cannot be undone.
            </p>
            {deleteError && <div className="alert alert-error">{deleteError}</div>}
            <div className="confirm-dialog-actions">
              <button className="btn btn-outline"
                onClick={() => { setDeleteTarget(null); setDeleteError('') }}
                disabled={deleting}>Cancel</button>
              <button id="confirm-delete-btn" className="btn btn-danger"
                onClick={handleDelete} disabled={deleting}>
                {deleting ? '⏳ Deleting...' : '🗑️ Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Dashboard
