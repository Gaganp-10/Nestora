// ImageUploader.jsx — Drag-and-drop image upload component
// Props:
//   hostelId       (number, required) — hostel to upload to
//   onUploadComplete (fn) — called after successful upload
//   existingCount  (number) — how many images already uploaded
//   disabled       (bool)  — disable the uploader

import React, { useRef, useState, useCallback } from 'react'
import api from '../api/axios'
import './ImageUploader.css'

const MAX_FILES       = 10
const MAX_SIZE_BYTES  = 5 * 1024 * 1024   // 5 MB
const ALLOWED_TYPES   = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTS    = /\.(jpg|jpeg|png|webp)$/i

function fmtBytes(b) {
  if (b < 1024)       return `${b} B`
  if (b < 1024*1024)  return `${(b/1024).toFixed(1)} KB`
  return `${(b/(1024*1024)).toFixed(1)} MB`
}

export default function ImageUploader({
  hostelId,
  onUploadComplete,
  existingCount = 0,
  disabled = false,
}) {
  const inputRef = useRef(null)
  const [files,      setFiles]      = useState([])      // File objects
  const [previews,   setPreviews]   = useState([])      // ObjectURLs
  const [dragOver,   setDragOver]   = useState(false)
  const [errors,     setErrors]     = useState([])
  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState([])      // per-file {name, pct, status}
  const [successMsg, setSuccessMsg] = useState('')

  const slotsLeft = MAX_FILES - existingCount

  // ── Validate + add files ─────────────────────────────────
  const addFiles = useCallback((rawFiles) => {
    const newErrors = []
    const valid     = []

    Array.from(rawFiles).forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.test(file.name)) {
        newErrors.push(`"${file.name}" — only JPG, PNG, WebP allowed.`)
        return
      }
      if (file.size > MAX_SIZE_BYTES) {
        newErrors.push(`"${file.name}" — exceeds 5 MB limit (${fmtBytes(file.size)}).`)
        return
      }
      valid.push(file)
    })

    setErrors(newErrors)

    setFiles(prev => {
      const combined = [...prev, ...valid]
      if (combined.length + existingCount > MAX_FILES) {
        newErrors.push(`Maximum ${MAX_FILES} images per hostel.`)
        setErrors([...newErrors])
        return prev.slice(0, slotsLeft)
      }
      const capped = combined.slice(0, slotsLeft)
      // Generate preview URLs for new files
      setPreviews(capped.map(f => URL.createObjectURL(f)))
      return capped
    })
  }, [existingCount, slotsLeft])

  // ── Remove single preview ────────────────────────────────
  const removeFile = (idx) => {
    setFiles(prev => { const n = [...prev]; n.splice(idx, 1); return n })
    setPreviews(prev => { const n = [...prev]; URL.revokeObjectURL(n[idx]); n.splice(idx, 1); return n })
  }

  // ── Clear all ────────────────────────────────────────────
  const clearAll = () => {
    previews.forEach(URL.revokeObjectURL)
    setFiles([])
    setPreviews([])
    setErrors([])
    setProgress([])
    setSuccessMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Upload ───────────────────────────────────────────────
  const handleUpload = async () => {
    if (!files.length || uploading || !hostelId) return

    setUploading(true)
    setSuccessMsg('')
    setProgress(files.map(f => ({ name: f.name, pct: 0, status: 'uploading' })))

    // Simulate per-file progress by uploading all at once with XHR progress
    const formData = new FormData()
    files.forEach(f => formData.append('images', f))

    try {
      // Use XMLHttpRequest for real progress tracking
      const token = localStorage.getItem('nestora_token')
      const BASE   = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${BASE}/api/images/hostel/${hostelId}`)
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setProgress(prev => prev.map(p => ({ ...p, pct, status: pct < 100 ? 'uploading' : 'processing' })))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(prev => prev.map(p => ({ ...p, pct: 100, status: 'done' })))
            resolve(xhr.responseText)
          } else {
            let msg = 'Upload failed.'
            try { msg = JSON.parse(xhr.responseText)?.message || msg } catch {}
            reject(new Error(msg))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error during upload.')))
        xhr.send(formData)
      })

      const count = files.length
      setSuccessMsg(`✅ ${count} image${count > 1 ? 's' : ''} uploaded successfully!`)
      clearAll()
      onUploadComplete?.()
    } catch (err) {
      setProgress(prev => prev.map(p => ({ ...p, status: 'error' })))
      setErrors([err.message])
    } finally {
      setUploading(false)
    }
  }

  // ── Drag handlers ────────────────────────────────────────
  const onDragOver  = e => { e.preventDefault(); if (!disabled) setDragOver(true) }
  const onDragLeave = () => setDragOver(false)
  const onDrop      = e => { e.preventDefault(); setDragOver(false); if (!disabled) addFiles(e.dataTransfer.files) }
  const onZoneClick = () => { if (!disabled && !uploading) inputRef.current?.click() }

  const totalCount = existingCount + files.length

  return (
    <div className="img-uploader">
      {/* Count indicator */}
      <div className="img-uploader-count">
        <strong>{totalCount}</strong> / {MAX_FILES} images used
      </div>

      {/* Drop Zone */}
      {!uploading && (
        <div
          className={`img-uploader-zone ${dragOver ? 'dragover' : ''} ${disabled ? 'disabled' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onZoneClick}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={e => e.key === 'Enter' && onZoneClick()}
          aria-label="Upload images by clicking or dragging"
        >
          <div className="img-uploader-icon">📸</div>
          <div className="img-uploader-title">
            <span>Click to browse</span> or drag & drop images here
          </div>
          <div className="img-uploader-sub">
            JPG, PNG, WebP · max 5 MB each · up to {slotsLeft} more
          </div>
          {/* Hidden native file input */}
          <input
            ref={inputRef}
            type="file"
            id="img-upload-input"
            multiple
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
            disabled={disabled}
          />
        </div>
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="img-uploader-errors">
          {errors.map((e, i) => (
            <div className="img-uploader-error-item" key={i}>⚠️ {e}</div>
          ))}
        </div>
      )}

      {/* Success message */}
      {successMsg && (
        <div className="img-uploader-success">
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload progress */}
      {uploading && progress.length > 0 && (
        <div className="img-uploader-progress-wrap">
          {progress.map((p, i) => (
            <div className="img-uploader-progress-item" key={i}>
              <div className="img-uploader-progress-label">
                <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.status === 'done'  ? '✅' :
                   p.status === 'error' ? '❌' : '⏳'} {p.name}
                </span>
                <span>{p.status === 'done' ? 'Done!' : p.status === 'error' ? 'Failed' : `${p.pct}%`}</span>
              </div>
              <div className="img-uploader-progress-bar">
                <div
                  className={`img-uploader-progress-fill ${p.status}`}
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview grid */}
      {!uploading && files.length > 0 && (
        <>
          <div className="img-uploader-preview-header">
            <span>{files.length} file{files.length > 1 ? 's' : ''} selected</span>
            <button className="img-uploader-clear-btn" onClick={clearAll}>✕ Clear All</button>
          </div>

          <div className="img-uploader-grid">
            {previews.map((src, idx) => (
              <div className="img-uploader-thumb" key={idx}>
                <img src={src} alt={`Preview ${idx + 1}`} loading="lazy" />
                <div className="img-uploader-thumb-info">
                  <div className="img-uploader-thumb-name">{files[idx]?.name}</div>
                  <div className="img-uploader-thumb-size">{fmtBytes(files[idx]?.size)}</div>
                </div>
                <button
                  className="img-uploader-thumb-remove"
                  onClick={e => { e.stopPropagation(); removeFile(idx) }}
                  aria-label={`Remove ${files[idx]?.name}`}
                >✕</button>
              </div>
            ))}
          </div>

          <div className="img-uploader-actions">
            <button
              id={`upload-btn-${hostelId}`}
              className="img-uploader-submit"
              onClick={handleUpload}
              disabled={uploading || !hostelId}
            >
              📤 Upload {files.length} Image{files.length > 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
