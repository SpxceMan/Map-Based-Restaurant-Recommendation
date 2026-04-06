import { useState } from 'react'
import { reviewService } from '../services/api'
import { useAuth } from '../hooks/useAuth'

function StarSelector({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="star-selector">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= (hover || value) ? 'active' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >★</button>
      ))}
    </div>
  )
}

export default function DetailPanel({ restaurant, onClose, onFavorite, showToast }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  if (!restaurant) return null

  const handleReviewSubmit = async () => {
    if (!user) return showToast('Sign in to leave a review', 'error')
    if (!rating) return showToast('Please select a star rating', 'error')

    setSubmitting(true)
    try {
      await reviewService.submit({
        restaurant_id: restaurant.RESTAURANT_ID,
        user_id: user.USER_ID,
        rating,
        comment,
      })
      showToast('Review submitted!')
      setRating(0)
      setComment('')
      setShowReviewForm(false)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const priceMap = { '$': 'Budget', '$$': 'Moderate', '$$$': 'Upscale', '$$$$': 'Fine Dining' }

  return (
    <div className="detail-panel">
      <button className="detail-close" onClick={onClose}>✕</button>

      <div className="detail-name">{restaurant.NAME}</div>
      <div className="detail-address">📍 {restaurant.ADDRESS}</div>

      <div className="detail-meta">
        <span className="price-badge">{restaurant.PRICE_RANGE}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {priceMap[restaurant.PRICE_RANGE] || ''}
        </span>
        <div className="star-rating">
          <span>★</span>
          <strong>{restaurant.AVG_RATING > 0 ? restaurant.AVG_RATING : 'No ratings'}</strong>
          {restaurant.REVIEW_COUNT > 0 && (
            <span className="count">({restaurant.REVIEW_COUNT} reviews)</span>
          )}
        </div>
        <div className="cuisine-tags">
          {(restaurant.CUISINES || []).map(c => (
            <span key={c} className="cuisine-tag">{c}</span>
          ))}
        </div>
      </div>

      {restaurant.PHONE && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          📞 {restaurant.PHONE}
        </div>
      )}
      {restaurant.WEBSITE && (
        <div style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>
          🌐 <a href={restaurant.WEBSITE} target="_blank" rel="noreferrer"
               style={{ color: 'var(--terracotta)' }}>{restaurant.WEBSITE}</a>
        </div>
      )}

      <div className="detail-actions">
        {user && (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowReviewForm(v => !v)}
            >
              ✍ Review
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onFavorite(restaurant.RESTAURANT_ID)}
            >
              ♡ Save
            </button>
          </>
        )}
        {!user && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Sign in to review or save
          </span>
        )}
      </div>

      {showReviewForm && (
        <div className="review-form">
          <h4>Leave a Review</h4>
          <div className="form-group">
            <label className="form-label">Rating</label>
            <StarSelector value={rating} onChange={setRating} />
          </div>
          <div className="form-group">
            <label className="form-label">Comment (optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="What did you think?"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleReviewSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowReviewForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
