import React from 'react'

/**
 * Loader — centered spinning circle with optional text
 * Props: text (string), fullPage (bool), size (sm|md|lg)
 */
function Loader({ text = '', fullPage = false, size = 'md' }) {
  const sizes = { sm: 24, md: 40, lg: 56 }
  const spinnerSize = sizes[size] || 40

  const spinnerStyle = {
    width: spinnerSize,
    height: spinnerSize,
    border: `${size === 'sm' ? 2 : 3}px solid var(--border)`,
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.9)',
          zIndex: 9999,
          gap: '16px',
        }}
      >
        <div style={spinnerStyle} />
        {text && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{text}</p>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '16px',
      }}
    >
      <div style={spinnerStyle} />
      {text && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{text}</p>
      )}
    </div>
  )
}

export default Loader
