import { useState, useEffect, useCallback } from 'react'
import { reviewService, eventService } from '../services/api'
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

function StarDisplay({ rating }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="star-display">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star-icon ${n <= full ? 'filled' : n === full + 1 && half ? 'half' : 'empty'}`}
        >★</span>
      ))}
    </span>
  )
}

function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function DetailPanel({ restaurant, onClose, onFavorite, showToast, onRatingUpdate }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [liveAvgRating, setLiveAvgRating] = useState(0)
  const [liveReviewCount, setLiveReviewCount] = useState(0)
  const [events, setEvents] = useState([])

  // Fetch reviews when restaurant changes
  const fetchReviews = useCallback(async () => {
    if (!restaurant) return
    setLoadingReviews(true)
    try {
      const res = await reviewService.getByRestaurant(restaurant.RESTAURANT_ID)
      const reviewData = res.data || []
      setReviews(reviewData)

      // Recalculate average rating from fetched reviews
      if (reviewData.length > 0) {
        const avg = reviewData.reduce((sum, r) => sum + Number(r.RATING), 0) / reviewData.length
        setLiveAvgRating(Math.round(avg * 10) / 10)
        setLiveReviewCount(reviewData.length)
      } else {
        setLiveAvgRating(restaurant.AVG_RATING || 0)
        setLiveReviewCount(restaurant.REVIEW_COUNT || 0)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoadingReviews(false)
    }
  }, [restaurant])

  useEffect(() => {
    fetchReviews()
    // Fetch events
    if (restaurant) {
      eventService.getByRestaurant(restaurant.RESTAURANT_ID)
        .then(res => setEvents(res.data || []))
        .catch(() => setEvents([]))
    }
  }, [fetchReviews])

  if (!restaurant) return null

  const handleReviewSubmit = async () => {
    if (!user) return showToast('Sign in to leave a review', 'error')
    if (!rating) return showToast('Please select a star rating', 'error')

    setSubmitting(true)
    try {
      await reviewService.submit({
        restaurant_id: restaurant.RESTAURANT_ID,
        rating,
        comment,
      })
      showToast('Review published! 🎉')
      setRating(0)
      setComment('')
      setShowReviewForm(false)

      // Re-fetch reviews to update the list and rating in real time
      await fetchReviews()

      // Notify parent to update the restaurant list rating
      if (onRatingUpdate) {
        onRatingUpdate(restaurant.RESTAURANT_ID)
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const priceMap = { '$': 'Budget', '$$': 'Moderate', '$$$': 'Upscale', '$$$$': 'Fine Dining' }

  const displayRating = liveReviewCount > 0 ? liveAvgRating : (restaurant.AVG_RATING || 0)
  const displayCount = liveReviewCount > 0 ? liveReviewCount : (restaurant.REVIEW_COUNT || 0)

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
          <strong>{displayRating > 0 ? displayRating : 'No ratings'}</strong>
          {displayCount > 0 && (
            <span className="count">({displayCount} review{displayCount !== 1 ? 's' : ''})</span>
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

      {/* Events Section */}
      {events.length > 0 && (
        <div className="events-section">
          <h4 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-display)' }}>📅 Events</h4>
          {events.filter(e => e.STATUS === 'UPCOMING' || e.STATUS === 'ONGOING').map(event => (
            <div key={event.EVENT_ID} className="event-card">
              <div className="event-card-header">
                <span className="event-name">{event.EVENT_NAME}</span>
                <span className={`event-status-badge ${event.STATUS.toLowerCase()}`}>{event.STATUS}</span>
              </div>
              <div className="event-date">
                📅 {new Date(event.EVENT_DATE).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              {event.DESCRIPTION && (
                <p className="event-desc">{event.DESCRIPTION}</p>
              )}
            </div>
          ))}
        </div>
      )}

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

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h4>Reviews</h4>
          {displayCount > 0 && (
            <span className="reviews-avg-badge">
              ★ {displayRating} <span className="avg-label">avg</span>
            </span>
          )}
        </div>

        {loadingReviews && (
          <div className="reviews-loading">
            <div className="spinner" style={{ width: 20, height: 20 }}></div>
            <span>Loading reviews…</span>
          </div>
        )}

        {!loadingReviews && reviews.length === 0 && (
          <div className="reviews-empty">
            <span className="reviews-empty-icon">💬</span>
            <span>No reviews yet. Be the first to share your experience!</span>
          </div>
        )}

        {!loadingReviews && reviews.length > 0 && (
          <div className="reviews-list">
            {reviews.map((review, idx) => (
              <div
                key={review.REVIEW_ID || idx}
                className="review-card"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="review-card-header">
                  <div className="review-user-info">
                    <div className="review-avatar">
                      {(review.USERNAME || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="review-username">{review.USERNAME}</div>
                      <div className="review-date">{timeAgo(review.CREATED_AT)}</div>
                    </div>
                  </div>
                  <div className="review-rating-badge">
                    <StarDisplay rating={Number(review.RATING)} />
                    <span className="review-rating-num">{review.RATING}</span>
                  </div>
                </div>
                {review.REVIEW_COMMENT && (
                  <p className="review-text">{review.REVIEW_COMMENT}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
