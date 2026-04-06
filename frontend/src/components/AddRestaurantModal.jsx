import { useState } from 'react'
import { restaurantService } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const CUISINES = ['Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Japanese', 'Thai', 'Mediterranean', 'South Indian', 'Fast Food']

export default function AddRestaurantModal({ onClose, showToast }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '', latitude: '', longitude: '', address: '',
    price_range: '$$', phone: '', website: '',
  })
  const [selectedCuisines, setSelectedCuisines] = useState([])
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleCuisine = (c) => {
    setSelectedCuisines(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const handleSubmit = async () => {
    const { name, latitude, longitude, address } = form
    if (!name || !latitude || !longitude || !address) {
      return showToast('Name, address, latitude and longitude are required', 'error')
    }
    if (isNaN(latitude) || isNaN(longitude)) {
      return showToast('Latitude and longitude must be valid numbers', 'error')
    }

    setLoading(true)
    try {
      await restaurantService.create({
        ...form,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        user_id: user?.USER_ID,
        cuisines: selectedCuisines,
      })
      showToast('Restaurant submitted for admin approval!')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2>Add a Restaurant</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Your submission will be reviewed by an admin before going live.
        </p>

        <div className="form-group">
          <label className="form-label">Restaurant Name *</label>
          <input className="form-input" placeholder="e.g. Hotel RRR" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Address *</label>
          <input className="form-input" placeholder="Full address" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Latitude *</label>
            <input className="form-input" type="number" step="any" placeholder="12.2958" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude *</label>
            <input className="form-input" type="number" step="any" placeholder="76.6394" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Price Range</label>
            <select className="form-select" value={form.price_range} onChange={e => set('price_range', e.target.value)}>
              <option value="$">$ – Budget</option>
              <option value="$$">$$ – Moderate</option>
              <option value="$$$">$$$ – Upscale</option>
              <option value="$$$$">$$$$ – Fine Dining</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="0821-123456" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Website</label>
          <input className="form-input" placeholder="https://..." value={form.website} onChange={e => set('website', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Cuisines</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {CUISINES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCuisine(c)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 99,
                  border: '1.5px solid',
                  borderColor: selectedCuisines.includes(c) ? 'var(--terracotta)' : 'var(--border)',
                  background: selectedCuisines.includes(c) ? '#fff0ed' : 'transparent',
                  color: selectedCuisines.includes(c) ? 'var(--terracotta)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: '200ms',
                }}
              >{c}</button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
