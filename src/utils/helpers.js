// FIXED: helpers.js
// KEY BUGS FIXED:
// 1. getRentRange() was reading room.rent_per_month — backend model uses 'rent'
// 2. getRoomTypes() was reading room.room_type — correct, kept as-is
// 3. getImageUrl() — backend serves at /uploads/<filename>, NOT /<filename>
//    image_url from DB is like "uploads/hostel_1/filename.jpg"
//    so full URL = VITE_API_BASE_URL + "/" + image_url  ← already correct
// 4. Added hostel_id / hostel_name aware helpers for HostelCard

/**
 * helpers.js — Utility functions for Nestora frontend
 */

/**
 * Format a number as Indian Rupees (₹)
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a date string to readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Format rating to 1 decimal place
 */
export function formatRating(rating) {
  if (!rating && rating !== 0) return '0.0'
  return parseFloat(rating).toFixed(1)
}

/**
 * Get gender badge CSS class
 */
export function getGenderBadgeClass(gender) {
  if (!gender) return 'badge-coed'
  const g = gender.toLowerCase()
  if (g === 'male')   return 'badge-male'
  if (g === 'female') return 'badge-female'
  return 'badge-coed'
}

/**
 * Get gender display label
 */
export function getGenderLabel(gender) {
  if (!gender) return 'Co-ed'
  const g = gender.toLowerCase()
  if (g === 'male')   return 'Boys'
  if (g === 'female') return 'Girls'
  return 'Co-ed'
}

/**
 * Get rent range string from rooms array
 * FIXED: backend Room model uses 'rent' (not 'rent_per_month')
 */
export function getRentRange(rooms) {
  if (!rooms || rooms.length === 0) return 'Price on request'
  // FIXED: try 'rent' first (actual DB field), fall back to 'rent_per_month'
  const rents = rooms
    .map(r => r.rent ?? r.rent_per_month)
    .filter(v => v !== null && v !== undefined && !isNaN(v))
  if (rents.length === 0) return 'Price on request'
  const min = Math.min(...rents)
  const max = Math.max(...rents)
  if (min === max) return `${formatCurrency(min)}/month`
  return `${formatCurrency(min)} – ${formatCurrency(max)}/month`
}

/**
 * Get unique room types from rooms array
 */
export function getRoomTypes(rooms) {
  if (!rooms || rooms.length === 0) return []
  const types = rooms.map(r => r.room_type).filter(Boolean)
  return [...new Set(types)]
}

/**
 * Truncate text to specified length
 */
export function truncateText(text, maxLength = 120) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Get initials from a name (for avatar)
 */
export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Generate WhatsApp URL from phone number
 */
export function getWhatsAppUrl(phone, hostelName = '') {
  if (!phone) return '#'
  const cleaned = phone.replace(/\D/g, '')
  const number  = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  const message = encodeURIComponent(
    `Hi, I'm interested in your hostel${hostelName ? ` "${hostelName}"` : ''} listed on Nestora. Could you please share more details?`
  )
  return `https://wa.me/${number}?text=${message}`
}

/**
 * Build full image URL from stored path
 * FIXED: backend stores image_url as "uploads/hostel_1/file.jpg"
 * Full URL = baseURL + "/" + image_url
 * The /uploads/<filename> static route is registered in Flask __init__.py
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  // Avoid double-slash
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${base}${path}`
}

/**
 * Get hostel ID — handles both 'hostel_id' and 'id' field names
 */
export function getHostelId(hostel) {
  return hostel?.hostel_id ?? hostel?.id
}

/**
 * Get hostel name — handles both 'hostel_name' and 'name' field names
 */
export function getHostelName(hostel) {
  return hostel?.hostel_name || hostel?.name || 'Unnamed Hostel'
}

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test((phone || '').replace(/\s/g, ''))
}

/**
 * Time ago string
 */
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const date     = new Date(dateStr)
  const now      = new Date()
  const diffMs   = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0)  return 'Today'
  if (diffDays === 1)  return 'Yesterday'
  if (diffDays < 30)   return `${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  const diffYears  = Math.floor(diffMonths / 12)
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
}
