import api from './client'

export const listCameras = () => api.get('/api/v1/camera')
export const getCamera = (id) => api.get(`/api/v1/camera/${id}`)
export const createCamera = (data) => api.post('/api/v1/camera', data)
export const updateCamera = (id, data) => api.put(`/api/v1/camera/${id}`, data)
export const deleteCamera = (id) => api.delete(`/api/v1/camera/${id}`)
export const getCameraStatuses = () => api.get('/api/v1/camera/statuses')
export const getCameraStatus = (id) => api.get(`/api/v1/camera/${id}/status`)
