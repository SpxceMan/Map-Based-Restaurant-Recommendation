import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/api'

export default function AdminInvitePopup({ showToast }) {
  const { user, updateUser } = useAuth()
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || user.ROLE !== 'USER') {
      setInvite(null)
      return
    }
    // Check for pending invites
    userService.getMyInvites()
      .then(res => {
        if (res.data && res.data.length > 0) {
          setInvite(res.data[0]) // show the latest pending invite
        }
      })
      .catch(() => {}) // silently fail
  }, [user])

  if (!invite) return null

  const handleAccept = async () => {
    setLoading(true)
    try {
      const res = await userService.acceptInvite(invite.INVITE_ID)
      updateUser(res.data, res.token)
      setInvite(null)
      showToast('🛡️ You are now an admin!')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    setLoading(true)
    try {
      await userService.declineInvite(invite.INVITE_ID)
      setInvite(null)
      showToast('Invite declined')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛡️</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Admin Invitation</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          <strong>{invite.INVITED_BY_NAME}</strong> has invited you to become an admin.
          You'll be able to approve restaurants, manage owners, and moderate the platform.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            className="btn btn-ghost"
            onClick={handleDecline}
            disabled={loading}
          >
            Decline
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAccept}
            disabled={loading}
            style={{ minWidth: 120 }}
          >
            {loading ? 'Processing…' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}
