// ImageGallery.jsx — Full-featured image gallery
// Props:
//   images     (array) — [{image_id, image_url, is_primary}]
//   hostelName (string) — for alt text

import React, { useState, useEffect, useCallback, useRef } from 'react'
import './ImageGallery.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function buildUrl(imageUrl) {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http')) return imageUrl
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${BASE_URL}${path}`
}

export default function ImageGallery({ images = [], hostelName = 'Hostel' }) {
  const [active,     setActive]     = useState(0)
  const [fading,     setFading]     = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fsActive,   setFsActive]   = useState(0)
  const thumbsRef   = useRef(null)
  const thumbRefs   = useRef([])

  const count = images.length

  // Reset when images list changes
  useEffect(() => { setActive(0) }, [images])

  // Scroll active thumbnail into view
  useEffect(() => {
    thumbRefs.current[active]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  // Keyboard navigation for fullscreen
  useEffect(() => {
    if (!fullscreen) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') moveFsSlide(1)
      if (e.key === 'ArrowLeft')  moveFsSlide(-1)
      if (e.key === 'Escape')     setFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen, fsActive, count])

  // Prevent body scroll when fullscreen
  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  const changeSlide = useCallback((idx) => {
    if (idx === active) return
    setFading(true)
    setTimeout(() => { setActive(idx); setFading(false) }, 250)
  }, [active])

  const moveFsSlide = (dir) => {
    setFsActive(prev => (prev + dir + count) % count)
  }

  const openFullscreen = (idx) => {
    setFsActive(idx)
    setFullscreen(true)
  }

  // ── No images state ──────────────────────────────────────
  if (count === 0) {
    return (
      <div className="gallery-wrap">
        <div className="gallery-main">
          <div className="gallery-placeholder">
            <span className="gallery-placeholder-icon">🏠</span>
            <span className="gallery-placeholder-text">No images available</span>
          </div>
        </div>
      </div>
    )
  }

  const activeImg = images[active]
  const mainUrl   = buildUrl(activeImg?.image_url)

  return (
    <div className="gallery-wrap" aria-label={`Image gallery for ${hostelName}`}>
      {/* ── Main Image ── */}
      <div className="gallery-main">
        {mainUrl ? (
          <img
            key={mainUrl}
            src={mainUrl}
            alt={`${hostelName} — photo ${active + 1}`}
            className={`gallery-main-img ${fading ? 'fading' : ''}`}
            loading="eager"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="gallery-placeholder">
            <span className="gallery-placeholder-icon">🏠</span>
            <span className="gallery-placeholder-text">Image unavailable</span>
          </div>
        )}

        {/* Prev arrow */}
        {count > 1 && (
          <button
            className="gallery-arrow prev"
            onClick={() => changeSlide((active - 1 + count) % count)}
            aria-label="Previous image"
          >‹</button>
        )}

        {/* Next arrow */}
        {count > 1 && (
          <button
            className="gallery-arrow next"
            onClick={() => changeSlide((active + 1) % count)}
            aria-label="Next image"
          >›</button>
        )}

        {/* Counter */}
        {count > 1 && (
          <div className="gallery-counter" aria-live="polite">
            {active + 1} / {count}
          </div>
        )}

        {/* Fullscreen button */}
        <button
          className="gallery-fullscreen-btn"
          onClick={() => openFullscreen(active)}
          aria-label="View fullscreen"
        >⛶</button>
      </div>

      {/* ── Thumbnail Strip ── */}
      {count > 1 && (
        <div className="gallery-thumbs" ref={thumbsRef} role="list">
          {images.map((img, idx) => {
            const thumbUrl = buildUrl(img.image_url)
            return (
              <div
                key={img.image_id || idx}
                ref={el => thumbRefs.current[idx] = el}
                className={`gallery-thumb ${idx === active ? 'active' : ''}`}
                onClick={() => changeSlide(idx)}
                role="listitem"
                aria-label={`Photo ${idx + 1}`}
                aria-current={idx === active ? 'true' : 'false'}
              >
                <img
                  src={thumbUrl}
                  alt={`${hostelName} thumbnail ${idx + 1}`}
                  loading="lazy"
                  onError={e => { e.currentTarget.parentElement.style.background = '#F1F5F9' }}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* ── Fullscreen Modal ── */}
      {fullscreen && (
        <div
          className="gallery-fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image viewer"
        >
          {/* Close */}
          <button
            className="gallery-fs-close"
            onClick={() => setFullscreen(false)}
            aria-label="Close fullscreen"
          >✕</button>

          {/* Counter */}
          <div className="gallery-fs-counter">{fsActive + 1} / {count}</div>

          {/* Image + side arrows */}
          <div className="gallery-fs-img-wrap">
            {count > 1 && (
              <button
                className="gallery-fs-arrow prev"
                onClick={() => moveFsSlide(-1)}
                aria-label="Previous"
              >‹</button>
            )}

            <img
              src={buildUrl(images[fsActive]?.image_url)}
              alt={`${hostelName} — fullscreen photo ${fsActive + 1}`}
              className="gallery-fs-img"
              onError={e => { e.currentTarget.alt = 'Image unavailable' }}
            />

            {count > 1 && (
              <button
                className="gallery-fs-arrow next"
                onClick={() => moveFsSlide(1)}
                aria-label="Next"
              >›</button>
            )}
          </div>

          {/* Fullscreen thumbnail strip */}
          {count > 1 && (
            <div className="gallery-fs-thumbs">
              {images.map((img, idx) => (
                <div
                  key={img.image_id || idx}
                  className={`gallery-fs-thumb ${idx === fsActive ? 'active' : ''}`}
                  onClick={() => setFsActive(idx)}
                >
                  <img
                    src={buildUrl(img.image_url)}
                    alt={`Thumbnail ${idx + 1}`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
