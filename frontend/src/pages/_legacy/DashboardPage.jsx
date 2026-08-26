import { useEffect, useState } from 'react'
import dashboardService from '../api/dashboardService'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import { useCameras } from '../context/CameraContext'

const POLL_MS = 10000

const EMPTY_STATS = {
  total: 0,
  enabled: 0,
  online: 0,
  offline: 0,
  disabled: 0,
  live_streams: 0,
  cpu: null,
  memory: null,
}

export default function DashboardPage() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [error, setError] = useState(null)
  const { cameras, statuses } = useCameras()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await dashboardService.getDashboard()
        if (mounted) {
          setStats(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) setError(err.message)
      }
    }
    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500">Load test overview — 100 cameras over WebRTC via MediaMTX</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
          Backend unreachable: {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Cameras" value={stats.total} accent="text-slate-100" />
        <StatCard label="Online Cameras" value={stats.online} accent="text-green-400" />
        <StatCard label="Offline Cameras" value={stats.offline} accent="text-red-400" />
        <StatCard label="Disabled" value={stats.disabled} accent="text-slate-500" />
        <StatCard label="Live Streams" value={stats.live_streams} accent="text-cyan-400" hint="publishing MediaMTX paths" />
        <StatCard label="Enabled Cameras" value={stats.enabled} accent="text-slate-100" />
        <StatCard label="CPU" value={stats.cpu != null ? `${stats.cpu.toFixed(1)}%` : '—'} accent="text-amber-400" hint="backend host" />
        <StatCard label="Memory" value={stats.memory != null ? `${stats.memory.toFixed(1)}%` : '—'} accent="text-amber-400" hint="backend host" />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Cameras</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Camera</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stream</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {cameras.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No cameras registered yet.
                  </td>
                </tr>
              )}
              {cameras.map((camera) => {
                const status = statuses[camera.id]
                const state = camera.enabled ? status?.state || 'idle' : 'disabled'
                return (
                  <tr key={camera.id} className="bg-slate-950/50">
                    <td className="px-4 py-2.5 font-medium text-slate-100">{camera.name}</td>
                    <td className="px-4 py-2.5 text-slate-300">{camera.ip_address}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge state={state} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {status ? (status.stream_publishing ? 'publishing' : 'idle') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
