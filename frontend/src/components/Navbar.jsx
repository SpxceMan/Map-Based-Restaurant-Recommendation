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
            <span className="navbar-user">👤 {user.USERNAME}</span>
            {user.ROLE === 'ADMIN' && (
              <Link to="/admin" className="btn btn-outline btn-sm">Admin</Link>
            )}
            {user.ROLE === 'ADMIN' && (
              <button className="btn btn-primary btn-sm" onClick={onAddRestaurant}>
                + Add
              </button>
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
