import { useState, useEffect } from 'react'
import { adminService } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AdminPage({ showToast }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.ROLE !== 'ADMIN') {
      navigate('/')
      return
    }
    fetchPending()
  }, [user])

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await adminService.getPending()
      setPending(res.data || [])
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
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleReject = async (id) => {
    try {
      await adminService.reject(id)
      showToast('Restaurant rejected')
      setPending(prev => prev.filter(r => r.RESTAURANT_ID !== id))
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this restaurant?')) return
    try {
      await adminService.delete(id)
      showToast('Restaurant deleted')
      setPending(prev => prev.filter(r => r.RESTAURANT_ID !== id))
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--cream)' }}>
      <div className="admin-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Admin Dashboard</h1>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Back to map</button>
        </div>

        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border)',
          display: 'flex',
          gap: '2rem',
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'var(--font-display)' }}>{pending.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Review</div>
          </div>
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--charcoal)' }}>
          Pending Restaurants
        </h3>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
        ) : pending.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <p>All caught up! No pending submissions.</p>
          </div>
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
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.ADDRESS}
                    </td>
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
      </div>
    </div>
  )
}
