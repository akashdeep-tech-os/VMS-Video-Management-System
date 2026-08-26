const STYLES = {
  live: { dot: 'bg-green-500', label: 'text-green-400', text: 'Live' },
  connecting: { dot: 'bg-amber-400 animate-pulse', label: 'text-amber-400', text: 'Connecting' },
  reconnecting: { dot: 'bg-amber-400 animate-pulse', label: 'text-amber-400', text: 'Reconnecting' },
  offline: { dot: 'bg-red-500', label: 'text-red-400', text: 'Offline' },
  disabled: { dot: 'bg-slate-600', label: 'text-slate-500', text: 'Disabled' },
  idle: { dot: 'bg-slate-600', label: 'text-slate-500', text: 'Idle' },
}

export default function StatusBadge({ state = 'idle', compact = false }) {
  const style = STYLES[state] || STYLES.idle
  if (compact) {
    return <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} title={style.text} />
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.label}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
      {style.text}
    </span>
  )
}
