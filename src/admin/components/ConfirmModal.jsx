// ConfirmModal.jsx — Delete confirmation overlay
// Press Escape to close
import React, { useEffect } from 'react'

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, loading }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="admin-modal-icon">🗑️</div>
        <h3 id="confirm-title">{title || 'Are you sure?'}</h3>
        <p>{message || 'This action cannot be undone.'}</p>
        <div className="admin-modal-actions">
          <button
            className="admin-btn outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            className="admin-btn danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '⏳ Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
