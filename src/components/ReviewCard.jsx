import React from 'react'
import StarRating from './StarRating'
import { getInitials, formatDate, timeAgo } from '../utils/helpers'

/**
 * ReviewCard — displays a single review
 * Props: review (object)
 */
function ReviewCard({ review }) {
  if (!review) return null

  const {
    reviewer_name,
    rating,
    comment,
    created_at,
    user_name,
  } = review

  const name = reviewer_name || user_name || 'Anonymous'
  const initials = getInitials(name)

  // Avatar background color based on initial letter
  const colors = [
    '#E85D26', '#1D4ED8', '#065F46', '#7C3AED',
    '#9D174D', '#92400E', '#1E40AF', '#065F46',
  ]
  const colorIndex = name.charCodeAt(0) % colors.length
  const avatarBg = colors[colorIndex]

  return (
    <div
      style={{
        display: 'flex',
        gap: '14px',
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: avatarBg,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.875rem',
          flexShrink: 0,
          textTransform: 'uppercase',
        }}
        aria-label={`Avatar for ${name}`}
      >
        {initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '6px',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {name}
            </span>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-light)',
              }}
            >
              {created_at ? timeAgo(created_at) : ''}
            </span>
          </div>
          <StarRating rating={rating} size="sm" showNumber={false} />
        </div>

        {/* Comment */}
        {comment && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            "{comment}"
          </p>
        )}

        {/* Date */}
        {created_at && (
          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-light)',
              marginTop: '6px',
              marginBottom: 0,
            }}
          >
            {formatDate(created_at)}
          </p>
        )}
      </div>
    </div>
  )
}

export default ReviewCard
