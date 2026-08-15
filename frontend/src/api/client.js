import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Surface FastAPI's {"detail": "..."} payloads as readable error messages.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      error.message = detail
    }
    return Promise.reject(error)
  },
)

export default api
