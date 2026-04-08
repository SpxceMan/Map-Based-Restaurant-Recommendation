import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar({ onAddRestaurant, onLogin }) {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo-icon">🍽</div>
        <span className="navbar-title">Restaurant<span>Map</span></span>
      </Link>

      <div className="navbar-actions">
        {user ? (
          <>
            <span className="navbar-user">
              {user.ROLE === 'ADMIN' ? '🛡️' : user.ROLE === 'OWNER' ? '🏪' : '👤'} {user.USERNAME}
            </span>
            {/* Admin dashboard link - only for ADMIN */}
            {user.ROLE === 'ADMIN' && (
              <Link to="/admin" className="btn btn-outline btn-sm">Admin Panel</Link>
            )}
            {/* Add restaurant - only for approved OWNER */}
            {user.ROLE === 'OWNER' && user.STATUS === 'APPROVED' && (
              <button className="btn btn-primary btn-sm" onClick={onAddRestaurant}>
                + Add Restaurant
              </button>
            )}
            {/* Pending owner indicator */}
            {user.ROLE === 'OWNER' && user.STATUS === 'PENDING' && (
              <span className="btn btn-outline btn-sm" style={{ 
                cursor: 'default', opacity: 0.7, 
                borderColor: 'var(--gold)', color: 'var(--gold)' 
              }}>
                ⏳ Pending Approval
              </span>
            )}
            <button className="btn btn-outline btn-sm" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <button className="btn btn-outline btn-sm" onClick={onLogin}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  )
}
