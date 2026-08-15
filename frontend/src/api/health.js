import api from './client'

export const getHealth = () => api.get('/api/v1/health')
