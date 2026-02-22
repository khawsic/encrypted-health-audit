import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach access token to every request automatically
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto refresh token on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const refreshToken = sessionStorage.getItem('refresh_token')
        if (!refreshToken) {
          sessionStorage.clear()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        const res = await axios.post('http://localhost:8080/api/v1/refresh', {
          refresh_token: refreshToken,
        })

        const newToken = res.data.access_token
        sessionStorage.setItem('access_token', newToken)
        original.headers.Authorization = `Bearer ${newToken}`

        return API(original)
      } catch {
        sessionStorage.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth endpoints
export const loginUser = (email, password) =>
  API.post('/login', { email, password })

export const registerUser = (name, email, password, role) =>
  API.post('/register', { name, email, password, role })

export const logoutUser = (refreshToken) =>
  API.post('/logout', { refresh_token: refreshToken })

export const requestPasswordReset = (email) =>
  API.post('/password-reset/request', { email })

export const resetPassword = (token, new_password) =>
  API.post('/password-reset/confirm', { token, new_password })

// Record endpoints
export const createRecord = (patient_id, diagnosis, treatment) =>
  API.post('/doctor/records', { patient_id, diagnosis, treatment })

export const updateRecord = (record_id, diagnosis, treatment) =>
  API.put(`/doctor/records/${record_id}`, { diagnosis, treatment })

export const deleteRecord = (record_id) =>
  API.delete(`/doctor/records/${record_id}`)

export const getVersionHistory = (record_id) =>
  API.get(`/doctor/records/${record_id}/history`)

export const searchPatientRecords = (patient_id) =>
  API.get(`/doctor/patients/${patient_id}/records`)

export const emergencyAccess = (record_id) =>
  API.post(`/doctor/records/emergency/${record_id}`)

export const getPatientRecords = () =>
  API.get('/patient/records')

// Admin endpoints
export const getAllRecords = () =>
  API.get('/admin/records')

export const getAuditLogs = (page = 1, page_size = 20) =>
  API.get(`/admin/audit-logs?page=${page}&page_size=${page_size}`)

export const filterAuditLogs = (params) =>
  API.get('/admin/audit-logs/filter', { params })

export const verifyAuditChain = () =>
  API.get('/admin/audit-logs/verify')

export const checkHealth = () =>
  API.get('/health')

export default API