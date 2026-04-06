// STEP 5: shows avg_rating in each card (same data that popups display)
function StarRating({ rating, count }) {
  const r = parseFloat(rating) || 0
  const full = Math.round(r)
  const starStr = '★'.repeat(full) + '☆'.repeat(5 - full)

  if (r === 0) return (
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No reviews yet</span>
  )
  return (
    <div className="star-rating">
      <span style={{ color: 'var(--gold)', letterSpacing: '-1px', fontSize: '0.85rem' }}>{starStr}</span>
      <strong>{r.toFixed(1)}</strong>
      <span className="count">({count})</span>
    </div>
  )
}

export default function RestaurantList({ restaurants, selectedId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading restaurants…</span>
      </div>
    )
  }

  if (!restaurants.length) {
    return (
      <div className="empty-state">
        <div className="icon">🍽</div>
        <p>No restaurants found.</p>
      </div>
    )
  }

  return (
    <div className="restaurant-list">
      {restaurants.map(r => (
        <div
          key={r.RESTAURANT_ID}
          className={`restaurant-card ${selectedId === r.RESTAURANT_ID ? 'active' : ''}`}
          onClick={() => onSelect(r)}
        >
          <div className="card-top">
            <span className="card-name">{r.NAME}</span>
            <span className="price-badge">{r.PRICE_RANGE || '$$'}</span>
          </div>

          <div className="card-address" title={r.ADDRESS}>{r.ADDRESS}</div>

          <div className="card-footer">
            {/* STEP 5: avg_rating display */}
            <StarRating rating={r.AVG_RATING} count={r.REVIEW_COUNT} />
          </div>
        </div>
      ))}
    </div>
  )
}
