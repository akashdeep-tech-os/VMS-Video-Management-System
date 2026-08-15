const stack = [
  { name: 'FastAPI', detail: 'REST API backend', url: 'http://localhost:8000/docs' },
  { name: 'React + Vite', detail: 'Frontend SPA', url: 'http://localhost:5173' },
  { name: 'Tailwind CSS', detail: 'UI styling' },
  { name: 'SQLAlchemy + Alembic', detail: 'ORM and migrations' },
  { name: 'MediaMTX', detail: 'RTSP / RTMP / HLS / WebRTC server' },
]

export default function Home() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Live Streaming Platform</h1>
      <p className="mt-2 text-gray-400">
        Development environment for the live streaming platform.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {stack.map((item) => (
          <div key={item.name} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="font-semibold text-cyan-400">{item.name}</h2>
            <p className="mt-1 text-sm text-gray-400">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
