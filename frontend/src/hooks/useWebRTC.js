import { useCallback, useEffect, useRef, useState } from 'react'
import { WHEPClient } from 'whip-whep/whep.js'

const BASE_DELAY = 2000
const MAX_DELAY = 30000
const OFFLINE_DELAY = 10000

// Exponential backoff with jitter: 2s -> 4s -> 8s -> ... capped at 30s.
const backoffDelay = (attempt) =>
  Math.min(BASE_DELAY * 2 ** attempt, MAX_DELAY) + Math.floor(Math.random() * 1000)

/**
 * Owns one WHEP WebRTC connection to MediaMTX with automatic reconnection.
 *
 * Statuses: connecting | live | offline | reconnecting | idle
 *
 * Reconnect rules (critical for a 100-camera load test):
 *  - 404 from the WHEP endpoint (path missing / camera not reachable) ->
 *    "offline", retry on a slow 10s cadence.
 *  - Any other failure -> "reconnecting" with exponential backoff.
 *  - ICE/connection failures trigger a fresh connection attempt.
 *  - Reconnects are paused while the tab is hidden to save bandwidth.
 */
export function useWebRTC({ url, enabled = true, onStatusChange } = {}) {
  const [status, setStatus] = useState('idle')
  const videoRef = useRef(null)
  const whepRef = useRef(null)
  const pcRef = useRef(null)
  const timerRef = useRef(null)
  const attemptRef = useRef(0)
  const mountedRef = useRef(true)
  const hiddenRef = useRef(typeof document !== 'undefined' ? document.hidden : false)
  const urlRef = useRef(url)
  const enabledRef = useRef(enabled)
  const onStatusRef = useRef(onStatusChange)

  useEffect(() => {
    urlRef.current = url
  }, [url])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    onStatusRef.current = onStatusChange
  }, [onStatusChange])

  const setStatusSafe = useCallback((next) => {
    setStatus(next)
    onStatusRef.current?.(next)
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const cleanupConnection = useCallback(() => {
    const whep = whepRef.current
    whepRef.current = null
    pcRef.current = null
    if (whep) {
      // stop() closes the peer connection and DELETEs the WHEP resource.
      whep.stop().catch(() => {})
      const pc = whep.pc
      if (pc && pc.connectionState !== 'closed') {
        try {
          pc.close()
        } catch {
          /* already closed */
        }
      }
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const connectRef = useRef(null)

  const scheduleReconnect = useCallback(
    (delay) => {
      clearTimer()
      if (!mountedRef.current || hiddenRef.current) return
      timerRef.current = setTimeout(() => connectRef.current?.(), delay)
    },
    [clearTimer],
  )

  const connect = useCallback(async () => {
    clearTimer()
    if (!mountedRef.current || hiddenRef.current) return
    const currentUrl = urlRef.current
    if (!currentUrl || !enabledRef.current) return

    const attempt = attemptRef.current
    attemptRef.current += 1
    setStatusSafe(attempt === 0 ? 'connecting' : 'reconnecting')

    const pc = new RTCPeerConnection({ bundlePolicy: 'max-bundle' })
    // Video-only: halves bandwidth compared to offering audio for 100 tiles.
    pc.addTransceiver('video', { direction: 'recvonly' })
    pcRef.current = pc

    pc.addEventListener('track', (event) => {
      if (event.streams[0] && videoRef.current) {
        videoRef.current.srcObject = event.streams[0]
      }
    })
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'connected') {
        attemptRef.current = 0
        setStatusSafe('live')
      } else if ((pc.connectionState === 'failed' || pc.connectionState === 'disconnected') && whepRef.current) {
        cleanupConnection()
        scheduleReconnect(backoffDelay(attemptRef.current))
      }
    })

    const whep = new WHEPClient()
    whepRef.current = whep
    try {
      await whep.view(pc, currentUrl)
    } catch (err) {
      const message = err?.message || String(err)
      cleanupConnection()
      if (message.includes('404')) {
        // Path not registered / camera not reachable: slow retry, stay "offline".
        setStatusSafe('offline')
        scheduleReconnect(OFFLINE_DELAY)
      } else {
        scheduleReconnect(backoffDelay(attempt))
      }
    }
  }, [cleanupConnection, clearTimer, scheduleReconnect, setStatusSafe])

  connectRef.current = connect

  // Visibility: pause reconnection while the tab is hidden, resume on focus.
  useEffect(() => {
    const onVisibilityChange = () => {
      const hidden = document.hidden
      hiddenRef.current = hidden
      if (!hidden && !timerRef.current) {
        connectRef.current?.()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // (Re)connect when url/enabled change; tear down on unmount.
  useEffect(() => {
    mountedRef.current = true
    if (enabled && url) {
      attemptRef.current = 0
      connect()
    } else {
      clearTimer()
      cleanupConnection()
      setStatusSafe('idle')
    }
    return () => {
      mountedRef.current = false
      clearTimer()
      cleanupConnection()
    }
  }, [url, enabled, connect, cleanupConnection, clearTimer, setStatusSafe])

  return { videoRef, status }
}
