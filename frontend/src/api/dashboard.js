import api from './client'

export const getDashboardStats = () => api.get('/api/v1/dashboard/stats')
