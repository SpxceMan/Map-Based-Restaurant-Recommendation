import { useState, useEffect } from 'react'
import { adminService } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AdminPage({ showToast }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('restaurants') // 'restaurants' | 'reviews'
  const [pending, setPending] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.ROLE !== 'ADMIN') { navigate('/'); return }
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [restRes, revRes] = await Promise.all([
        adminService.getPending(),
        adminService.getPendingReviews(),
      ])
      setPending(restRes.data || [])
      setPendingReviews(revRes.data || [])
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await adminService.approve(id)
      showToast('Restaurant approved ✓')
      setPending(prev => prev.filter(r => r.RESTAURANT_ID !== id))
    } catch (err) { showToast(err.message, 'error') }
  }

  const handleReject = async (id) => {
    try {
      await adminService.reject(id)
      showToast('Restaurant rejected')
      setPending(prev => prev.filter(r => r.RESTAURANT_ID !== id))
    } catch (err) { showToast(err.message, 'error') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this restaurant?')) return
    try {
      await adminService.delete(id)
      showToast('Restaurant deleted')
      setPending(prev => prev.filter(r => r.RESTAURANT_ID !== id))
    } catch (err) { showToast(err.message, 'error') }
  }

  const handleApproveReview = async (id) => {
    try {
      await adminService.approveReview(id)
      showToast('Review approved ✓')
      setPendingReviews(prev => prev.filter(r => r.REVIEW_ID !== id))
    } catch (err) { showToast(err.message, 'error') }
  }

  const handleRejectReview = async (id) => {
    try {
      await adminService.rejectReview(id)
      showToast('Review rejected')
      setPendingReviews(prev => prev.filter(r => r.REVIEW_ID !== id))
    } catch (err) { showToast(err.message, 'error') }
  }

  const tabStyle = (active) => ({
    padding: '0.5rem 1.25rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: '150ms',
    background: active ? 'var(--terracotta)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--cream)' }}>
      <div className="admin-page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Admin Dashboard</h1>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Back to map</button>
        </div>

        {/* Stats */}
        <div style={{
          background: 'var(--white)', borderRadius: 'var(--radius-md)',
          padding: '1rem 1.5rem', marginBottom: '1.5rem',
          border: '1px solid var(--border)', display: 'flex', gap: '3rem',
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'var(--font-display)' }}>
              {pending.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Restaurants</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'var(--font-display)' }}>
              {pendingReviews.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Reviews</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--cream-dark)', borderRadius: 'var(--radius-sm)', padding: '0.3rem', marginBottom: '1.25rem', width: 'fit-content' }}>
          <button style={tabStyle(tab === 'restaurants')} onClick={() => setTab('restaurants')}>
            🏪 Restaurants {pending.length > 0 && <span style={{ background: 'white', color: 'var(--terracotta)', borderRadius: 99, padding: '0 6px', fontSize: '0.75rem', marginLeft: 4 }}>{pending.length}</span>}
          </button>
          <button style={tabStyle(tab === 'reviews')} onClick={() => setTab('reviews')}>
            ✍️ Reviews {pendingReviews.length > 0 && <span style={{ background: 'white', color: 'var(--terracotta)', borderRadius: 99, padding: '0 6px', fontSize: '0.75rem', marginLeft: 4 }}>{pendingReviews.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
        ) : tab === 'restaurants' ? (
          <>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--charcoal)' }}>
              Pending Restaurant Submissions
            </h3>
            {pending.length === 0 ? (
              <div className="empty-state"><div className="icon">✅</div><p>No pending restaurants.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Price</th>
                      <th>Submitted by</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(r => (
                      <tr key={r.RESTAURANT_ID}>
                        <td><strong>{r.NAME}</strong></td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.ADDRESS}</td>
                        <td><span className="price-badge">{r.PRICE_RANGE}</span></td>
                        <td>{r.SUBMITTED_BY || '—'}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {r.CREATED_AT ? new Date(r.CREATED_AT).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r.RESTAURANT_ID)}>✓ Approve</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleReject(r.RESTAURANT_ID)}>✕ Reject</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.RESTAURANT_ID)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--charcoal)' }}>
              Pending Review Submissions
            </h3>
            {pendingReviews.length === 0 ? (
              <div className="empty-state"><div className="icon">✅</div><p>No pending reviews.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th>Reviewer</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReviews.map(r => (
                      <tr key={r.REVIEW_ID}>
                        <td><strong>{r.RESTAURANT_NAME}</strong></td>
                        <td>{r.REVIEWER}</td>
                        <td>
                          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{'★'.repeat(Math.round(r.RATING))}</span>
                          {' '}{r.RATING}
                        </td>
                        <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.REVIEW_TEXT || <em style={{ color: 'var(--text-muted)' }}>No comment</em>}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {r.CREATED_AT ? new Date(r.CREATED_AT).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleApproveReview(r.REVIEW_ID)}>✓ Approve</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleRejectReview(r.REVIEW_ID)}>✕ Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
