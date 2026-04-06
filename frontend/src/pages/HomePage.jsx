import { useState, useEffect, useMemo } from 'react'
import MapView from '../components/MapView'
import RestaurantList from '../components/RestaurantList'
import DetailPanel from '../components/DetailPanel'

const API = '/api/restaurants'
const PRICES = ['$', '$$', '$$$', '$$$$']

export default function HomePage({ showToast }) {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [search, setSearch]           = useState('')
  const [priceFilter, setPriceFilter] = useState([])   // multi-select
  const [minRating, setMinRating]     = useState(0)    // 0 = any

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(res => {
        if (res.success) setRestaurants(res.data)
        else showToast('Failed to load restaurants', 'error')
      })
      .catch(() => showToast('Cannot reach the server — is the backend running?', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const togglePrice = (p) =>
    setPriceFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return restaurants.filter(r => {
      if (q && !r.NAME.toLowerCase().includes(q) && !(r.ADDRESS || '').toLowerCase().includes(q)) return false
      if (priceFilter.length > 0 && !priceFilter.includes(r.PRICE_RANGE)) return false
      if (minRating > 0 && parseFloat(r.AVG_RATING) < minRating) return false
      return true
    })
  }, [restaurants, search, priceFilter, minRating])

  const handleSelect = (r) =>
    setSelected(prev => prev?.RESTAURANT_ID === r.RESTAURANT_ID ? null : r)

  const handleFavorite = () => showToast('Sign in to save favourites', 'error')

  const hasFilters = priceFilter.length > 0 || minRating > 0

  return (
    <div className="main-content">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Restaurants</h2>

          {/* Search */}
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="Search by name or area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Price filter */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Price
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {PRICES.map(p => (
                <button
                  key={p}
                  onClick={() => togglePrice(p)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 99,
                    border: '1.5px solid',
                    borderColor: priceFilter.includes(p) ? 'var(--terracotta)' : 'var(--border)',
                    background: priceFilter.includes(p) ? '#fff0ed' : 'transparent',
                    color: priceFilter.includes(p) ? 'var(--terracotta)' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: '150ms',
                  }}
                >{p}</button>
              ))}
            </div>
          </div>

          {/* Rating filter */}
          <div style={{ marginTop: '0.65rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Min Rating
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[0, 3, 3.5, 4, 4.5].map(v => (
                <button
                  key={v}
                  onClick={() => setMinRating(v)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 99,
                    border: '1.5px solid',
                    borderColor: minRating === v ? 'var(--terracotta)' : 'var(--border)',
                    background: minRating === v ? '#fff0ed' : 'transparent',
                    color: minRating === v ? 'var(--terracotta)' : 'var(--text-muted)',
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: '150ms',
                  }}
                >{v === 0 ? 'Any' : `${v}★+`}</button>
              ))}
            </div>
          </div>

          {/* Count + clear */}
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!loading && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {filtered.length} place{filtered.length !== 1 ? 's' : ''}
              </div>
            )}
            {hasFilters && (
              <button
                onClick={() => { setPriceFilter([]); setMinRating(0) }}
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--terracotta)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >Clear filters</button>
            )}
          </div>
        </div>

        <RestaurantList
          restaurants={filtered}
          selectedId={selected?.RESTAURANT_ID}
          onSelect={handleSelect}
          loading={loading}
        />
      </aside>

      <div className="map-container">
        <MapView
          restaurants={filtered}
          selectedId={selected?.RESTAURANT_ID}
          onMarkerClick={handleSelect}
        />

        {selected && (
          <DetailPanel
            restaurant={selected}
            onClose={() => setSelected(null)}
            onFavorite={handleFavorite}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  )
}
