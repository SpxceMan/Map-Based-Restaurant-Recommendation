import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthModal({ onClose, showToast }) {
  const { login, register } = useAuth()
  const [screen, setScreen] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER', license_number: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (screen === 'login') {
        await login(form.email, form.password)
        showToast('Welcome back!')
        onClose()
      } else {
        if (!form.username.trim()) return showToast('Username is required', 'error')
        if (form.role === 'OWNER' && !form.license_number.trim()) {
          return showToast('License number is required for owner accounts', 'error')
        }
        const msg = await register(form.username, form.email, form.password, form.role, form.license_number)
        showToast(msg || 'Account created!')
        if (form.role === 'OWNER') {
          // Don't switch to login — owner needs approval first
          onClose()
        } else {
          setScreen('login')
          setForm({ username: '', email: '', password: '', role: 'USER', license_number: '' })
        }
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const switchScreen = (s) => {
    setForm({ username: '', email: '', password: '', role: 'USER', license_number: '' })
    setScreen(s)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ marginBottom: '0.25rem' }}>
            {screen === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            {screen === 'login'
              ? 'Welcome back! Sign in to continue.'
              : 'Join to review and save restaurants.'}
          </p>
        </div>

        {/* Register-only: username */}
        {screen === 'register' && (
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="your_username"
              value={form.username}
              onChange={e => set('username', e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Register-only: account type */}
        {screen === 'register' && (
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {[
                { value: 'USER', label: '👤 Customer', desc: 'Browse, review & save' },
                { value: 'OWNER', label: '🏪 Owner', desc: 'List your restaurant' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('role', opt.value)}
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid',
                    borderColor: form.role === opt.value ? 'var(--terracotta)' : 'var(--border)',
                    background: form.role === opt.value ? '#fff0ed' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: '150ms',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: form.role === opt.value ? 'var(--terracotta)' : 'var(--text)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Owner-only: license number */}
        {screen === 'register' && form.role === 'OWNER' && (
          <div className="form-group">
            <label className="form-label">Business License Number *</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. LIC-BLR-2024-001"
              value={form.license_number}
              onChange={e => set('license_number', e.target.value)}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              ⓘ Your account will need admin approval before you can add restaurants.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? (screen === 'login' ? 'Signing in…' : 'Creating…')
              : (screen === 'login' ? 'Sign In' : 'Register')}
          </button>
        </div>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: '1.1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {screen === 'login' ? (
            <>No account?{' '}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--terracotta)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                onClick={() => switchScreen('register')}
              >Register</button>
            </>
          ) : (
            <>Already have one?{' '}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--terracotta)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                onClick={() => switchScreen('login')}
              >Sign in</button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
