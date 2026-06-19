// FIXED: HostelDetail.jsx
// KEY BUGS FIXED:
// 1. Backend response: { success, message, data: { hostel: { ...fields, rooms, images, reviews } } }
//    — must extract hostel from res.data.data.hostel
// 2. Backend model uses hostel_id (PK), hostel_name, and Review has avg_rating on hostel
// 3. Room model uses 'rent' field (not rent_per_month)
// 4. All arrays (rooms, images, reviews) accessed with ?. to prevent crashes
// 5. Image URL built with getImageUrl() — correct /uploads/ path
// 6. Reviews fetched from res.data.data.reviews
// 7. Similar hostels use hostel_id as key
// 8. contact_phone may be null — guarded

import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ImageGallery from '../components/ImageGallery'
import StarRating   from '../components/StarRating'
import ReviewCard   from '../components/ReviewCard'
import HostelCard   from '../components/HostelCard'
import Loader       from '../components/Loader'
import Footer       from '../components/Footer'
import api from '../api/axios'
import {
  getGenderBadgeClass,
  getGenderLabel,
  getRentRange,
  formatCurrency,
  formatDate,
  getWhatsAppUrl,
  getInitials,
  getHostelId,
} from '../utils/helpers'
import '../styles/HostelDetail.css'

function HostelDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [hostel,    setHostel]    = useState(null)
  const [reviews,   setReviews]   = useState([])
  const [similar,   setSimilar]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [phoneRevealed, setPhoneRevealed] = useState(false)

  // Review form
  const [reviewForm, setReviewForm]     = useState({ reviewer_name: '', rating: 5, comment: '' })
  const [revSubmitting, setRevSubmitting] = useState(false)
  const [revError,  setRevError]        = useState('')
  const [revSuccess, setRevSuccess]     = useState(false)
  const [hoverStar,  setHoverStar]      = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchHostel()
  }, [id])

  const fetchHostel = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await api.get(`/api/hostels/${id}`)

      // FIXED: Backend wraps in res.data.data.hostel
      // Shape: { success, message, data: { hostel: { hostel_id, hostel_name, rooms, images, ... } } }
      const inner   = res.data?.data || res.data || {}
      const hostelData = inner.hostel || inner

      if (!hostelData || !hostelData.hostel_id) {
        throw new Error('Hostel not found or invalid response.')
      }

      setHostel(hostelData)
      document.title = `${hostelData.hostel_name || 'Hostel'} — Nestora`

      // Fetch reviews — shape: { success, message, data: { reviews } }
      try {
        const revRes  = await api.get(`/api/reviews/hostel/${id}`)
        const revData = revRes.data?.data || revRes.data || {}
        setReviews(revData.reviews || Array.isArray(revData) ? (revData.reviews || revData) : [])
      } catch (e) {
        console.warn('Reviews fetch failed:', e.message)
        setReviews([])
      }

      // Fetch similar hostels
      if (hostelData.city) {
        try {
          const simRes  = await api.get('/api/hostels', { params: { city: hostelData.city, per_page: 4 } })
          const simData = simRes.data?.data || simRes.data || {}
          const all     = simData.hostels || []
          setSimilar(all.filter(h => (h.hostel_id || h.id) !== Number(id)).slice(0, 3))
        } catch (e) {
          console.warn('Similar hostels failed:', e.message)
        }
      }
    } catch (err) {
      console.error('HostelDetail fetch error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewForm.reviewer_name.trim()) { setRevError('Please enter your name.'); return }
    if (!reviewForm.comment.trim())        { setRevError('Please write a comment.'); return }
    try {
      setRevSubmitting(true)
      setRevError('')
      await api.post(`/api/reviews/hostel/${id}`, {
        reviewer_name: reviewForm.reviewer_name,
        rating:        reviewForm.rating,
        comment:       reviewForm.comment,
      })
      setRevSuccess(true)
      setReviewForm({ reviewer_name: '', rating: 5, comment: '' })
      // Refresh reviews
      const res     = await api.get(`/api/reviews/hostel/${id}`)
      const revData = res.data?.data || res.data || {}
      setReviews(revData.reviews || [])
    } catch (err) {
      setRevError(err.message || 'Failed to submit review.')
    } finally {
      setRevSubmitting(false)
    }
  }

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="hostel-detail-loading">
        <Loader text="Loading hostel details..." size="lg" />
      </div>
    )
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error || !hostel) {
    return (
      <div className="hostel-detail-error">
        <span style={{ fontSize: '3rem' }}>😕</span>
        <h2>Hostel Not Found</h2>
        <p>{error || 'This hostel may have been removed or does not exist.'}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Go Back</button>
          <Link to="/browse" className="btn btn-primary">Browse All Hostels</Link>
        </div>
      </div>
    )
  }

  // FIXED: extract using actual backend field names
  const {
    hostel_id,
    hostel_name,
    city,
    area,
    address,
    gender,
    description,
    contact_phone,
    owner,
    rooms      = [],
    images     = [],
    avg_rating,
    review_count,
    created_at,
  } = hostel

  const rentRange   = getRentRange(rooms)
  const reviewCount = review_count ?? reviews.length

  return (
    <div className="hostel-detail-page">
      <div className="hostel-detail-container">

        {/* Breadcrumb */}
        <nav className="hostel-detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/browse">Browse</Link>
          {city && (
            <><span>›</span><Link to={`/browse?city=${city}`}>{city}</Link></>
          )}
          <span>›</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{hostel_name}</span>
        </nav>

        {/* Gallery — FIXED: images array is now safely optional-chained */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <ImageGallery images={images || []} hostelName={hostel_name} />
        </div>

        {/* Header */}
        <div className="hostel-detail-header">
          <div className="hostel-detail-title-row">
            <h1 className="hostel-detail-title">{hostel_name}</h1>
            <button className="hostel-detail-share-btn"
              onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied!') }}>
              🔗 Share
            </button>
          </div>

          <div className="hostel-detail-meta">
            {city && (
              <span className="hostel-detail-meta-item">
                <span className="icon">📍</span>
                {area ? `${area}, ` : ''}{city}
              </span>
            )}
            <span className={`badge ${getGenderBadgeClass(gender)}`}>
              {getGenderLabel(gender)}
            </span>
            <span className="hostel-detail-meta-item">
              <StarRating rating={avg_rating || 0} size="sm" showNumber={false} />
              <strong style={{ color: 'var(--warning)', fontWeight: 700 }}>
                {avg_rating ? parseFloat(avg_rating).toFixed(1) : 'New'}
              </strong>
              <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
              </span>
            </span>
            {created_at && (
              <span className="hostel-detail-meta-item" style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                <span className="icon">📅</span>Listed on {formatDate(created_at)}
              </span>
            )}
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="hostel-detail-layout">

          {/* ── LEFT ── */}
          <div className="hostel-detail-left">

            {/* Description */}
            {description && (
              <section className="hostel-detail-section">
                <h2 className="hostel-detail-section-title"><span className="icon">📝</span> About</h2>
                <p className="hostel-detail-description">{description}</p>
              </section>
            )}

            {/* Address */}
            {address && (
              <section className="hostel-detail-section">
                <h2 className="hostel-detail-section-title"><span className="icon">🗺️</span> Location</h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.5rem' }}>📍</span>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{hostel_name}</p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{address}</p>
                    {city && <p style={{ color: 'var(--text-secondary)' }}>{city}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* Rooms — FIXED: field is 'rent' not 'rent_per_month' */}
            {rooms.length > 0 && (
              <section className="hostel-detail-section">
                <h2 className="hostel-detail-section-title"><span className="icon">🛏️</span> Rooms & Pricing</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="rooms-table" aria-label="Room types">
                    <thead>
                      <tr>
                        <th>Room Type</th>
                        <th>Rent / Month</th>
                        <th>Capacity</th>
                        <th>Available Beds</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room, idx) => (
                        <tr key={room.room_id || idx}>
                          <td>
                            <span className="badge badge-room" style={{ textTransform: 'capitalize' }}>
                              {room.room_type === 'single' ? '🛏️' :
                               room.room_type === 'double' ? '🛏️🛏️' : '🛏️🛏️🛏️'}{' '}{room.room_type}
                            </span>
                          </td>
                          {/* FIXED: backend returns 'rent' (decimal), not 'rent_per_month' */}
                          <td className="rent-cell">
                            {formatCurrency(room.rent ?? room.rent_per_month)}
                            <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>/mo</span>
                          </td>
                          <td>{room.capacity ?? '—'}</td>
                          <td className="available-cell">
                            {room.available_beds !== undefined ? `${room.available_beds} available` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="hostel-detail-section">
              <h2 className="hostel-detail-section-title"><span className="icon">⭐</span> Reviews</h2>

              <div className="reviews-summary">
                <div style={{ textAlign: 'center' }}>
                  <div className="reviews-big-number">
                    {avg_rating ? parseFloat(avg_rating).toFixed(1) : '—'}
                  </div>
                  <div style={{ margin: '6px 0' }}>
                    <StarRating rating={avg_rating || 0} size="md" showNumber={false} />
                  </div>
                  <div className="reviews-big-label">
                    {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="reviews-divider" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {reviewCount > 0
                      ? `Based on ${reviewCount} student review${reviewCount !== 1 ? 's' : ''}.`
                      : 'No reviews yet. Be the first to share your experience!'}
                  </p>
                </div>
              </div>

              {/* Review list — FIXED: safe access with ?. */}
              {reviews?.length > 0 && (
                <div className="reviews-list">
                  {reviews.map((rev, idx) => (
                    <ReviewCard key={rev.review_id || rev.id || idx} review={rev} />
                  ))}
                </div>
              )}

              {/* Review form */}
              <div className="add-review-form">
                <h4>✍️ Write a Review</h4>
                {revSuccess && <div className="alert alert-success">✅ Review submitted! Thank you.</div>}
                {revError   && <div className="alert alert-error">{revError}</div>}

                <form onSubmit={handleReviewSubmit} id="review-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reviewer-name">Your Name *</label>
                    <input id="reviewer-name" type="text" className="form-input"
                      placeholder="Enter your name"
                      value={reviewForm.reviewer_name}
                      onChange={e => setReviewForm(f => ({ ...f, reviewer_name: e.target.value }))}
                      required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rating *</label>
                    <div className="review-star-select">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button"
                          className={`review-star-btn ${star <= (hoverStar || reviewForm.rating) ? 'active' : ''}`}
                          onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          aria-label={`${star} star${star > 1 ? 's' : ''}`}>★</button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="review-comment">Your Review *</label>
                    <textarea id="review-comment" className="form-textarea" rows={3}
                      placeholder="Share your experience..."
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      required />
                  </div>

                  <button type="submit" id="submit-review-btn" className="btn btn-primary"
                    disabled={revSubmitting}>
                    {revSubmitting ? '⏳ Submitting...' : '📤 Submit Review'}
                  </button>
                </form>
              </div>
            </section>
          </div>

          {/* ── RIGHT — Contact Card ── */}
          <div className="hostel-detail-right">
            <div className="contact-card">
              <h3 className="contact-card-title">📞 Contact Owner</h3>

              <div className="contact-card-price">
                <div className="contact-card-price-label">Starting from</div>
                <div className="contact-card-price-value">{rentRange}</div>
              </div>

              {/* Owner info — FIXED: backend owner object has 'name' field */}
              <div className="contact-owner-info">
                <div className="contact-owner-avatar">
                  {getInitials(owner?.name || 'O')}
                </div>
                <div>
                  <div className="contact-owner-name">{owner?.name || 'Property Owner'}</div>
                  <div className="contact-owner-tag">🏠 Verified Owner</div>
                </div>
              </div>

              {/* FIXED: contact_phone guarded with null check */}
              {contact_phone && (
                <div className="contact-phone-reveal" style={{ marginBottom: 'var(--space-md)' }}>
                  <div>
                    {phoneRevealed
                      ? <span className="contact-phone-number">📱 {contact_phone}</span>
                      : <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>📱 +91 ••••••••••</span>
                    }
                  </div>
                  <button className="btn btn-sm btn-outline" id="reveal-phone-btn"
                    onClick={() => setPhoneRevealed(true)}>
                    {phoneRevealed ? '📋 Copy' : 'Show'}
                  </button>
                </div>
              )}

              <div className="contact-actions">
                {contact_phone && (
                  <>
                    <a href={getWhatsAppUrl(contact_phone, hostel_name)}
                      target="_blank" rel="noopener noreferrer"
                      id="whatsapp-btn" className="btn btn-primary contact-whatsapp-btn"
                      style={{ background: '#25D366', borderColor: '#25D366', justifyContent: 'center' }}>
                      💬 WhatsApp Owner
                    </a>
                    <a href={`tel:${contact_phone}`} id="call-btn" className="btn btn-outline"
                      style={{ justifyContent: 'center' }}>
                      📞 Call Now
                    </a>
                  </>
                )}
                <Link to="/browse" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  🔍 Browse Similar
                </Link>
              </div>

              <div className="contact-report">
                <span className="contact-report-link">⚠️ Report this listing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Hostels */}
        {similar.length > 0 && (
          <section className="similar-section">
            <h2 className="section-title" style={{ marginBottom: 'var(--space-lg)' }}>
              🏠 Similar Hostels in {city}
            </h2>
            <div className="similar-scroll">
              {similar.map(h => (
                <HostelCard key={getHostelId(h)} hostel={h} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default HostelDetail
