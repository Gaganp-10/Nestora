// AdminLoader.jsx — Loading spinner for admin panel
import React from 'react'

function AdminLoader({ text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', gap: '16px',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #E2E8F0',
        borderTopColor: '#E85D26',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: 500 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Skeleton rows for tables
export function SkeletonRows({ cols = 6, rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="admin-skeleton-row">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j}>
          <div className="admin-skeleton-cell" style={{ width: j === 0 ? '30px' : '80%' }} />
        </td>
      ))}
    </tr>
  ))
}

// Inline stars display
export function StarDisplay({ rating }) {
  return (
    <div className="admin-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'admin-star-filled' : 'admin-star-empty'}>★</span>
      ))}
    </div>
  )
}

// Pagination bar
export function Pagination({ page, totalPages, total, perPage, onPageChange }) {
  if (totalPages <= 1) return null
  const from = (page - 1) * perPage + 1
  const to   = Math.min(page * perPage, total)

  const pages = []
  const start = Math.max(1, page - 2)
  const end   = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="admin-pagination">
      <div className="admin-pagination-info">
        Showing <strong>{from.toLocaleString()}</strong>–<strong>{to.toLocaleString()}</strong> of{' '}
        <strong>{total.toLocaleString()}</strong>
      </div>
      <div className="admin-pagination-btns">
        <button className="admin-page-btn" onClick={() => onPageChange(page - 1)}
          disabled={page === 1}>‹ Prev</button>
        {start > 1 && (
          <>
            <button className="admin-page-btn" onClick={() => onPageChange(1)}>1</button>
            {start > 2 && <span style={{ padding: '0 4px', color: '#94A3B8' }}>…</span>}
          </>
        )}
        {pages.map(p => (
          <button key={p} className={`admin-page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}>{p}</button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={{ padding: '0 4px', color: '#94A3B8' }}>…</span>}
            <button className="admin-page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          </>
        )}
        <button className="admin-page-btn" onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}>Next ›</button>
      </div>
    </div>
  )
}

export default AdminLoader
