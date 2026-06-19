import React, { useState } from 'react'

const ROOM_TYPES = ['single', 'double', 'triple']
const GENDER_OPTIONS = ['all', 'male', 'female', 'co-ed']

/**
 * FilterSidebar — filter panel for Browse page
 * Props:
 *   filters (object) — current filter values
 *   onApply (fn) — called with updated filters object
 *   onClear (fn) — called to reset all filters
 */
function FilterSidebar({ filters = {}, onApply, onClear }) {
  const [local, setLocal] = useState({
    search: filters.search || '',
    city: filters.city || '',
    gender: filters.gender || 'all',
    room_types: filters.room_types || [],
    min_rent: filters.min_rent || '',
    max_rent: filters.max_rent || '',
    min_rating: filters.min_rating || 0,
    available_only: filters.available_only || false,
    ...filters,
  })

  const set = (key, value) => setLocal((prev) => ({ ...prev, [key]: value }))

  const toggleRoomType = (type) => {
    set(
      'room_types',
      local.room_types.includes(type)
        ? local.room_types.filter((t) => t !== type)
        : [...local.room_types, type]
    )
  }

  const handleApply = (e) => {
    e.preventDefault()
    onApply && onApply(local)
  }

  const handleClear = () => {
    const cleared = {
      search: '',
      city: '',
      gender: 'all',
      room_types: [],
      min_rent: '',
      max_rent: '',
      min_rating: 0,
      available_only: false,
    }
    setLocal(cleared)
    onClear && onClear(cleared)
  }

  const cardStyle = {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
  }

  const headerStyle = {
    padding: '14px 18px',
    background: 'var(--secondary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: 700,
    fontSize: '0.9rem',
  }

  const sectionStyle = {
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '8px',
  }

  return (
    <form onSubmit={handleApply} id="filter-form" style={cardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span>🎛️ Filters</span>
        <button
          type="button"
          onClick={handleClear}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'var(--font-family)',
          }}
        >
          Clear All
        </button>
      </div>

      {/* Name / Area Search */}
      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="filter-search">🔍 Search</label>
        <input
          id="filter-search"
          type="text"
          className="form-input"
          placeholder="Name, area, landmark..."
          value={local.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>

      {/* City */}
      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="filter-city">🏙️ City</label>
        <input
          id="filter-city"
          type="text"
          className="form-input"
          placeholder="e.g. Bangalore"
          value={local.city}
          onChange={(e) => set('city', e.target.value)}
        />
      </div>

      {/* Gender */}
      <div style={sectionStyle}>
        <span style={labelStyle}>👤 Gender</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {GENDER_OPTIONS.map((g) => (
            <label
              key={g}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: local.gender === g ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: local.gender === g ? 600 : 400,
              }}
            >
              <input
                type="radio"
                name="gender"
                value={g}
                checked={local.gender === g}
                onChange={() => set('gender', g)}
                style={{ accentColor: 'var(--primary)' }}
              />
              {g === 'all' ? 'All' :
               g === 'male' ? '👨 Boys Only' :
               g === 'female' ? '👩 Girls Only' :
               '👫 Co-ed'}
            </label>
          ))}
        </div>
      </div>

      {/* Room Types */}
      <div style={sectionStyle}>
        <span style={labelStyle}>🛏️ Room Type</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ROOM_TYPES.map((type) => (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: local.room_types.includes(type) ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: local.room_types.includes(type) ? 600 : 400,
              }}
            >
              <input
                type="checkbox"
                checked={local.room_types.includes(type)}
                onChange={() => toggleRoomType(type)}
                style={{ accentColor: 'var(--primary)' }}
              />
              {type === 'single' ? '🛏️ Single' :
               type === 'double' ? '🛏️ Double' :
               '🛏️ Triple'}
            </label>
          ))}
        </div>
      </div>

      {/* Rent Range */}
      <div style={sectionStyle}>
        <span style={labelStyle}>💰 Rent Range (₹/month)</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <input
              id="filter-min-rent"
              type="number"
              className="form-input"
              placeholder="Min"
              min="0"
              value={local.min_rent}
              onChange={(e) => set('min_rent', e.target.value)}
            />
          </div>
          <div>
            <input
              id="filter-max-rent"
              type="number"
              className="form-input"
              placeholder="Max"
              min="0"
              value={local.max_rent}
              onChange={(e) => set('max_rent', e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>₹0</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>₹50,000+</span>
        </div>
      </div>

      {/* Min Rating */}
      <div style={sectionStyle}>
        <span style={labelStyle}>⭐ Min Rating</span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => set('min_rating', local.min_rating === star ? 0 : star)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: star <= local.min_rating ? '#F59E0B' : 'var(--border)',
                transition: 'transform 0.15s, color 0.15s',
                padding: '2px',
              }}
              aria-label={`Minimum ${star} stars`}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ★
            </button>
          ))}
          {local.min_rating > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
              {local.min_rating}+
            </span>
          )}
        </div>
      </div>

      {/* Availability Toggle */}
      <div style={{ ...sectionStyle, borderBottom: 'none' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            🟢 Available Only
          </span>
          <div
            role="switch"
            aria-checked={local.available_only}
            onClick={() => set('available_only', !local.available_only)}
            style={{
              width: 44,
              height: 24,
              borderRadius: '12px',
              background: local.available_only ? 'var(--primary)' : 'var(--border)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: local.available_only ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                transition: 'left 0.2s',
              }}
            />
          </div>
        </label>
      </div>

      {/* Apply Button */}
      <div style={{ padding: '14px 18px', display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn btn-primary btn-full" id="apply-filters-btn">
          Apply Filters
        </button>
      </div>
    </form>
  )
}

export default FilterSidebar
