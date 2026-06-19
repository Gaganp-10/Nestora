// ImageManager.jsx — Owner image management component
// Props:
//   hostelId       (number, required)
//   onImagesChange (fn) — called whenever images are added/deleted

import React, { useState, useEffect, useCallback } from 'react'
import ImageUploader from './ImageUploader'
import api from '../api/axios'
import './ImageManager.css'

const BASE_URL    = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const MAX_IMAGES  = 10

function buildUrl(imageUrl) {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http')) return imageUrl
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${BASE_URL}${path}`
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ImageManager({ hostelId, onImagesChange }) {
  const [images,       setImages]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [actionId,     setActionId]     = useState(null)   // image_id being actioned
  const [deleteTarget, setDeleteTarget] = useState(null)   // image to delete
  const [deleting,     setDeleting]     = useState(false)
  const [error,        setError]        = useState('')

  const fetchImages = useCallback(async () => {
    if (!hostelId) return
    try {
      setLoading(true)
      const res    = await api.get(`/api/hostels/${hostelId}`)
      const inner  = res.data?.data || res.data || {}
      const hostel = inner.hostel || inner
      setImages(hostel.images || [])
    } catch (err) {
      setError(err.message || 'Failed to load images.')
    } finally {
      setLoading(false)
    }
  }, [hostelId])

  useEffect(() => { fetchImages() }, [fetchImages])

  const handleSetPrimary = async (img) => {
    if (img.is_primary) return
    try {
      setActionId(img.image_id)
      await api.put(`/api/images/${img.image_id}/primary`)
      // Optimistically update state
      setImages(prev => prev.map(i => ({ ...i, is_primary: i.image_id === img.image_id })))
      onImagesChange?.()
    } catch (err) {
      setError(err.message || 'Failed to set primary image.')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await api.delete(`/api/images/${deleteTarget.image_id}`)
      // Optimistically remove from list; if deleted was primary, promote first remaining
      setImages(prev => {
        const remaining = prev.filter(i => i.image_id !== deleteTarget.image_id)
        if (deleteTarget.is_primary && remaining.length > 0) {
          remaining[0] = { ...remaining[0], is_primary: true }
        }
        return remaining
      })
      setDeleteTarget(null)
      onImagesChange?.()
    } catch (err) {
      setError(err.message || 'Failed to delete image.')
    } finally {
      setDeleting(false)
    }
  }

  const handleUploadComplete = () => {
    fetchImages()
    onImagesChange?.()
  }

  const count      = images.length
  const isFull     = count >= MAX_IMAGES
  const fillWidth  = Math.min((count / MAX_IMAGES) * 100, 100)

  return (
    <div className="img-manager">
      {/* Count Progress Bar */}
      <div className="img-manager-count-row">
        <div className="img-manager-count-label">
          <strong>{count}</strong> / {MAX_IMAGES} images uploaded
        </div>
        <div className="img-manager-count-bar">
          <div
            className={`img-manager-count-fill ${isFull ? 'full' : ''}`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FFF5F5', border: '1.5px solid #FECACA',
          borderRadius: 8, padding: '10px 14px',
          fontSize: '0.85rem', color: '#DC2626', fontWeight: 600,
        }}>
          ⚠️ {error}
          <button
            onClick={() => setError('')}
            style={{ marginLeft: 10, fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >Dismiss</button>
        </div>
      )}

      {/* ── Current images grid ── */}
      {loading ? (
        <div className="img-manager-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="img-manager-skeleton" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="img-manager-empty">
          <div className="img-manager-empty-icon">📷</div>
          <h4>No images uploaded yet</h4>
          <p>Use the uploader below to add photos of your hostel.</p>
        </div>
      ) : (
        <div className="img-manager-grid">
          {images.map(img => {
            const url = buildUrl(img.image_url)
            const isBusy = actionId === img.image_id
            return (
              <div
                key={img.image_id}
                className={`img-manager-card ${img.is_primary ? 'is-primary' : ''}`}
              >
                {/* Spinner overlay during action */}
                {isBusy && (
                  <div className="img-manager-card-spinner">
                    <div className="img-manager-card-spinner-icon" />
                  </div>
                )}

                {/* Primary badge */}
                {img.is_primary && (
                  <div className="img-manager-primary-badge">⭐ Primary</div>
                )}

                {/* Image */}
                <img
                  src={url}
                  alt={`Hostel image ${img.image_id}`}
                  className="img-manager-card-img"
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement.querySelector('.img-manager-overlay').style.opacity = '1'
                  }}
                />

                {/* Hover overlay */}
                <div className="img-manager-overlay">
                  {!img.is_primary && (
                    <button
                      className="img-manager-overlay-btn primary-btn"
                      onClick={() => handleSetPrimary(img)}
                      disabled={isBusy}
                      id={`set-primary-${img.image_id}`}
                    >
                      ⭐ Set as Primary
                    </button>
                  )}
                  <button
                    className="img-manager-overlay-btn delete-btn"
                    onClick={() => setDeleteTarget(img)}
                    disabled={isBusy}
                    id={`delete-img-${img.image_id}`}
                  >
                    🗑️ Delete
                  </button>
                </div>

                {/* Upload date */}
                <div className="img-manager-date">
                  {fmtDate(img.uploaded_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Upload section ── */}
      <div className="img-manager-upload-section">
        <div className="img-manager-upload-title">
          📤 Upload New Images
        </div>
        {isFull ? (
          <div className="img-manager-upload-disabled">
            🏁 Maximum {MAX_IMAGES} images reached. Delete an image to upload more.
          </div>
        ) : (
          <ImageUploader
            hostelId={hostelId}
            onUploadComplete={handleUploadComplete}
            existingCount={count}
            disabled={isFull}
          />
        )}
      </div>

      {/* ── Delete Confirm Dialog ── */}
      {deleteTarget && (
        <div
          className="img-manager-confirm-overlay"
          onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="img-manager-confirm" role="dialog" aria-modal="true">
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗑️</div>
            <h3>Delete Image?</h3>
            <p>
              This will permanently remove the photo.{' '}
              {deleteTarget.is_primary && (
                <strong>The next image will automatically become the primary photo.</strong>
              )}
            </p>
            <div className="img-manager-confirm-actions">
              <button
                className="img-manager-btn outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >Cancel</button>
              <button
                className="img-manager-btn danger"
                onClick={handleDelete}
                disabled={deleting}
                id="confirm-img-delete"
              >
                {deleting ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
