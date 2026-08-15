import { useEffect, useState } from 'react'
import { getHealth } from '../api/health'

function StatusBadge({ status }) {
  const ok = status === 'ok'
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
        ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}
    >
      {status}
    </span>
  )
}

function StatusRow({ label, status }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 py-3 last:border-0">
      <span className="text-gray-300">{label}</span>
      <StatusBadge status={status?.status ?? 'degraded'} />
    </div>
  )
}

export default function Health() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHealth()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || err.message || 'Failed to reach backend'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-gray-400">Checking health...</p>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
        <h1 className="font-semibold text-red-400">Backend unreachable</h1>
        <p className="mt-1 text-sm text-red-300">{error}</p>
      </div>
    )
  }

  return (
    <section>
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">System Health</h1>
        <StatusBadge status={data.status} />
      </div>
      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center justify-between border-b border-gray-800 py-3">
          <span className="text-gray-300">{data.app_name}</span>
          <span className="text-sm text-gray-500">
            v{data.version} · {data.environment}
          </span>
        </div>
        <StatusRow label="Database" status={data.database} />
        <StatusRow label="MediaMTX" status={data.mediamtx} />
        {data.database?.detail && (
          <p className="mt-2 text-xs text-red-400">{data.database.detail}</p>
        )}
        {data.mediamtx?.detail && (
          <p className="mt-2 text-xs text-red-400">{data.mediamtx.detail}</p>
        )}
      </div>
    </section>
  )
}
