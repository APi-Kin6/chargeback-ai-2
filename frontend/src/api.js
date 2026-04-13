import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s for LLM generation
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 → logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────

export const authAPI = {
  register: (email, password, full_name) =>
    api.post('/auth/register', { email, password, full_name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

// ─── Disputes ─────────────────────────────────────────────────────

export const disputeAPI = {
  list: () => api.get('/disputes/'),
  get: (id) => api.get(`/disputes/${id}`),
  create: (data) => api.post('/disputes/', data),
  uploadEvidence: (id, formData) =>
    api.post(`/disputes/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  generate: (id) => api.post(`/disputes/${id}/generate`),
  download: (id) => api.get(`/disputes/${id}/download`, { responseType: 'blob' }),
  reasonCodes: () => api.get('/disputes/reason-codes'),
}

export default api
