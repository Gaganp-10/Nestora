// FIXED: HostelCard.jsx
// KEY BUGS FIXED:
// 1. Backend uses hostel_id (not id) and hostel_name (not name)
//    — updated all destructuring with dual fallbacks
// 2. getRentRange() now reads 'rent' field (fixed in helpers.js)
// 3. Image URL uses updated getImageUrl() — builds correct /uploads/ path
// 4. Link to detail uses hostel_id with fallback to id
// 5. Added onError placeholder for broken images

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import StarRating from './StarRating'
import {
  getGenderBadgeClass,
  getGenderLabel,
  getRentRange,
  getRoomTypes,
  getImageUrl,
  truncateText,
  getHostelId,
  getHostelName,
} from '../utils/helpers'
import '../styles/HostelCard.css'

function HostelCard({ hostel }) {
  const [imgError, setImgError] = useState(false)

  if (!hostel) return null

  // FIXED: backend uses hostel_id + hostel_name; support both shapes
  const hId       = getHostelId(hostel)
  const hName     = getHostelName(hostel)
  const {
    city,
    area,
    gender,
    rooms = [],
    images = [],
    avg_rating,
    review_count,
  } = hostel

  // Primary image — backend stores image_url like "uploads/hostel_1/file.jpg"
  const primaryImage = images.find(img => img.is_primary) || images[0]
  const imageUrl     = primaryImage ? getImageUrl(primaryImage.image_url) : null

  const rentRange   = getRentRange(rooms)
  const roomTypes   = getRoomTypes(rooms)
  const reviewCount = review_count ?? 0
  const rating      = avg_rating   ?? 0

  return (
    <article className="hostel-card" aria-label={`Hostel: ${hName}`}>
      {/* ── Image ── */}
      <div className="hostel-card-image-wrap">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={hName}
            className="hostel-card-image"
            // FIXED: onError shows placeholder on broken image
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="hostel-card-image-placeholder">
            <span>🏠</span>
            <p>No image available</p>
          </div>
        )}

        {/* Gender badge */}
        <span className={`badge ${getGenderBadgeClass(gender)} hostel-card-gender-badge`}>
          {gender === 'male' ? '👨' : gender === 'female' ? '👩' : '👫'}{' '}
          {getGenderLabel(gender)}
        </span>

        {/* Image count */}
        {images.length > 1 && (
          <span className="hostel-card-image-count">📷 {images.length}</span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="hostel-card-body">
        <h3 className="hostel-card-name" title={hName}>
          {truncateText(hName, 60)}
        </h3>

        <div className="hostel-card-location">
          <span className="hostel-card-location-icon">📍</span>
          <span>{area ? `${area}, ` : ''}{city}</span>
        </div>

        {/* Rating */}
        <div className="hostel-card-rating-row">
          <StarRating rating={rating} size="sm" showNumber={false} />
          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--warning)' }}>
            {rating > 0 ? rating.toFixed(1) : 'New'}
          </span>
          <span className="hostel-card-reviews">
            ({reviewCount > 0 ? `${reviewCount} review${reviewCount > 1 ? 's' : ''}` : 'No reviews yet'})
          </span>
        </div>

        {/* Price — FIXED: getRentRange now reads 'rent' field */}
        <div className="hostel-card-price">{rentRange}</div>

        {/* Room type badges */}
        {roomTypes.length > 0 && (
          <div className="hostel-card-room-types">
            {roomTypes.map(type => (
              <span key={type} className="badge badge-room">
                {type === 'single' ? '🛏️ Single' :
                 type === 'double' ? '🛏️🛏️ Double' :
                 '🛏️🛏️🛏️ Triple'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer CTA ── */}
      <div className="hostel-card-footer">
        {/* FIXED: use hostel_id (the actual PK from backend) */}
        <Link
          to={`/hostels/${hId}`}
          id={`view-hostel-${hId}`}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          View Details →
        </Link>
      </div>
    </article>
  )
}

export default HostelCard
