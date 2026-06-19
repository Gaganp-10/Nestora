// AdminHostels.jsx — Full hostels management page
// Features: search (debounced), status filter, city filter,
// toggle active status, delete with confirmation, view in new tab
import React, { useEffect, useState, useRef, useCallback } from 'react'
import ConfirmModal from '../components/ConfirmModal'
import AdminLoader, { SkeletonRows, Pagination } from '../components/AdminLoader'
import { ToastContainer, useToast } from '../components/Toast'
import api from '../../api/axios'
import '../admin.css'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const BASE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000'

export default function AdminHostels() {
  const [hostels,     setHostels]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [totalPages,  setTotalPages]  = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter,  setCityFilter]  = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,    setDeleting]    = useState(false)
  const { toasts, showToast } = useToast()
  const PER_PAGE = 20
  const debounceTimer = useRef(null)

  useEffect(() => { document.title = 'Hostels — Nestora Admin' }, [])

  useEffect(() => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(debounceTimer.current)
  }, [searchInput])

  useEffect(() => { fetchHostels() }, [page, search, statusFilter, cityFilter])

  const fetchHostels = async () => {
    try {
      setLoading(true)
      const params = { page, per_page: PER_PAGE }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      if (cityFilter)   params.city   = cityFilter
      const res   = await api.get('/api/admin/hostels', { params })
      const inner = res.data?.data || res.data || {}
      setHostels(inner.hostels || [])
      setTotal(inner.total || 0)
      setTotalPages(inner.pages || 1)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (hostel) => {
    try {
      await api.put(`/api/admin/hostels/${hostel.hostel_id}/toggle-status`)
      const newStatus = !hostel.is_active
      showToast(`"${hostel.hostel_name}" ${newStatus ? 'activated' : 'deactivated'}.`, 'success')
      fetchHostels()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await api.delete(`/api/admin/hostels/${deleteTarget.hostel_id}`)
      showToast(`"${deleteTarget.hostel_name}" deleted.`, 'success')
      setDeleteTarget(null)
      fetchHostels()
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
        title="Delete Hostel?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.hostel_name}"? All rooms, images, and reviews will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <div className="admin-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="admin-section-title">🏨 All Hostels</div>
            <div className="admin-section-sub">{total.toLocaleString()} listings on platform</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <span className="admin-search-icon">🔍</span>
            <input
              id="hostel-search"
              type="search"
              className="admin-search-input"
              placeholder="Search by name, city, or area..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <select
            id="status-filter"
            className="admin-filter-select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Statuses</option>
            <option value="active">✅ Active</option>
            <option value="inactive">❌ Inactive</option>
          </select>
          <input
            id="city-filter"
            type="text"
            className="admin-search-input"
            style={{ maxWidth: 160, flex: 'none' }}
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={e => { setCityFilter(e.target.value); setPage(1) }}
          />
          <button className="admin-btn outline" onClick={fetchHostels} style={{ whiteSpace: 'nowrap' }}>🔄</button>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Hostel Name</th>
                <th>Owner</th>
                <th>City</th>
                <th>Area</th>
                <th>Rooms</th>
                <th>Reviews</th>
                <th>Status</th>
                <th>Listed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={10} rows={8} />
              ) : hostels.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="admin-empty">
                      <div className="admin-empty-icon">🏨</div>
                      <h3>No hostels found</h3>
                      <p>Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                hostels.map((hostel, idx) => (
                  <tr key={hostel.hostel_id}>
                    <td style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.3 }}>
                        {hostel.hostel_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>
                        #{hostel.hostel_id} ·{' '}
                        {hostel.gender === 'male' ? '👨 Boys' : hostel.gender === 'female' ? '👩 Girls' : '👫 Co-ed'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{hostel.owner_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{hostel.owner_email}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{hostel.city}</td>
                    <td style={{ color: '#64748B' }}>{hostel.area}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {(hostel.room_count ?? 0)}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {(hostel.review_count ?? 0)}
                    </td>
                    <td>
                      <span className={`admin-badge ${hostel.is_active ? 'active' : 'inactive'}`}>
                        {hostel.is_active ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {formatDate(hostel.created_at)}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <a
                          href={`/hostels/${hostel.hostel_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-action-btn view"
                          id={`view-hostel-${hostel.hostel_id}`}
                        >👁️</a>
                        <button
                          className={`admin-action-btn ${hostel.is_active ? 'toggle' : 'green'}`}
                          onClick={() => handleToggle(hostel)}
                          id={`toggle-hostel-${hostel.hostel_id}`}
                          title={hostel.is_active ? 'Deactivate' : 'Activate'}
                        >{hostel.is_active ? '⏸️' : '▶️'}</button>
                        <button
                          className="admin-action-btn delete"
                          onClick={() => setDeleteTarget(hostel)}
                          id={`delete-hostel-${hostel.hostel_id}`}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && hostels.length > 0 && (
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
