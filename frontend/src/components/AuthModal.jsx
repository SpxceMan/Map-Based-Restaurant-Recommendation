import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthModal({ onClose, showToast }) {
  const { login, register } = useAuth()
  const [screen, setScreen] = useState('choose')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (screen === 'admin-login' || screen === 'user-login') {
        await login(form.email, form.password)
        showToast('Welcome back!')
        onClose()
      } else if (screen === 'user-register') {
        await register(form.username, form.email, form.password)
        showToast('Account created! Please sign in.')
        setScreen('user-login')
        setForm({ username: '', email: '', password: '' })
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const back = () => {
    setForm({ username: '', email: '', password: '' })
    setScreen('choose')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        {screen === 'choose' && (
          <>
            <h2 style={{ marginBottom: '0.25rem' }}>Sign In</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Choose how you want to sign in
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => setScreen('admin-login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: 'var(--charcoal)', color: 'var(--cream)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'opacity var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--terracotta)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0
                }}>🛡️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Admin</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.65, marginTop: 2 }}>Manage restaurants &amp; approve submissions</div>
                </div>
                <div style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '1.2rem' }}>›</div>
              </button>

              <button
                onClick={() => setScreen('user-login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: 'var(--cream-dark)', color: 'var(--text)',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--terracotta)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0
                }}>👤</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>User</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Browse, review and save restaurants</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '1.2rem' }}>›</div>
              </button>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {screen === 'admin-login' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--terracotta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
              }}>🛡️</div>
              <h2 style={{ margin: 0 }}>Admin Sign In</h2>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="admin@restaurant.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={back}>← Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
                style={{ background: 'var(--charcoal)', borderColor: 'var(--charcoal)' }}>
                {loading ? 'Signing in…' : 'Sign In as Admin'}
              </button>
            </div>
          </>
        )}

        {screen === 'user-login' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
              }}>👤</div>
              <h2 style={{ margin: 0 }}>User Sign In</h2>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={back}>← Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No account?{' '}
              <button style={{ background: 'none', border: 'none', color: 'var(--terracotta)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setScreen('user-register')}>Register</button>
            </div>
          </>
        )}

        {screen === 'user-register' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
              }}>👤</div>
              <h2 style={{ margin: 0 }}>Create Account</h2>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" type="text" placeholder="your_username"
                value={form.username} onChange={e => set('username', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setScreen('user-login')}>← Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating…' : 'Register'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already have one?{' '}
              <button style={{ background: 'none', border: 'none', color: 'var(--terracotta)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setScreen('user-login')}>Sign in</button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}