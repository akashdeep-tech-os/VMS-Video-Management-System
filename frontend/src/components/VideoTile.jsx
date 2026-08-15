import { useEffect, useRef, useState } from 'react'
import { useWebRTC } from '../hooks/useWebRTC'

/**
 * One Live View tile: a WHEP-fed <video> with the camera name and a
 * connection indicator. Only connects when the camera is enabled and
 * currently reachable, so offline cameras don't burn WHEP attempts.
 */
export default function VideoTile({ camera, status }) {
  const reachable = status?.onvif_reachable !== false
  const { videoRef, status: streamStatus } = useWebRTC({
    url: camera.webrtc_url,
    enabled: camera.enabled && reachable,
  })

  const [hasFrame, setHasFrame] = useState(false)
  const tileRef = useRef(null)

  const toggleFullscreen = () => {
    const el = tileRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen?.()
    }
  }

  useEffect(() => {
    setHasFrame(false)
    const video = videoRef.current
    if (!video) return
    const onPlaying = () => setHasFrame(true)
    video.addEventListener('playing', onPlaying)
    return () => video.removeEventListener('playing', onPlaying)
  }, [streamStatus, videoRef])

  const indicatorStyle = {
    live: 'border-green-500',
    connecting: 'border-amber-400',
    reconnecting: 'border-amber-400',
    offline: 'border-red-500',
    idle: 'border-slate-700',
  }[streamStatus]

  const labelColor = {
    live: 'text-green-400',
    connecting: 'text-amber-400',
    reconnecting: 'text-amber-400',
    offline: 'text-red-400',
    idle: 'text-slate-400',
  }[streamStatus]

  return (
    <div
      ref={tileRef}
      onDoubleClick={toggleFullscreen}
      title="Double-click to fullscreen"
      className={`relative aspect-video cursor-pointer overflow-hidden rounded-md border bg-black ${indicatorStyle}`}
    >
      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" />
      {!hasFrame && streamStatus !== 'live' && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
          {streamStatus === 'offline' ? 'Camera offline' : streamStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
        </div>
      )}
      <div className="absolute left-1.5 top-1.5 flex max-w-[85%] items-center gap-1.5 rounded bg-black/60 px-1.5 py-0.5">
        <span className="truncate text-xs font-medium text-slate-100">{camera.name}</span>
      </div>
      <div className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-right">
        <span className={`text-[10px] font-semibold uppercase ${labelColor}`}>{streamStatus}</span>
      </div>
      {!hasFrame && streamStatus === 'live' && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
          <span className="animate-pulse">Waiting for video…</span>
        </div>
      )}
    </div>
  )
}