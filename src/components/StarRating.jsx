import React from 'react'
import { formatRating } from '../utils/helpers'

/**
 * StarRating — displays filled/half/empty stars
 * Props:
 *   rating (number 0-5)
 *   size ('sm' | 'md' | 'lg')
 *   showNumber (bool) — show numeric rating beside stars
 *   interactive (bool) — allow clicking to set rating
 *   onRate (fn) — callback when star clicked
 */
function StarRating({ rating = 0, size = 'md', showNumber = true, interactive = false, onRate }) {
  const sizes = { sm: 14, md: 18, lg: 24 }
  const fontSize = sizes[size] || 18

  const stars = [1, 2, 3, 4, 5]

  const getStarType = (star) => {
    if (rating >= star) return 'full'
    if (rating >= star - 0.5) return 'half'
    return 'empty'
  }

  const starStyle = {
    fontSize,
    cursor: interactive ? 'pointer' : 'default',
    lineHeight: 1,
    display: 'inline-block',
    transition: 'transform 0.15s ease',
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? 2 : 3,
      }}
      aria-label={`Rating: ${formatRating(rating)} out of 5`}
    >
      {stars.map((star) => {
        const type = getStarType(star)
        return (
          <span
            key={star}
            style={{
              ...starStyle,
              color: type === 'empty' ? '#D1D5DB' : '#F59E0B',
            }}
            onClick={() => interactive && onRate && onRate(star)}
            onMouseEnter={(e) => {
              if (interactive) e.currentTarget.style.transform = 'scale(1.2)'
            }}
            onMouseLeave={(e) => {
              if (interactive) e.currentTarget.style.transform = 'scale(1)'
            }}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `Rate ${star} stars` : undefined}
          >
            {type === 'full' ? '★' : type === 'half' ? '⯨' : '☆'}
          </span>
        )
      })}
      {showNumber && (
        <span
          style={{
            fontSize: fontSize * 0.8,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginLeft: 2,
          }}
        >
          {formatRating(rating)}
        </span>
      )}
    </span>
  )
}

export default StarRating
