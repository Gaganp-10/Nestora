// AdminUsers.jsx — Full users management page
// Features: search (debounced), role filter, table with pagination,
// view detail modal, toggle status, delete with confirmation
import React, { useEffect, useState, useCallback, useRef } from 'react'
import ConfirmModal from '../components/ConfirmModal'
import AdminLoader, { SkeletonRows, Pagination } from '../components/AdminLoader'
import { ToastContainer, useToast } from '../components/Toast'
import api from '../../api/axios'
import '../admin.css'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function UserDetailModal({ user, onClose }) {
  if (!user) return null
  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal admin-detail-modal" style={{ textAlign: 'left', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #E85D26, #c94a1e)',
              color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800,
            }}>
              {(user.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1E293B' }}>{user.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94A3B8',
          }}>✕</button>
        </div>
        {[
          ['User ID', `#${user.user_id}`],
          ['Role', <span className={`admin-badge ${user.role === 'admin' ? 'admin-role' : 'owner'}`}>{user.role}</span>],
          ['Phone', user.phone || '—'],
          ['Joined', formatDate(user.created_at)],
          ['Hostels Listed', (user.hostel_count ?? user.hostels?.length ?? 0).toString()],
        ].map(([label, val]) => (
          <div className="admin-detail-row" key={label}>
            <span className="admin-detail-label">{label}</span>
            <span className="admin-detail-value">{val}</span>
          </div>
        ))}
        {user.hostels?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: 10 }}>
              🏠 Hostels ({user.hostels.length})
            </div>
            {user.hostels.map(h => (
              <div key={h.hostel_id} style={{
                padding: '8px 12px', background: '#F8FAFC',
                borderRadius: 8, marginBottom: 6, fontSize: '0.8rem',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: 600 }}>{h.hostel_name}</span>
                <span style={{ color: '#64748B' }}>{h.city}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button className="admin-btn outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [totalPages,  setTotalPages]  = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search,      setSearch]      = useState('')
  const [roleFilter,  setRoleFilter]  = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,    setDeleting]    = useState(false)
  const [viewUser,    setViewUser]    = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const { toasts, showToast } = useToast()
  const PER_PAGE = 20
  const debounceTimer = useRef(null)

  useEffect(() => { document.title = 'Users — Nestora Admin' }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(debounceTimer.current)
  }, [searchInput])

  useEffect(() => { fetchUsers() }, [page, search, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = { page, per_page: PER_PAGE }
      if (search)     params.search = search
      if (roleFilter) params.role   = roleFilter
      const res   = await api.get('/api/admin/users', { params })
      const inner = res.data?.data || res.data || {}
      setUsers(inner.users || [])
      setTotal(inner.total || 0)
      setTotalPages(inner.pages || 1)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = async (user) => {
    try {
      setViewLoading(true)
      const res  = await api.get(`/api/admin/users/${user.user_id}`)
      const data = res.data?.data?.user || user
      setViewUser(data)
    } catch {
      setViewUser(user)
    } finally {
      setViewLoading(false)
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      await api.put(`/api/admin/users/${user.user_id}/toggle-status`)
      showToast(`User "${user.name}" status updated.`, 'success')
      fetchUsers()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await api.delete(`/api/admin/users/${deleteTarget.user_id}`)
      showToast(`User "${deleteTarget.name}" deleted.`, 'success')
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete User?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All their hostels, rooms, and images will also be permanently deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      {viewUser && <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />}

      {/* Toolbar */}
      <div className="admin-card" style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="admin-section-title">👥 All Users</div>
            <div className="admin-section-sub">{total.toLocaleString()} users registered</div>
          </div>
        </div>

        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <span className="admin-search-icon">🔍</span>
            <input
              id="user-search"
              type="search"
              className="admin-search-input"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <select
            id="role-filter"
            className="admin-filter-select"
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
          <button className="admin-btn outline" onClick={fetchUsers} style={{ whiteSpace: 'nowrap' }}>🔄 Refresh</button>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Hostels</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={8} rows={8} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">
                      <div className="admin-empty-icon">👥</div>
                      <h3>No users found</h3>
                      <p>Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.user_id}>
                    <td style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #E85D26, #c94a1e)',
                          color: '#fff', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {(user.name || 'U')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: '#1E293B' }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748B', fontSize: '0.82rem' }}>{user.email}</td>
                    <td style={{ color: '#64748B' }}>{user.phone || '—'}</td>
                    <td>
                      <span className={`admin-badge ${user.role === 'admin' ? 'admin-role' : 'owner'}`}>
                        {user.role === 'admin' ? '🔑 Admin' : '🏠 Owner'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, textAlign: 'center' }}>
                      {(user.hostel_count ?? 0).toLocaleString()}
                    </td>
                    <td style={{ color: '#94A3B8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn view"
                          onClick={() => handleViewUser(user)}
                          id={`view-user-${user.user_id}`}
                        >👁️ View</button>
                        {user.role !== 'admin' && (
                          <>
                            <button
                              className="admin-action-btn toggle"
                              onClick={() => handleToggleStatus(user)}
                              id={`toggle-user-${user.user_id}`}
                            >🔄</button>
                            <button
                              className="admin-action-btn delete"
                              onClick={() => setDeleteTarget(user)}
                              id={`delete-user-${user.user_id}`}
                            >🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={PER_PAGE}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
