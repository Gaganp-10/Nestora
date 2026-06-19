// Toast.jsx — Toast notification system (hook + component)
import React, { useState, useCallback, useEffect } from 'react'

/**
 * useToast() hook — returns { toasts, showToast }
 * showToast(message, type='success'|'error'|'info')
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  return { toasts, showToast }
}

/**
 * ToastContainer — render this once per page
 */
export function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  return (
    <div className="admin-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`admin-toast ${t.type}`}>
          <span>{icons[t.type] || '✅'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
