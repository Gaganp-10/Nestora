import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * SearchBar — city, area, room type inputs + search button
 * Used on the Home page hero section
 * On submit: navigates to /browse with query params
 */
function SearchBar({ compact = false }) {
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [roomType, setRoomType] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    if (area.trim()) params.set('area', area.trim())
    if (roomType) params.set('room_type', roomType)
    navigate(`/browse?${params.toString()}`)
  }

  const inputStyle = {
    flex: 1,
    minWidth: compact ? '110px' : '140px',
    padding: '12px 16px',
    border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255,255,255,0.08)',
    color: compact ? 'var(--text-primary)' : '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    backdropFilter: 'blur(4px)',
    fontFamily: 'var(--font-family)',
    transition: 'all 0.2s ease',
  }

  const compactInputStyle = {
    flex: 1,
    minWidth: '110px',
    padding: '10px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: '#fff',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'var(--font-family)',
  }

  const activeStyle = compact ? compactInputStyle : inputStyle

  const placeholderCSS = `
    .search-bar-input::placeholder { color: ${compact ? 'var(--text-light)' : 'rgba(255,255,255,0.5)'}; }
    .search-bar-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(232,93,38,0.15); }
  `

  return (
    <form
      onSubmit={handleSearch}
      id="hero-search-form"
      style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
      aria-label="Search hostels"
    >
      <style>{placeholderCSS}</style>

      {/* City Input */}
      <div style={{ position: 'relative', flex: 1, minWidth: compact ? '110px' : '140px' }}>
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1rem',
            pointerEvents: 'none',
          }}
        >
          🏙️
        </span>
        <input
          id="search-city"
          type="text"
          className="search-bar-input"
          placeholder="City (e.g. Bangalore)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ ...activeStyle, paddingLeft: '38px' }}
        />
      </div>

      {/* Area Input */}
      <div style={{ position: 'relative', flex: 1, minWidth: compact ? '110px' : '140px' }}>
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1rem',
            pointerEvents: 'none',
          }}
        >
          📍
        </span>
        <input
          id="search-area"
          type="text"
          className="search-bar-input"
          placeholder="Area / Locality"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          style={{ ...activeStyle, paddingLeft: '38px' }}
        />
      </div>

      {/* Room Type Select */}
      <select
        id="search-room-type"
        className="search-bar-input"
        value={roomType}
        onChange={(e) => setRoomType(e.target.value)}
        style={{
          ...activeStyle,
          flex: '0 0 auto',
          minWidth: compact ? '120px' : '140px',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${compact ? '%236B7280' : 'rgba(255,255,255,0.7)'}' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '32px',
        }}
      >
        <option value="">🛏️ Room Type</option>
        <option value="single">Single</option>
        <option value="double">Double</option>
        <option value="triple">Triple</option>
      </select>

      {/* Search Button */}
      <button
        id="search-submit-btn"
        type="submit"
        className="btn btn-primary btn-lg"
        style={{ whiteSpace: 'nowrap', padding: '12px 28px' }}
      >
        🔍 Search
      </button>
    </form>
  )
}

export default SearchBar
