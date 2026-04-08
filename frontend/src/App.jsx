import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import AuthModal from './components/AuthModal'
import AddRestaurantModal from './components/AddRestaurantModal'
import AdminInvitePopup from './components/AdminInvitePopup'

export default function App() {
  const { toast, show: showToast } = useToast()
  const [showAuth, setShowAuth] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  return (
    <AuthProvider>
      <div className="app-layout">
        <Navbar
          onLogin={() => setShowAuth(true)}
          onAddRestaurant={() => setShowAdd(true)}
        />

        <Routes>
          <Route path="/" element={<HomePage showToast={showToast} />} />
          <Route path="/admin" element={<AdminPage showToast={showToast} />} />
        </Routes>

        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} showToast={showToast} />
        )}

        {showAdd && (
          <AddRestaurantModal onClose={() => setShowAdd(false)} showToast={showToast} />
        )}

        {/* Persistent admin invite popup — shows until accepted/declined */}
        <AdminInvitePopup showToast={showToast} />

        {toast && (
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        )}
      </div>
    </AuthProvider>
  )
}
