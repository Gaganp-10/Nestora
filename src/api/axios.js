// FIXED: axios.js
// - Token key confirmed as 'nestora_token' (correct)
// - On 401: clear both localStorage keys + redirect to /login
// - Error messages now extract from all possible backend shapes
// - Added timeout and clearer error for network failures

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── REQUEST INTERCEPTOR ────────────────────────────────────────────────────
// Attach JWT Bearer token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    // FIXED: read from correct key 'nestora_token'
    const token = localStorage.getItem('nestora_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────
api.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,

  (error) => {
    if (error.response) {
      const { status, data } = error.response

      // FIXED: on 401, clear BOTH keys and redirect
      if (status === 401) {
        localStorage.removeItem('nestora_token')
        localStorage.removeItem('nestora_user')
        // Only redirect if not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }

      // FIXED: extract message from all backend shapes:
      // { message }, { error }, { msg }, { errors: {...} }
      let message =
        data?.message ||
        data?.error ||
        data?.msg ||
        (data?.errors ? Object.values(data.errors).join(', ') : null) ||
        `Request failed with status ${status}`

      return Promise.reject(new Error(message))
    }

    if (error.request) {
      // Request was sent but no response received (network down, CORS, etc.)
      return Promise.reject(
        new Error('Unable to connect to server. Please ensure the backend is running.')
      )
    }

    return Promise.reject(new Error(error.message || 'An unexpected error occurred.'))
  }
)

export default api
