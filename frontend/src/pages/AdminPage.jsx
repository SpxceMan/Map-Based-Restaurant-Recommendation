import { useState, useEffect } from 'react'
import { adminService } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AdminPage({ showToast }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('owners')
  const [loading, setLoading] = useState(true)

  // Data states
  const [pendingOwners, setPendingOwners] = useState([])
  const [activeOwners, setActiveOwners] = useState([])
  const [pendingRestaurants, setPendingRestaurants] = useState([])
  const [activeRestaurants, setActiveRestaurants] = useState([])
  const [updateRequests, setUpdateRequests] = useState([])
  const [invites, setInvites] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    if (!user || user.ROLE !== 'ADMIN') { navigate('/'); return }
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ownRes, aOwnRes, restRes, aRestRes, urRes, invRes, usrRes, allUsrRes] = await Promise.all([
        adminService.getPendingOwners(),
        adminService.getActiveOwners(),
        adminService.getPending(),
        adminService.getActiveRestaurants(),
        adminService.getUpdateRequests(),
        adminService.getInvites(),
        adminService.getUsers(),
        adminService.getAllUsers()
      ])
      setPendingOwners(ownRes.data || [])
      setActiveOwners(aOwnRes.data || [])
      setPendingRestaurants(restRes.data || [])
      setActiveRestaurants(aRestRes.data || [])
      setUpdateRequests(urRes.data || [])
      setInvites(invRes.data || [])
      setAvailableUsers(usrRes.data || [])
      setAllUsers(allUsrRes.data || [])
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Owner actions
  const handleApproveOwner = async (id) => {
    try { await adminService.approveOwner(id); showToast('Owner approved ✓'); fetchAll() }
    catch (err) { showToast(err.message, 'error') }
  }
  const handleRejectOwner = async (id) => {
    try { await adminService.rejectOwner(id); showToast('Owner rejected'); setPendingOwners(prev => prev.filter(o => o.USER_ID !== id)) }
    catch (err) { showToast(err.message, 'error') }
  }
  const handleDeleteOwner = async (id) => {
    if (!window.confirm('Delete this owner and all their restaurants?')) return
    try { await adminService.deleteOwner(id); showToast('Owner deleted'); fetchAll() }
    catch (err) { showToast(err.message, 'error') }
  }

  // Restaurant actions
  const handleApprove = async (id) => {
    try { await adminService.approve(id); showToast('Restaurant approved ✓'); fetchAll() }
    catch (err) { showToast(err.message, 'error') }
  }
  const handleReject = async (id) => {
    try { await adminService.reject(id); showToast('Restaurant rejected'); setPendingRestaurants(prev => prev.filter(r => r.RESTAURANT_ID !== id)) }
    catch (err) { showToast(err.message, 'error') }
  }
  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this restaurant?')) return
    try { await adminService.delete(id); showToast('Restaurant deleted'); fetchAll() }
    catch (err) { showToast(err.message, 'error') }
  }

  // User actions
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their data?')) return
    try { await adminService.deleteUser(id); showToast('User deleted'); fetchAll() }
    catch (err) { showToast(err.message, 'error') }
  }

  // Update request actions
  const handleApproveUpdate = async (id) => {
    try { await adminService.approveUpdate(id); showToast('Update applied ✓'); setUpdateRequests(prev => prev.filter(r => r.REQUEST_ID !== id)) }
    catch (err) { showToast(err.message, 'error') }
  }
  const handleRejectUpdate = async (id) => {
    try { await adminService.rejectUpdate(id); showToast('Update rejected'); setUpdateRequests(prev => prev.filter(r => r.REQUEST_ID !== id)) }
    catch (err) { showToast(err.message, 'error') }
  }

  // Invite actions
  const handleSendInvite = async (userId) => {
    try {
      await adminService.sendInvite(userId)
      showToast('Admin invite sent ✓')
      fetchAll()
    } catch (err) { showToast(err.message, 'error') }
  }

  const tabStyle = (active) => ({
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: '150ms',
    background: active ? 'var(--terracotta)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  })

  const badge = (count) => count > 0 ? (
    <span style={{ background: 'white', color: 'var(--terracotta)', borderRadius: 99, padding: '0 6px', fontSize: '0.72rem', marginLeft: 4, fontWeight: 700 }}>
      {count}
    </span>
  ) : null

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--cream)' }}>
      <div className="admin-page">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Admin Dashboard</h1>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Back to map</button>
        </div>

        {/* Stats row */}
        <div style={{
          background: 'var(--white)', borderRadius: 'var(--radius-md)',
          padding: '1rem 1.5rem', marginBottom: '1.5rem',
          border: '1px solid var(--border)', display: 'flex', gap: '2rem', flexWrap: 'wrap',
        }}>
          {[
            { n: pendingOwners.length, l: 'Pending Owners' },
            { n: pendingRestaurants.length, l: 'Pending Restaurants' },
            { n: updateRequests.length, l: 'Update Requests' },
            { n: allUsers.length, l: 'Total Users' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'var(--font-display)' }}>{s.n}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--cream-dark)', borderRadius: 'var(--radius-sm)', padding: '0.3rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button style={tabStyle(tab === 'owners')} onClick={() => setTab('owners')}>
            👤 Owners {badge(pendingOwners.length)}
          </button>
          <button style={tabStyle(tab === 'restaurants')} onClick={() => setTab('restaurants')}>
            🏪 Restaurants {badge(pendingRestaurants.length)}
          </button>
          <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>
            👥 Users
          </button>
          <button style={tabStyle(tab === 'updates')} onClick={() => setTab('updates')}>
            📝 Updates {badge(updateRequests.length)}
          </button>
          <button style={tabStyle(tab === 'invites')} onClick={() => setTab('invites')}>
            🛡️ Invites
          </button>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
        ) : (
          <>
            {/* ============ OWNERS TAB ============ */}
            {tab === 'owners' && (
              <>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--charcoal)' }}>
                  Pending Owner Accounts
                </h3>
                {pendingOwners.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem' }}><div className="icon">✅</div><p>No pending owners.</p></div>
                ) : (
                  <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>License No.</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingOwners.map(o => (
                          <tr key={o.USER_ID}>
                            <td><strong>{o.USERNAME}</strong></td>
                            <td>{o.EMAIL}</td>
                            <td><code style={{ background: '#f5f0eb', padding: '2px 6px', borderRadius: 4 }}>{o.LICENSE_NUMBER}</code></td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {o.CREATED_AT ? new Date(o.CREATED_AT).toLocaleDateString() : '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => handleApproveOwner(o.USER_ID)}>✓ Approve</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleRejectOwner(o.USER_ID)}>✕ Reject</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOwner(o.USER_ID)}>🗑</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', marginTop: '2.5rem', color: 'var(--charcoal)' }}>
                  Active Owners
                </h3>
                {activeOwners.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem' }}><p>No active owners.</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeOwners.map(o => (
                          <tr key={o.USER_ID}>
                            <td><strong>{o.USERNAME}</strong></td>
                            <td>{o.EMAIL}</td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {o.CREATED_AT ? new Date(o.CREATED_AT).toLocaleDateString() : '—'}
                            </td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOwner(o.USER_ID)}>🗑 Delete Owner</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ============ RESTAURANTS TAB ============ */}
            {tab === 'restaurants' && (
              <>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--charcoal)' }}>
                  Pending Restaurant Submissions
                </h3>
                {pendingRestaurants.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem' }}><div className="icon">✅</div><p>No pending restaurants.</p></div>
                ) : (
                  <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                    <table className="admin-table">
                      <thead>
                        <tr><th>Name</th><th>Address</th><th>Price</th><th>Submitted by</th><th>Date</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {pendingRestaurants.map(r => (
                          <tr key={r.RESTAURANT_ID}>
                            <td><strong>{r.NAME}</strong></td>
                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.ADDRESS}</td>
                            <td><span className="price-badge">{r.PRICE_RANGE}</span></td>
                            <td>{r.SUBMITTED_BY || '—'}</td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.CREATED_AT ? new Date(r.CREATED_AT).toLocaleDateString() : '—'}</td>
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

                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', marginTop: '2.5rem', color: 'var(--charcoal)' }}>
                  Active Restaurants
                </h3>
                {activeRestaurants.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem' }}><p>No active restaurants.</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr><th>Name</th><th>Address</th><th>Rating</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {activeRestaurants.map(r => (
                          <tr key={r.RESTAURANT_ID}>
                            <td><strong>{r.NAME}</strong></td>
                            <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.ADDRESS}</td>
                            <td><span style={{ color: 'var(--gold)' }}>★</span> {r.AVG_RATING}</td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.RESTAURANT_ID)}>🗑 Delete Restaurant</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ============ USERS TAB ============ */}
            {tab === 'users' && (
              <>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--charcoal)' }}>
                  Manage Active Users
                </h3>
                {allUsers.length === 0 ? (
                  <div className="empty-state"><div className="icon">👥</div><p>No active users.</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr><th>Username</th><th>Email</th><th>Registered</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {allUsers.map(u => (
                          <tr key={u.USER_ID}>
                            <td><strong>{u.USERNAME}</strong></td>
                            <td>{u.EMAIL}</td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.CREATED_AT ? new Date(u.CREATED_AT).toLocaleDateString() : '—'}</td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.USER_ID)}>🗑 Delete User</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ============ UPDATE REQUESTS TAB ============ */}
            {tab === 'updates' && (
              <>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--charcoal)' }}>
                  Restaurant Update Requests
                </h3>
                {updateRequests.length === 0 ? (
                  <div className="empty-state"><div className="icon">✅</div><p>No pending update requests.</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr><th>Restaurant</th><th>Owner</th><th>Field</th><th>Old Value</th><th>New Value</th><th>Date</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {updateRequests.map(r => (
                          <tr key={r.REQUEST_ID}>
                            <td><strong>{r.RESTAURANT_NAME}</strong></td>
                            <td>{r.OWNER_NAME}</td>
                            <td><code style={{ background: '#f5f0eb', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>{r.FIELD_NAME}</code></td>
                            <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#c0392b' }}>
                              {r.OLD_VALUE || '—'}
                            </td>
                            <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#27ae60', fontWeight: 600 }}>
                              {r.NEW_VALUE || '—'}
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.CREATED_AT ? new Date(r.CREATED_AT).toLocaleDateString() : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => handleApproveUpdate(r.REQUEST_ID)}>✓ Apply</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleRejectUpdate(r.REQUEST_ID)}>✕ Reject</button>
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

            {/* ============ ADMIN INVITES TAB ============ */}
            {tab === 'invites' && (
              <>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--charcoal)' }}>
                  Invite Users to Admin
                </h3>

                {/* Available users to invite */}
                {availableUsers.length > 0 && (
                  <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      Available Users
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {availableUsers.map(u => (
                        <div key={u.USER_ID} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)', background: '#fafaf8',
                        }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.USERNAME}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.EMAIL}</div>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ marginLeft: '0.5rem', padding: '2px 10px', fontSize: '0.75rem' }}
                            onClick={() => handleSendInvite(u.USER_ID)}
                          >
                            Send Invite
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {availableUsers.length === 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    No eligible users to invite. Users with existing pending invites are excluded.
                  </div>
                )}

                {/* Invite history */}
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Invite History
                </div>
                {invites.length === 0 ? (
                  <div className="empty-state"><div className="icon">📬</div><p>No invites sent yet.</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr><th>User</th><th>Email</th><th>Invited By</th><th>Status</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {invites.map(inv => (
                          <tr key={inv.INVITE_ID}>
                            <td><strong>{inv.INVITEE_NAME}</strong></td>
                            <td>{inv.INVITEE_EMAIL}</td>
                            <td>{inv.INVITED_BY_NAME}</td>
                            <td>
                              <span style={{
                                padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                background: inv.STATUS === 'PENDING' ? '#fff3cd' : inv.STATUS === 'ACCEPTED' ? '#d4edda' : '#f8d7da',
                                color: inv.STATUS === 'PENDING' ? '#856404' : inv.STATUS === 'ACCEPTED' ? '#155724' : '#721c24',
                              }}>
                                {inv.STATUS}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{inv.CREATED_AT ? new Date(inv.CREATED_AT).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
