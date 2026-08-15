import { useMemo, useState } from 'react'
import VideoTile from '../components/VideoTile'
import { useCameras } from '../context/CameraContext'

const PRESETS = [1, 2, 3, 4, 5]
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

export default function LiveViewPage() {
  const { cameras, statuses } = useCameras()
  const [cols, setCols] = useState(4)
  const [rows, setRows] = useState(4)
  const [custom, setCustom] = useState(false)
  const [customCols, setCustomCols] = useState('6')
  const [customRows, setCustomRows] = useState('6')
  const [filter, setFilter] = useState('all')

  const applyCustom = () => {
    const c = Math.min(Math.max(Number(customCols) || 1, 1), 20)
    const r = Math.min(Math.max(Number(customRows) || 1, 1), 20)
    setCols(c)
    setRows(r)
    setCustom(true)
  }

  const selectPreset = (n) => {
    setCols(n)
    setRows(n)
    setCustom(false)
  }

  const visible = useMemo(() => {
    const list = cameras.filter((c) => c.enabled)
    return list
      .filter((c) => {
        const state = statuses[c.id]?.state
        if (filter === 'online') return state === 'online'
        if (filter === 'offline') return state === 'offline'
        return true
      })
      .slice(0, cols * rows)
  }, [cameras, statuses, filter, cols, rows])

  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Live View</h1>
          <p className="text-sm text-slate-500">
            WebRTC (WHEP) directly from MediaMTX — showing {visible.length} of {cameras.filter((c) => c.enabled).length} enabled cameras
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 p-1">
            {PRESETS.map((n) => (
              <button
                key={n}
                onClick={() => selectPreset(n)}
                className={`rounded px-2.5 py-1 text-xs ${!custom && cols === n ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                {n}x{n}
              </button>
            ))}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <input
                type="number"
                min="1"
                max="20"
                value={customCols}
                onChange={(e) => setCustomCols(e.target.value)}
                className="w-12 rounded border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                title="Columns"
              />
              <span className="text-xs text-slate-500">x</span>
              <input
                type="number"
                min="1"
                max="20"
                value={customRows}
                onChange={(e) => setCustomRows(e.target.value)}
                className="w-12 rounded border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                title="Rows"
              />
              <button
                onClick={applyCustom}
                className={`rounded px-2.5 py-1 text-xs ${custom ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Apply
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded px-2.5 py-1 text-xs ${filter === f.value ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
          {cameras.length === 0
            ? 'No cameras registered. Add cameras on the Camera Management page.'
            : 'No enabled cameras match the current filter.'}
        </div>
      ) : (
        <div className="grid gap-2" style={gridStyle}>
          {visible.map((camera) => (
            <VideoTile key={camera.id} camera={camera} status={statuses[camera.id]} />
          ))}
        </div>
      )}
    </div>
  )
}
