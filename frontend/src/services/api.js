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
}

export const adminService = {
  getPending: () => api.get('/admin/pending'),
  approve: (id) => api.put(`/admin/restaurants/${id}/approve`),
  reject: (id) => api.put(`/admin/restaurants/${id}/reject`),
  delete: (id) => api.delete(`/admin/restaurants/${id}`),
}

export default api
