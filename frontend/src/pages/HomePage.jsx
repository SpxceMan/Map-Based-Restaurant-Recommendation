import { useState, useEffect, useMemo, useCallback } from 'react'
import MapView from '../components/MapView'
import RestaurantList from '../components/RestaurantList'
import DetailPanel from '../components/DetailPanel'
import { useAuth } from '../hooks/useAuth'
import { userService, eventService } from '../services/api'

const API = '/api/restaurants'
const PRICES = ['$', '$$', '$$$', '$$$$']

export default function HomePage({ showToast }) {
  const { user } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [search, setSearch]           = useState('')
  const [priceFilter, setPriceFilter] = useState([])
  const [minRating, setMinRating]     = useState(0)
  const [cuisineFilter, setCuisineFilter] = useState([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [showEventsOnly, setShowEventsOnly] = useState(false)
  const [eventRestaurantIds, setEventRestaurantIds] = useState(new Set())

  const fetchRestaurants = () => {
    fetch(API)
      .then(r => r.json())
      .then(res => {
        if (res.success) setRestaurants(res.data)
        else showToast('Failed to load restaurants', 'error')
      })
      .catch(() => showToast('Cannot reach the server — is the backend running?', 'error'))
      .finally(() => setLoading(false))
  }

  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set())
      setShowFavoritesOnly(false)
      return
    }
    try {
      const res = await userService.getFavorites(user.USER_ID)
      const ids = (res.data || []).map(f => f.RESTAURANT_ID)
      setFavoriteIds(new Set(ids))
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
    }
  }, [user])

  useEffect(() => {
    fetchRestaurants()
    // Fetch events to know which restaurants have upcoming events
    eventService.getAll()
      .then(res => {
        const ids = new Set((res.data || []).map(e => e.RESTAURANT_ID))
        setEventRestaurantIds(ids)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  // Collect all unique cuisines from loaded data
  const allCuisines = useMemo(() => {
    const set = new Set()
    restaurants.forEach(r => (r.CUISINES || []).forEach(c => set.add(c)))
    return [...set].sort()
  }, [restaurants])

  const togglePrice = (p) =>
    setPriceFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const toggleCuisine = (c) =>
    setCuisineFilter(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return restaurants.filter(r => {
      if (q && !r.NAME.toLowerCase().includes(q) && !(r.ADDRESS || '').toLowerCase().includes(q)) return false
      if (priceFilter.length > 0 && !priceFilter.includes(r.PRICE_RANGE)) return false
      if (minRating > 0 && parseFloat(r.AVG_RATING) < minRating) return false
      if (cuisineFilter.length > 0) {
        const rCuisines = r.CUISINES || []
        if (!cuisineFilter.some(c => rCuisines.includes(c))) return false
      }
      if (showFavoritesOnly && !favoriteIds.has(r.RESTAURANT_ID)) return false
      if (showEventsOnly && !eventRestaurantIds.has(r.RESTAURANT_ID)) return false
      return true
    })
  }, [restaurants, search, priceFilter, minRating, cuisineFilter, showFavoritesOnly, favoriteIds, showEventsOnly, eventRestaurantIds])

  const handleSelect = (r) =>
    setSelected(prev => prev?.RESTAURANT_ID === r.RESTAURANT_ID ? null : r)

  const handleFavorite = async (restaurantId) => {
    if (!user) return showToast('Sign in to save favourites', 'error')
    try {
      await userService.addFavorite(user.USER_ID, restaurantId)
      showToast('Saved to favourites ♡')
      // Update favorites set in real time
      setFavoriteIds(prev => new Set([...prev, restaurantId]))
    } catch (err) {
      if (err.message?.toLowerCase().includes('already')) {
        showToast('Already in your favourites', 'error')
      } else {
        showToast(err.message || 'Could not save favourite', 'error')
      }
    }
  }

  // Re-fetch restaurant list so ratings in sidebar update in real time
  const handleRatingUpdate = (restaurantId) => {
    fetch(API)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setRestaurants(res.data)
          // Update the selected restaurant too
          const updated = res.data.find(r => r.RESTAURANT_ID === restaurantId)
          if (updated) setSelected(updated)
        }
      })
      .catch(() => {})
  }

  const hasFilters = priceFilter.length > 0 || minRating > 0 || cuisineFilter.length > 0 || showFavoritesOnly || showEventsOnly

  const clearAll = () => { setPriceFilter([]); setMinRating(0); setCuisineFilter([]); setShowFavoritesOnly(false); setShowEventsOnly(false) }

  const chipStyle = (active) => ({
    padding: '3px 10px',
    borderRadius: 99,
    border: '1.5px solid',
    borderColor: active ? 'var(--terracotta)' : 'var(--border)',
    background: active ? '#fff0ed' : 'transparent',
    color: active ? 'var(--terracotta)' : 'var(--text-muted)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: '150ms',
    whiteSpace: 'nowrap',
  })

  const favChipStyle = (active) => ({
    padding: '3px 10px',
    borderRadius: 99,
    border: '1.5px solid',
    borderColor: active ? '#e74c3c' : 'var(--border)',
    background: active ? '#fdf2f0' : 'transparent',
    color: active ? '#e74c3c' : 'var(--text-muted)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: '150ms',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  })

  const sectionLabel = {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-muted)',
    marginBottom: '0.35rem',
  }

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

          {/* Favorites filter - only show when logged in */}
          {user && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowFavoritesOnly(v => !v)}
                style={favChipStyle(showFavoritesOnly)}
              >
                {showFavoritesOnly ? '♥' : '♡'} Favourites{favoriteIds.size > 0 ? ` (${favoriteIds.size})` : ''}
              </button>
              {eventRestaurantIds.size > 0 && (
                <button
                  onClick={() => setShowEventsOnly(v => !v)}
                  style={chipStyle(showEventsOnly)}
                >
                  📅 Has Events ({eventRestaurantIds.size})
                </button>
              )}
            </div>
          )}
          {/* Events filter for non-logged-in users */}
          {!user && eventRestaurantIds.size > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => setShowEventsOnly(v => !v)}
                style={chipStyle(showEventsOnly)}
              >
                📅 Has Events ({eventRestaurantIds.size})
              </button>
            </div>
          )}

          {/* Price filter */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={sectionLabel}>Price</div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {PRICES.map(p => (
                <button key={p} onClick={() => togglePrice(p)} style={chipStyle(priceFilter.includes(p))}>{p}</button>
              ))}
            </div>
          </div>

          {/* Rating filter */}
          <div style={{ marginTop: '0.65rem' }}>
            <div style={sectionLabel}>Min Rating</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[0, 3, 3.5, 4, 4.5].map(v => (
                <button key={v} onClick={() => setMinRating(v)} style={chipStyle(minRating === v)}>
                  {v === 0 ? 'Any' : `${v}★+`}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine filter */}
          {allCuisines.length > 0 && (
            <div style={{ marginTop: '0.65rem' }}>
              <div style={sectionLabel}>Cuisine</div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {allCuisines.map(c => (
                  <button key={c} onClick={() => toggleCuisine(c)} style={chipStyle(cuisineFilter.includes(c))}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Count + clear */}
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!loading && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {filtered.length} place{filtered.length !== 1 ? 's' : ''}
              </div>
            )}
            {hasFilters && (
              <button onClick={clearAll} style={{
                fontSize: '0.72rem', color: 'var(--terracotta)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
              }}>Clear filters</button>
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
            onRatingUpdate={handleRatingUpdate}
          />
        )}
      </div>
    </div>
  )
}
