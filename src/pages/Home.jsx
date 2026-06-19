import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import HostelCard from '../components/HostelCard'
import Footer from '../components/Footer'
import Loader from '../components/Loader'
import api from '../api/axios'
import '../styles/Home.css'

const CITIES = [
  { name: 'Bangalore', emoji: '🌆', count: '120+' },
  { name: 'Mumbai', emoji: '🌊', count: '95+' },
  { name: 'Pune', emoji: '🏔️', count: '80+' },
  { name: 'Hyderabad', emoji: '💎', count: '75+' },
  { name: 'Chennai', emoji: '🌴', count: '60+' },
]

const STATS = [
  { icon: '🏠', number: '500+', label: 'Hostels Listed' },
  { icon: '🏙️', number: '20+', label: 'Cities Covered' },
  { icon: '👨‍🎓', number: '10,000+', label: 'Students Helped' },
  { icon: '⭐', number: '4.8★', label: 'Average Rating' },
]

const HOW_STEPS = [
  {
    num: '1',
    icon: '🔍',
    title: 'Search by City or Area',
    desc: 'Enter your city, locality, or nearest landmark to find hostels in your preferred area.',
  },
  {
    num: '2',
    icon: '📊',
    title: 'Compare Hostels & Rooms',
    desc: 'Compare prices, amenities, room types, and real reviews from verified students.',
  },
  {
    num: '3',
    icon: '📞',
    title: 'Contact Owner Directly',
    desc: "No middlemen. Get the owner's number and WhatsApp to book on your terms.",
  },
]

function Home() {
  const [featuredHostels, setFeaturedHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Nestora — Find Your Perfect PG or Hostel'
    fetchFeatured()
  }, [])

  const fetchFeatured = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/hostels', { params: { per_page: 6, page: 1 } })
      const data = res.data
      // Handle various API response shapes
      const hostels = data.hostels || data.data || data.results || data || []
      setFeaturedHostels(Array.isArray(hostels) ? hostels.slice(0, 6) : [])
    } catch (err) {
      console.error('Failed to fetch featured hostels:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCityClick = (cityName) => {
    navigate(`/browse?city=${encodeURIComponent(cityName)}`)
  }

  return (
    <div className="page-wrapper">
      {/* ── HERO ── */}
      <section className="hero" aria-label="Hero section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-tag">
              <span>✨</span> India's Most Trusted PG Finder
            </div>

            <h1 className="hero-heading">
              Find Your Perfect{' '}
              <span className="highlight">PG or Hostel</span>
            </h1>

            <p className="hero-subheading">
              Discover verified PGs and hostels near your college. Compare prices,
              read real reviews, and connect with owners directly — no brokerage.
            </p>

            {/* Hero Search */}
            <div className="hero-search">
              <SearchBar />
            </div>

            <div className="hero-actions">
              <Link to="/browse" className="btn btn-primary btn-lg">
                🔍 Browse All Hostels
              </Link>
              <Link to="/register" className="btn btn-outline-light btn-lg">
                ➕ List Your Property
              </Link>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="hero-visual">
            <div className="hero-illustration">
              <div className="hero-illustration-card">
                <div
                  style={{
                    width: '100%',
                    height: 280,
                    borderRadius: 'var(--radius)',
                    background: 'linear-gradient(135deg, rgba(232,93,38,0.12), rgba(26,26,46,0.3))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8rem',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  🏠
                </div>

                {/* Floating badges */}
                <div className="hero-floating-badge top-left">
                  <span className="badge-icon">✅</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Verified</div>
                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>500+ Hostels</div>
                  </div>
                </div>

                <div className="hero-floating-badge bottom-right">
                  <span className="badge-icon">⭐</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Avg Rating</div>
                    <div style={{ fontWeight: 700, color: 'var(--warning)' }}>4.8 / 5.0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="stats-bar" aria-label="Platform statistics">
        <div className="stats-bar-container">
          {STATS.map((stat) => (
            <div className="stat-item" key={stat.label}>
              <div className="stat-icon">{stat.icon}</div>
              <div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED HOSTELS ── */}
      <section className="featured-section" aria-labelledby="featured-heading">
        <div className="container">
          <div className="featured-header">
            <div>
              <div className="featured-label">
                <span>🔥</span> Popular Picks
              </div>
              <h2 id="featured-heading" className="section-title">Featured Hostels</h2>
              <p className="section-subtitle">
                Hand-picked top-rated hostels loved by students across India
              </p>
            </div>
            <Link to="/browse" className="btn btn-outline" style={{ flexShrink: 0 }}>
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="featured-loading">
              <Loader text="Loading featured hostels..." />
            </div>
          ) : error ? (
            <div className="featured-error">
              <div className="alert alert-error" style={{ textAlign: 'center' }}>
                <p>⚠️ Could not load featured hostels. {error}</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={fetchFeatured}
                  style={{ marginTop: '10px' }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : featuredHostels.length > 0 ? (
            <div className="featured-grid">
              {featuredHostels.map((hostel) => (
                <HostelCard key={hostel.id} hostel={hostel} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏠</div>
              <h3>No hostels listed yet</h3>
              <p>Be the first to list your property on Nestora!</p>
              <Link to="/register" className="btn btn-primary">
                List Your Property
              </Link>
            </div>
          )}

          {featuredHostels.length > 0 && (
            <div className="featured-cta">
              <Link to="/browse" className="btn btn-primary btn-lg">
                View All Hostels →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section" aria-labelledby="how-heading">
        <div className="container">
          <div className="section-header">
            <div className="label">
              <span>💡</span> Simple Process
            </div>
            <h2 id="how-heading" className="section-title">How Nestora Works</h2>
            <p className="section-subtitle">
              Finding your perfect accommodation is just 3 easy steps away
            </p>
          </div>

          <div className="how-grid">
            {HOW_STEPS.map((step) => (
              <div className="how-step" key={step.num}>
                <div className="how-step-number">{step.num}</div>
                <div className="how-step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CITIES ── */}
      <section className="cities-section" aria-labelledby="cities-heading">
        <div className="container">
          <div className="section-header">
            <div className="label">
              <span>📍</span> Explore Cities
            </div>
            <h2 id="cities-heading" className="section-title">Popular Cities</h2>
            <p className="section-subtitle">
              Explore hostels and PGs in top student cities across India
            </p>
          </div>

          <div className="cities-grid">
            {CITIES.map((city) => (
              <div
                key={city.name}
                className="city-card"
                onClick={() => handleCityClick(city.name)}
                role="button"
                tabIndex={0}
                id={`city-${city.name.toLowerCase()}`}
                onKeyDown={(e) => e.key === 'Enter' && handleCityClick(city.name)}
                aria-label={`Browse hostels in ${city.name}`}
              >
                <div className="city-card-emoji">{city.emoji}</div>
                <div className="city-card-name">{city.name}</div>
                <div className="city-card-count">{city.count} listings</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          padding: 'var(--space-3xl) 0',
        }}
        aria-label="Call to action"
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: '12px', fontSize: 'var(--font-size-3xl)' }}>
            Own a PG or Hostel?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '28px', fontSize: 'var(--font-size-lg)' }}>
            List your property for free and reach thousands of students instantly.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-outline-light btn-lg">
              ➕ List Your Property Free
            </Link>
            <Link to="/login" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary)' }}>
              🔑 Owner Login
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
