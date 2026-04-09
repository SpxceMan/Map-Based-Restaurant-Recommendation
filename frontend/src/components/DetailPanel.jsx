import { useState, useEffect, useCallback } from 'react'
import { reviewService, eventService, restaurantService } from '../services/api'
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
  
  // Review state
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  
  const [liveAvgRating, setLiveAvgRating] = useState(0)
  const [liveReviewCount, setLiveReviewCount] = useState(0)
  const [events, setEvents] = useState([])

  // Restaurant Edit State
  const [editingRestaurant, setEditingRestaurant] = useState(false)
  const [restForm, setRestForm] = useState({})
  
  // Event state
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEventId, setEditingEventId] = useState(null)
  const [eventForm, setEventForm] = useState({ event_name: '', description: '', event_date: '', status: 'UPCOMING' })

  const isOwner = user && user.ROLE === 'OWNER' && user.USER_ID === restaurant.ADDED_BY

  useEffect(() => {
    if (restaurant) {
      setRestForm({
        name: restaurant.NAME || '',
        address: restaurant.ADDRESS || '',
        phone: restaurant.PHONE || '',
        website: restaurant.WEBSITE || '',
        price_range: restaurant.PRICE_RANGE || '$$'
      })
    }
  }, [restaurant])

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (!restaurant) return
    setLoadingReviews(true)
    try {
      const res = await reviewService.getByRestaurant(restaurant.RESTAURANT_ID)
      const reviewData = res.data || []
      setReviews(reviewData)
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

  const fetchEvents = useCallback(async () => {
    if (!restaurant) return
    try {
      const res = await eventService.getByRestaurant(restaurant.RESTAURANT_ID)
      setEvents(res.data || [])
    } catch (err) {
      setEvents([])
    }
  }, [restaurant])

  useEffect(() => {
    fetchReviews()
    fetchEvents()
  }, [fetchReviews, fetchEvents])

  if (!restaurant) return null

  // ---- Submissions ----

  const handleReviewSubmit = async () => {
    if (!user) return showToast('Sign in to leave a review', 'error')
    if (!rating) return showToast('Please select a star rating', 'error')

    setSubmitting(true)
    try {
      await reviewService.submit({ restaurant_id: restaurant.RESTAURANT_ID, rating, comment })
      showToast('Review published! 🎉')
      setRating(0)
      setComment('')
      setShowReviewForm(false)
      await fetchReviews()
      if (onRatingUpdate) onRatingUpdate(restaurant.RESTAURANT_ID)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestaurantUpdate = async () => {
    setSubmitting(true)
    try {
      const res = await restaurantService.update(restaurant.RESTAURANT_ID, restForm)
      showToast(res.message || 'Update requests submitted!')
      setEditingRestaurant(false)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEventSubmit = async () => {
    if (!eventForm.event_name || !eventForm.event_date) return showToast('Name and Date are required', 'error')
    setSubmitting(true)
    try {
      if (editingEventId) {
        await eventService.update(editingEventId, eventForm)
        showToast('Event updated successfully!')
      } else {
        await eventService.create({ ...eventForm, restaurant_id: restaurant.RESTAURANT_ID })
        showToast('Event created successfully!')
      }
      setShowAddEvent(false)
      setEditingEventId(null)
      fetchEvents()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try {
      await eventService.delete(id)
      showToast('Event deleted')
      fetchEvents()
    } catch(err) {
      showToast(err.message, 'error')
    }
  }

  const openEditEvent = (ev) => {
    setEventForm({
      event_name: ev.EVENT_NAME,
      description: ev.DESCRIPTION || '',
      event_date: ev.EVENT_DATE.split('T')[0],
      status: ev.STATUS
    })
    setEditingEventId(ev.EVENT_ID)
    setShowAddEvent(true)
  }

  const displayRating = liveReviewCount > 0 ? liveAvgRating : (restaurant.AVG_RATING || 0)
  const displayCount = liveReviewCount > 0 ? liveReviewCount : (restaurant.REVIEW_COUNT || 0)

  return (
    <div className="detail-panel">
      <button className="detail-close" onClick={onClose}>✕</button>

      {/* --- RESTAURANT INFO / EDIT --- */}
      {!editingRestaurant ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="detail-name">
              {restaurant.NAME}
              {restaurant.STATUS === 'PENDING' && <span style={{fontSize:'0.6em', background:'#ffedd5', color:'#c2410c', padding:'2px 6px', borderRadius:4, marginLeft:8, verticalAlign:'middle'}}>PENDING</span>}
            </div>
            {isOwner && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingRestaurant(true)}>
                ✎ Edit
              </button>
            )}
          </div>
          <div className="detail-address">📍 {restaurant.ADDRESS}</div>

          <div className="detail-meta">
            <span className="price-badge">{restaurant.PRICE_RANGE}</span>
            <div className="star-rating">
              <span>★</span>
              <strong>{displayRating > 0 ? displayRating : 'No ratings'}</strong>
              {displayCount > 0 && <span className="count">({displayCount})</span>}
            </div>
          </div>

          {restaurant.PHONE && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📞 {restaurant.PHONE}</div>}
          {restaurant.WEBSITE && <div style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>🌐 <a href={restaurant.WEBSITE} target="_blank" rel="noreferrer" style={{ color: 'var(--terracotta)' }}>{restaurant.WEBSITE}</a></div>}
        </>
      ) : (
        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Edit Request</h4>
          <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'1rem' }}>Changes will be submitted to the admin queue.</p>
          
          <input className="form-input" style={{marginBottom:'0.5rem'}} placeholder="Name" value={restForm.name} onChange={e=>setRestForm({...restForm, name: e.target.value})} />
          <input className="form-input" style={{marginBottom:'0.5rem'}} placeholder="Address" value={restForm.address} onChange={e=>setRestForm({...restForm, address: e.target.value})} />
          <input className="form-input" style={{marginBottom:'0.5rem'}} placeholder="Phone" value={restForm.phone} onChange={e=>setRestForm({...restForm, phone: e.target.value})} />
          <input className="form-input" style={{marginBottom:'0.5rem'}} placeholder="Website" value={restForm.website} onChange={e=>setRestForm({...restForm, website: e.target.value})} />
          <select className="form-select" style={{marginBottom:'1rem'}} value={restForm.price_range} onChange={e=>setRestForm({...restForm, price_range: e.target.value})}>
            <option value="$">$</option><option value="$$">$$</option><option value="$$$">$$$</option><option value="$$$$">$$$$</option>
          </select>
          
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handleRestaurantUpdate} disabled={submitting}>Submit Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditingRestaurant(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* --- ACTION BUTTONS --- */}
      <div className="detail-actions" style={{ marginTop: '1rem' }}>
        {user && user.ROLE === 'USER' && (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => setShowReviewForm(v => !v)}>✍ Review</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onFavorite(restaurant.RESTAURANT_ID)}>♡ Save</button>
          </>
        )}
        {!user && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sign in to review or save</span>}
      </div>

      {/* --- EVENTS SECTION --- */}
      <div className="events-section" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>📅 Events</h4>
          {isOwner && !showAddEvent && (
            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }} onClick={() => {
              setEventForm({ event_name: '', description: '', event_date: '', status: 'UPCOMING' });
              setEditingEventId(null);
              setShowAddEvent(true);
            }}>+ Add Event</button>
          )}
        </div>

        {showAddEvent && (
          <div style={{ background: '#f5f0eb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border)' }}>
            <h5 style={{ margin: '0 0 0.5rem 0' }}>{editingEventId ? 'Edit Event' : 'New Event'}</h5>
            <input className="form-input" style={{marginBottom:'0.5rem'}} placeholder="Event Name" value={eventForm.event_name} onChange={e=>setEventForm({...eventForm, event_name: e.target.value})} />
            <input className="form-input" style={{marginBottom:'0.5rem'}} type="date" value={eventForm.event_date} onChange={e=>setEventForm({...eventForm, event_date: e.target.value})} />
            {editingEventId && (
              <select className="form-select" style={{marginBottom:'0.5rem'}} value={eventForm.status} onChange={e=>setEventForm({...eventForm, status: e.target.value})}>
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            )}
            <textarea className="form-textarea" style={{marginBottom:'0.5rem'}} rows={2} placeholder="Description" value={eventForm.description} onChange={e=>setEventForm({...eventForm, description: e.target.value})} />
            <div style={{ display:'flex', gap:'0.4rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleEventSubmit} disabled={submitting}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddEvent(false)}>Cancel</button>
            </div>
          </div>
        )}

        {events.filter(e => isOwner || e.STATUS === 'UPCOMING' || e.STATUS === 'ONGOING').map(event => (
          <div key={event.EVENT_ID} className="event-card">
            <div className="event-card-header">
              <span className="event-name">{event.EVENT_NAME}</span>
              <span className={`event-status-badge ${event.STATUS.toLowerCase()}`}>{event.STATUS}</span>
            </div>
            <div className="event-date">
              📅 {new Date(event.EVENT_DATE).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {event.DESCRIPTION && <p className="event-desc">{event.DESCRIPTION}</p>}
            
            {isOwner && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-ghost btn-sm" style={{fontSize:'0.7rem', padding:'2px 8px'}} onClick={() => openEditEvent(event)}>Edit</button>
                <button className="btn btn-danger btn-sm" style={{fontSize:'0.7rem', padding:'2px 8px'}} onClick={() => handleDeleteEvent(event.EVENT_ID)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- REVIEW FORM --- */}
      {showReviewForm && (
        <div className="review-form">
          <h4>Leave a Review</h4>
          <div className="form-group">
            <label className="form-label">Rating</label>
            <StarSelector value={rating} onChange={setRating} />
          </div>
          <div className="form-group">
            <label className="form-label">Comment (optional)</label>
            <textarea className="form-textarea" rows={2} placeholder="What did you think?" value={comment} onChange={e => setComment(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handleReviewSubmit} disabled={submitting}>Submit</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowReviewForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* --- REVIEWS LIST --- */}
      <div className="reviews-section">
        <div className="reviews-header">
          <h4>Reviews</h4>
        </div>
        {loadingReviews && <div className="spinner" style={{ width: 20, height: 20 }}></div>}
        {!loadingReviews && reviews.map((review, idx) => (
          <div key={review.REVIEW_ID || idx} className="review-card">
            <div className="review-card-header">
              <div className="review-user-info">
                <div className="review-avatar">{(review.USERNAME || 'U').charAt(0).toUpperCase()}</div>
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
            {review.REVIEW_COMMENT && <p className="review-text">{review.REVIEW_COMMENT}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
