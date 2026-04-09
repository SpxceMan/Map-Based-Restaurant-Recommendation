import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Response interceptor
api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

export const restaurantService = {
  getAll: () => api.get('/restaurants'),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
}

export const reviewService = {
  submit: (data) => api.post('/reviews', data),
  getByRestaurant: (id) => api.get(`/reviews/restaurant/${id}`),
}

export const userService = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getFavorites: (id) => api.get(`/users/${id}/favorites`),
  addFavorite: (userId, restaurantId) =>
    api.post(`/users/${userId}/favorites`, { restaurant_id: restaurantId }),
  getMyInvites: () => api.get('/users/me/invites'),
  acceptInvite: (inviteId) => api.put(`/users/me/invites/${inviteId}/accept`),
  declineInvite: (inviteId) => api.put(`/users/me/invites/${inviteId}/decline`),
}

export const eventService = {
  getAll: () => api.get('/events'),
  getByRestaurant: (id) => api.get(`/events/restaurant/${id}`),
  create: (data) => api.post('/events', data),
  delete: (id) => api.delete(`/events/${id}`),
}

export const adminService = {
  // Restaurants
  getPending: () => api.get('/admin/pending'),
  getActiveRestaurants: () => api.get('/admin/restaurants/active'),
  approve: (id) => api.put(`/admin/restaurants/${id}/approve`),
  reject: (id) => api.put(`/admin/restaurants/${id}/reject`),
  delete: (id) => api.delete(`/admin/restaurants/${id}`),
  // Owners
  getPendingOwners: () => api.get('/admin/owners/pending'),
  getActiveOwners: () => api.get('/admin/owners/active'),
  approveOwner: (id) => api.put(`/admin/owners/${id}/approve`),
  rejectOwner: (id) => api.put(`/admin/owners/${id}/reject`),
  deleteOwner: (id) => api.delete(`/admin/owners/${id}`),
  // Update requests
  getUpdateRequests: () => api.get('/admin/update-requests'),
  approveUpdate: (id) => api.put(`/admin/update-requests/${id}/approve`),
  rejectUpdate: (id) => api.put(`/admin/update-requests/${id}/reject`),
  // Admin invites & Users
  getUsers: () => api.get('/admin/users'), // for invites
  getAllUsers: () => api.get('/admin/users/all'), // for management
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  sendInvite: (userId) => api.post('/admin/invites', { user_id: userId }),
  getInvites: () => api.get('/admin/invites'),
}

export default api
