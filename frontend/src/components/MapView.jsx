import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Hardcoded user location: 100 Feet Road, Indiranagar, Bengaluru ──
const USER_LOCATION = { lat: 12.9784, lng: 77.6408, label: '100 Feet Rd, Indiranagar' }

// Marker icons
function makeIcon(color, size = 28) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50% 50% 50% 0;
      background:${color};
      border:2.5px solid #fff;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.28);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

// User location pulse icon
const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:20px;height:20px;">
    <div style="
      position:absolute;inset:0;
      border-radius:50%;
      background:rgba(59,130,246,0.25);
      animation:pulse 1.8s ease-out infinite;
    "></div>
    <div style="
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:12px;height:12px;
      border-radius:50%;
      background:#2563eb;
      border:2.5px solid #fff;
      box-shadow:0 1px 6px rgba(37,99,235,0.55);
    "></div>
    <style>@keyframes pulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.8);opacity:0}}</style>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -14],
})

const DEFAULT_ICON  = makeIcon('#3d3530', 28)
const SELECTED_ICON = makeIcon('#c0503a', 36)

function stars(rating) {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

export default function MapView({ restaurants, selectedId, onMarkerClick }) {
  const mapRef      = useRef(null)
  const instanceRef = useRef(null)
  const markersRef  = useRef({})

  // Init map once
  useEffect(() => {
    if (instanceRef.current) return

    instanceRef.current = L.map(mapRef.current, {
      center: [USER_LOCATION.lat, USER_LOCATION.lng],  // Indiranagar, Bengaluru
      zoom: 15,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instanceRef.current)

    // Add user location marker (static, always present)
    L.marker([USER_LOCATION.lat, USER_LOCATION.lng], { icon: USER_ICON, zIndexOffset: 2000 })
      .bindPopup(
        `<div style="font-family:'DM Sans',sans-serif;text-align:center;padding:4px 2px;">
           <div style="font-size:18px;margin-bottom:2px;">📍</div>
           <strong style="font-size:13px;color:#1e1a17;">You are here</strong>
           <div style="font-size:11px;color:#7a6a60;margin-top:2px;">${USER_LOCATION.label}</div>
         </div>`,
        { maxWidth: 180 }
      )
      .addTo(instanceRef.current)

    return () => {
      instanceRef.current?.remove()
      instanceRef.current = null
    }
  }, [])

  // Sync restaurant markers whenever list or selection changes
  useEffect(() => {
    const map = instanceRef.current
    if (!map) return

    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}

    restaurants.forEach(r => {
      if (r.LATITUDE == null || r.LONGITUDE == null) return

      const isSelected = r.RESTAURANT_ID === selectedId
      const marker = L.marker([r.LATITUDE, r.LONGITUDE], {
        icon: isSelected ? SELECTED_ICON : DEFAULT_ICON,
        zIndexOffset: isSelected ? 1000 : 0,
      })

      const avgRating  = parseFloat(r.AVG_RATING) || 0
      const starStr    = stars(avgRating)
      const ratingText = avgRating > 0
        ? `<span style="color:#d4a843;font-size:13px;">${starStr}</span>
           <strong style="color:#1e1a17;">${avgRating}</strong>
           <span style="color:#7a6a60;font-size:11px;">(${r.REVIEW_COUNT} reviews)</span>`
        : `<span style="color:#7a6a60;font-size:11px;">No reviews yet</span>`

      marker.bindPopup(
        `<div style="font-family:'DM Sans',sans-serif;min-width:160px;line-height:1.5;">
           <strong style="font-size:14px;color:#1e1a17;display:block;margin-bottom:4px;">
             ${r.NAME}
           </strong>
           <div style="margin-bottom:4px;">${ratingText}</div>
           <div style="display:flex;gap:6px;align-items:center;font-size:12px;color:#7a6a60;">
             <span style="background:#fef0ec;color:#c0503a;border-radius:99px;
                          padding:1px 8px;font-weight:600;border:1px solid #fcd5cc;">
               ${r.PRICE_RANGE || '$$'}
             </span>
             <span>${r.ADDRESS?.split(',').slice(-2).join(',').trim() || ''}</span>
           </div>
         </div>`,
        { maxWidth: 260 }
      )

      marker.on('click', () => {
        marker.openPopup()
        onMarkerClick && onMarkerClick(r)
      })

      marker.addTo(map)
      markersRef.current[r.RESTAURANT_ID] = marker
    })
  }, [restaurants, selectedId])

  // Pan to selected marker
  useEffect(() => {
    const map = instanceRef.current
    if (!map || !selectedId) return
    const r = restaurants.find(x => x.RESTAURANT_ID === selectedId)
    if (r?.LATITUDE && r?.LONGITUDE) {
      map.flyTo([r.LATITUDE, r.LONGITUDE], 16, { duration: 0.7 })
      markersRef.current[selectedId]?.openPopup()
    }
  }, [selectedId, restaurants])

  return <div ref={mapRef} className="map-wrapper" />
}
