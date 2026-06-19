// FIXED: Browse.jsx
// KEY BUGS FIXED:
// 1. Backend returns { success, message, data: { hostels, total, page, pages } }
//    — frontend was reading res.data.hostels but must read res.data.data.hostels
// 2. Sort param names aligned to what backend accepts
// 3. Defensive extraction: falls back through multiple shapes
// 4. Mobile cards grid toggled via state not CSS display:none

import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import HostelCard    from '../components/HostelCard'
import FilterSidebar from '../components/FilterSidebar'
import Loader        from '../components/Loader'
import Footer        from '../components/Footer'
import api from '../api/axios'
import '../styles/Browse.css'

const SORT_OPTIONS = [
  { value: 'rating',    label: '⭐ Highest Rating' },
  { value: 'rent_asc',  label: '💰 Rent: Low to High' },
  { value: 'rent_desc', label: '💰 Rent: High to Low' },
  { value: 'newest',    label: '🆕 Newest First' },
]

function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [hostels,     setHostels]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [sortBy,      setSortBy]      = useState('newest')
  const [drawerOpen,  setDrawerOpen]  = useState(false)

  const [filters, setFilters] = useState({
    search:         searchParams.get('search') || '',
    city:           searchParams.get('city')   || '',
    gender:         searchParams.get('gender') || 'all',
    room_types:     searchParams.getAll('room_types') || [],
    min_rent:       searchParams.get('min_rent') || '',
    max_rent:       searchParams.get('max_rent') || '',
    min_rating:     Number(searchParams.get('min_rating')) || 0,
    available_only: searchParams.get('available_only') === 'true',
  })

  useEffect(() => {
    document.title = 'Browse Hostels — Nestora'
  }, [])

  const fetchHostels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = { page, per_page: 12 }
      if (filters.search)                      params.search    = filters.search
      if (filters.city)                        params.city      = filters.city
      if (filters.gender && filters.gender !== 'all') params.gender = filters.gender
      if (filters.room_types?.length)          params.room_type = filters.room_types.join(',')
      if (filters.min_rent)                    params.min_rent  = filters.min_rent
      if (filters.max_rent)                    params.max_rent  = filters.max_rent
      if (filters.min_rating > 0)              params.min_rating = filters.min_rating
      if (filters.available_only)              params.available = true

      // Map sort UI value to backend param
      if (sortBy === 'rent_asc')  params.sort = 'rent_asc'
      else if (sortBy === 'rent_desc') params.sort = 'rent_desc'
      else if (sortBy === 'rating')    params.sort = 'rating'
      // default is newest (no param needed, backend orders by created_at desc)

      const res = await api.get('/api/hostels', { params })

      // FIXED: Backend wraps everything in res.data.data
      // Shape: { success, message, data: { hostels:[...], total, page, pages } }
      const inner     = res.data?.data || res.data || {}
      const hostelList = inner.hostels || inner.data || (Array.isArray(res.data) ? res.data : [])

      setHostels(hostelList)
      setTotal(inner.total || hostelList.length)
      setTotalPages(inner.pages || inner.total_pages || Math.ceil((inner.total || hostelList.length) / 12) || 1)
    } catch (err) {
      console.error('Browse fetch error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page, sortBy])

  useEffect(() => {
    fetchHostels()
  }, [fetchHostels])

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
    setDrawerOpen(false)
    const params = {}
    if (newFilters.city)   params.city   = newFilters.city
    if (newFilters.search) params.search = newFilters.search
    if (newFilters.gender && newFilters.gender !== 'all') params.gender = newFilters.gender
    setSearchParams(params)
  }

  const handleClearFilters = (cleared) => {
    setFilters(cleared)
    setPage(1)
    setSearchParams({})
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null
    const pages = []
    const start = Math.max(1, page - 2)
    const end   = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)

    return (
      <div className="pagination" aria-label="Pagination">
        <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1} aria-label="Previous">‹</button>
        {start > 1 && (
          <>
            <button className="pagination-btn" onClick={() => setPage(1)}>1</button>
            {start > 2 && <span style={{ padding: '0 4px', color: 'var(--text-light)' }}>…</span>}
          </>
        )}
        {pages.map(p => (
          <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`}
            onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}>{p}</button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={{ padding: '0 4px', color: 'var(--text-light)' }}>…</span>}
            <button className="pagination-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>
          </>
        )}
        <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages} aria-label="Next">›</button>
      </div>
    )
  }

  const EMPTY_FILTERS = {
    search: '', city: '', gender: 'all', room_types: [],
    min_rent: '', max_rent: '', min_rating: 0, available_only: false,
  }

  return (
    <div className="browse-page">
      {/* Hero */}
      <div className="browse-hero">
        <div className="browse-hero-content">
          <h1>🔍 Browse Hostels & PGs</h1>
          <p>
            {filters.city
              ? `Showing results in ${filters.city}`
              : 'Find verified hostels and PGs across India'}
          </p>
        </div>
      </div>

      <div className="browse-layout">
        {/* Sidebar */}
        <aside className="browse-sidebar" aria-label="Filters">
          <FilterSidebar
            filters={filters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </aside>

        {/* Main */}
        <main className="browse-main">
          <div className="browse-toolbar">
            <div className="browse-count">
              {loading ? (
                <span style={{ color: 'var(--text-light)' }}>Searching...</span>
              ) : (
                <>
                  Showing <strong>{hostels.length}</strong>
                  {total !== hostels.length && <> of <strong>{total}</strong></>}{' '}
                  hostel{total !== 1 ? 's' : ''}
                  {filters.city && ` in ${filters.city}`}
                </>
              )}
            </div>

            <div className="browse-sort">
              <label htmlFor="sort-select">Sort:</label>
              <select id="sort-select" className="browse-sort-select" value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1) }}>
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <button className="browse-mobile-filter-btn"
              id="mobile-filter-btn" onClick={() => setDrawerOpen(true)}>
              🎛️ Filters
            </button>
          </div>

          {error && !loading && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
              <button className="btn btn-sm btn-outline" onClick={fetchHostels}
                style={{ marginLeft: 12 }}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="browse-loading">
              <Loader text="Finding hostels for you..." />
            </div>
          ) : hostels.length === 0 ? (
            <div className="browse-empty">
              <div className="browse-empty-icon">🏠</div>
              <h3>No hostels found</h3>
              <p>Try adjusting your filters or searching a different city.</p>
              <button className="btn btn-primary"
                onClick={() => handleClearFilters(EMPTY_FILTERS)}
                style={{ marginTop: 12 }}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="browse-grid">
              {hostels.map(hostel => (
                <HostelCard key={hostel.hostel_id || hostel.id} hostel={hostel} />
              ))}
            </div>
          )}

          {!loading && hostels.length > 0 && renderPagination()}
        </main>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="browse-drawer-overlay open" onClick={() => setDrawerOpen(false)} />
      )}
      <div className={`browse-drawer ${drawerOpen ? 'open' : ''}`} aria-label="Mobile filters">
        <div className="browse-drawer-header">
          <h3>🎛️ Filters</h3>
          <button className="browse-drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <FilterSidebar filters={filters} onApply={handleApplyFilters} onClear={handleClearFilters} />
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Browse
