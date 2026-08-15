import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as cameraApi from '../api/cameras'

const STATUS_POLL_MS = 10000
const CAMERA_POLL_MS = 30000

const CameraContext = createContext(null)

export function CameraProvider({ children }) {
  const [cameras, setCameras] = useState([])
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refreshCameras = useCallback(async () => {
    try {
      const { data } = await cameraApi.listCameras()
      if (mountedRef.current) {
        setCameras(data)
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  const refreshStatuses = useCallback(async () => {
    try {
      const { data } = await cameraApi.getCameraStatuses()
      if (mountedRef.current) {
        setStatuses(Object.fromEntries(data.map((s) => [s.camera_id, s])))
        setLastUpdated(Date.now())
      }
    } catch {
      // Keep the last known statuses on transient failures.
    }
  }, [])

  useEffect(() => {
    refreshCameras()
    refreshStatuses()
    const statusTimer = setInterval(refreshStatuses, STATUS_POLL_MS)
    const cameraTimer = setInterval(refreshCameras, CAMERA_POLL_MS)
    return () => {
      clearInterval(statusTimer)
      clearInterval(cameraTimer)
    }
  }, [refreshCameras, refreshStatuses])

  const addCamera = useCallback(
    async (payload) => {
      const { data } = await cameraApi.createCamera(payload)
      await refreshCameras()
      await refreshStatuses()
      return data
    },
    [refreshCameras, refreshStatuses],
  )

  const updateCamera = useCallback(
    async (id, payload) => {
      const { data } = await cameraApi.updateCamera(id, payload)
      await refreshCameras()
      await refreshStatuses()
      return data
    },
    [refreshCameras, refreshStatuses],
  )

  const removeCamera = useCallback(
    async (id) => {
      await cameraApi.deleteCamera(id)
      setStatuses((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await refreshCameras()
    },
    [refreshCameras],
  )

  const value = {
    cameras,
    statuses,
    loading,
    error,
    lastUpdated,
    refreshCameras,
    refreshStatuses,
    addCamera,
    updateCamera,
    removeCamera,
  }

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
}

export function useCameras() {
  const context = useContext(CameraContext)
  if (!context) {
    throw new Error('useCameras must be used within a CameraProvider')
  }
  return context
}
