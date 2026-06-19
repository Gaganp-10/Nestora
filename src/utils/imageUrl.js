/**
 * imageUrl.js — Centralised image URL resolver for Nestora frontend.
 *
 * In production the backend stores full Cloudinary https:// URLs.
 * In development the backend stores relative paths like /uploads/<id>/<file>.
 *
 * This utility handles both cases transparently so components never
 * have to worry about the environment.
 */

const PLACEHOLDER = '/placeholder.jpg'

/**
 * Resolve any image URL to a full, displayable URL.
 *
 * @param {string|null|undefined} imageUrl - The raw URL from the API response.
 * @returns {string} A fully qualified URL ready to use in <img src=...>.
 *
 * @example
 *   // Production — Cloudinary URL (returned as-is)
 *   getImageUrl('https://res.cloudinary.com/dgonwgxfg/image/upload/nestora/hostels/1/abc.jpg')
 *   // → 'https://res.cloudinary.com/dgonwgxfg/image/upload/nestora/hostels/1/abc.jpg'
 *
 *   // Development — relative path (prefixed with base URL)
 *   getImageUrl('/uploads/1/abc.jpg')
 *   // → 'http://localhost:5000/uploads/1/abc.jpg'
 *
 *   // Null / empty — placeholder
 *   getImageUrl(null)
 *   // → '/placeholder.jpg'
 */
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return PLACEHOLDER

  // Already a full URL (Cloudinary in production, or any external URL)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // Relative path — prepend the API base URL (localhost in dev, PA in prod)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${baseUrl}${path}`
}

export default getImageUrl
