// AdminReviews.jsx — Reviews management page
// Features: rating filter, table with visual stars, truncated comments,
// delete with confirmation, pagination
import React, { useEffect, useState, useRef } from 'react'
import ConfirmModal from '../components/ConfirmModal'
import AdminLoader, { SkeletonRows, Pagination, StarDisplay } from '../components/AdminLoader'
import { ToastContainer, useToast } from '../components/Toast'
import api from '../../api/axios'
import '../admin.css'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '⭐⭐⭐⭐⭐ 5 Stars' },
  { value: '4', label: '⭐⭐⭐⭐ 4 Stars' },
  { value: '3', label: '⭐⭐⭐ 3 Stars' },
  { value: '2', label: '⭐⭐ 2 Stars' },
  { value: '1', label: '⭐ 1 Star' },
]

export default function AdminReviews() {
  const [reviews,     setReviews]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [totalPages,  setTotalPages]  = useState(1)
  const [ratingFilter, setRatingFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,    setDeleting]    = useState(false)
  const { toasts, showToast } = useToast()
  const PER_PAGE = 20

  useEffect(() => { document.title = 'Reviews — Nestora Admin' }, [])
  useEffect(() => { fetchReviews() }, [page, ratingFilter])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = { page, per_page: PER_PAGE }
      if (ratingFilter) {
        params.min_rating = ratingFilter
        params.max_rating = ratingFilter
      }
      const res   = await api.get('/api/admin/reviews', { params })
      const inner = res.data?.data || res.data || {}
      setReviews(inner.reviews || [])
      setTotal(inner.total || 0)
      setTotalPages(inner.pages || 1)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await api.delete(`/api/admin/reviews/${deleteTarget.review_id}`)
      showToast('Review deleted successfully.', 'success')
      setDeleteTarget(null)
      fetchReviews()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Rating summary pills
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(r => { if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++ })

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Review?"
        message={`Delete review by "${deleteTarget?.reviewer_name}" on "${deleteTarget?.hostel_name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <div className="admin-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="admin-section-title">⭐ All Reviews</div>
            <div className="admin-section-sub">{total.toLocaleString()} reviews on platform</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <select
            id="rating-filter"
            className="admin-filter-select"
            value={ratingFilter}
            onChange={e => { setRatingFilter(e.target.value); setPage(1) }}
          >
            {RATING_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Quick rating pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[5, 4, 3, 2, 1].map(r => (
              <button
                key={r}
                className="admin-page-btn"
                style={{
                  padding: '5px 12px', fontSize: '0.75rem',
                  background: ratingFilter === String(r) ? '#E85D26' : '#fff',
                  color: ratingFilter === String(r) ? '#fff' : '#374151',
                  borderColor: ratingFilter === String(r) ? '#E85D26' : '#E2E8F0',
                }}
                onClick={() => { setRatingFilter(ratingFilter === String(r) ? '' : String(r)); setPage(1) }}
              >
                {'⭐'.repeat(r)} {r}★
              </button>
            ))}
          </div>

          <button className="admin-btn outline" onClick={fetchReviews} style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>🔄 Refresh</button>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Hostel</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} rows={8} />
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">
                      <div className="admin-empty-icon">⭐</div>
                      <h3>No reviews found</h3>
                      <p>
                        {ratingFilter
                          ? `No ${ratingFilter}-star reviews found.`
                          : 'No reviews have been submitted yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review, idx) => (
                  <tr key={review.review_id}>
                    <td style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>
                    <td style={{ maxWidth: 160 }}>
                      <a
                        href={`/hostels/${review.hostel_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 700, color: '#E85D26', textDecoration: 'none', fontSize: '0.875rem' }}
                      >
                        {review.hostel_name}
                      </a>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        Hostel #{review.hostel_id}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: '#F1F5F9', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: 700, color: '#64748B', flexShrink: 0,
                        }}>
                          {(review.reviewer_name || '?')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {review.reviewer_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <StarDisplay rating={review.rating} />
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          {review.rating}/5
                        </span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      {review.comment ? (
                        <span
                          style={{ color: '#374151', fontSize: '0.85rem', cursor: 'help' }}
                          title={review.comment}
                        >
                          {review.comment.length > 60
                            ? review.comment.slice(0, 60) + '…'
                            : review.comment}
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.8rem' }}>
                          No comment
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {formatDate(review.created_at)}
                    </td>
                    <td>
                      <button
                        className="admin-action-btn delete"
                        onClick={() => setDeleteTarget(review)}
                        id={`delete-review-${review.review_id}`}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && reviews.length > 0 && (
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
