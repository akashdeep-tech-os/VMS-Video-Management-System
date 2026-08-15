import { NavLink, Route, Routes } from 'react-router-dom'
import { CameraProvider } from './context/CameraContext'
import DashboardPage from './pages/DashboardPage'
import CamerasPage from './pages/CamerasPage'
import LiveViewPage from './pages/LiveViewPage'
import Health from './pages/Health'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/cameras', label: 'Cameras' },
  { to: '/live', label: 'Live View' },
  { to: '/health', label: 'Health' },
]

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm ${
    isActive ? 'bg-slate-800 font-semibold text-cyan-400' : 'text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400'
  }`

export default function App() {
  return (
    <CameraProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <aside className="w-52 shrink-0 border-r border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 px-4 py-4">
            <div className="text-base font-bold text-cyan-400">VMS Load Test</div>
            <div className="text-xs text-slate-500">100 cameras · WebRTC</div>
          </div>
          <nav className="space-y-1 p-3">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-800 px-4 py-3 text-[11px] leading-relaxed text-slate-600">
            ONVIF cameras stream via MediaMTX over WebRTC. This tool is for load testing only — no recording, playback or
            PTZ.
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cameras" element={<CamerasPage />} />
            <Route path="/live" element={<LiveViewPage />} />
            <Route path="/health" element={<Health />} />
          </Routes>
        </main>
      </div>
    </CameraProvider>
  )
}
