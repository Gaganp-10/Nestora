// AdminDashboard.jsx — Stats overview page
import React, { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import AdminLoader, { StarDisplay } from '../components/AdminLoader'
import { ToastContainer, useToast } from '../components/Toast'
import api from '../../api/axios'
import '../admin.css'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const { toasts, showToast } = useToast()

  useEffect(() => {
    document.title = 'Dashboard — Nestora Admin'
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/api/admin/stats')
      setStats(res.data?.data || res.data)
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <AdminLoader text="Loading dashboard stats..." />

  if (error) return (
    <div className="admin-card" style={{ padding: 32, textAlign: 'center', color: '#EF4444' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
      <div style={{ fontWeight: 700 }}>{error}</div>
      <button className="admin-btn primary" style={{ marginTop: 16 }} onClick={fetchStats}>Retry</button>
    </div>
  )

  const s = stats || {}

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Welcome header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>
          📊 Platform Overview
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Live statistics for Nestora PG & Hostel Finder
        </p>
      </div>

      {/* Row 1 — Main stats */}
      <div className="stat-cards-grid">
        <StatCard icon="👥" label="Total Users"    value={s.total_users}   color="blue"
          trend={{ dir: 'up', text: `+${s.new_users_this_month} this month` }} />
        <StatCard icon="🏨" label="Total Hostels"  value={s.total_hostels} color="green"
          trend={{ dir: 'up', text: `+${s.new_hostels_this_month} this month` }} />
        <StatCard icon="⭐" label="Total Reviews"  value={s.total_reviews} color="orange" />
        <StatCard icon="🛏️" label="Available Beds" value={s.total_available_beds} color="purple" />
      </div>

      {/* Row 2 — Secondary stats */}
      <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="✅" label="Active Hostels"   value={s.active_hostels}  color="teal" />
        <StatCard icon="🏙️" label="Cities Covered"   value={s.cities_covered} color="indigo" />
        <StatCard icon="⭐" label="Avg. Rating"       value={s.average_rating?.toFixed(1)} color="yellow" />
        <StatCard icon="🏠" label="Total Owners"      value={s.total_owners}    color="green" />
      </div>

      {/* Row 3 — Recent Hostels + Recent Users */}
      <div className="admin-two-col">
        {/* Recent Hostels */}
        <div className="admin-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <div className="admin-section-title">🏨 Recent Hostels</div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(s.recent_hostels || []).length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No hostels yet</td></tr>
                ) : (
                  (s.recent_hostels || []).map(h => (
                    <tr key={h.hostel_id}>
                      <td style={{ fontWeight: 600, color: '#1E293B', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.hostel_name}</td>
                      <td>{h.city}</td>
                      <td style={{ color: '#64748B' }}>{h.owner_name}</td>
                      <td>
                        <span className={`admin-badge ${h.is_active ? 'active' : 'inactive'}`}>
                          {h.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div className="admin-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <div className="admin-section-title">👥 Recent Users</div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(s.recent_users || []).length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No users yet</td></tr>
                ) : (
                  (s.recent_users || []).map(u => (
                    <tr key={u.user_id}>
                      <td style={{ fontWeight: 600, color: '#1E293B' }}>{u.name}</td>
                      <td style={{ color: '#64748B', fontSize: '0.8rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                      <td>
                        <span className={`admin-badge ${u.role === 'admin' ? 'admin-role' : 'owner'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.8rem' }}>{formatDate(u.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4 — Recent Reviews */}
      <div className="admin-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div className="admin-section-title">⭐ Recent Reviews</div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hostel</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(s.recent_reviews || []).length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No reviews yet</td></tr>
              ) : (
                (s.recent_reviews || []).map(r => (
                  <tr key={r.review_id}>
                    <td style={{ fontWeight: 600, color: '#1E293B' }}>{r.hostel_name}</td>
                    <td>{r.reviewer_name}</td>
                    <td><StarDisplay rating={r.rating} /></td>
                    <td style={{ color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.comment ? (r.comment.length > 50 ? r.comment.slice(0, 50) + '…' : r.comment) : '—'}
                    </td>
                    <td style={{ color: '#94A3B8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
