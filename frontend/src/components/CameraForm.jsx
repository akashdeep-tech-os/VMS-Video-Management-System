import { useEffect, useState } from 'react'

const EMPTY_FORM = {
  name: '',
  ip_address: '',
  onvif_port: '80',
  rtsp_port: '554',
  username: '',
  password: '',
}

/**
 * Add / Edit camera modal. On edit, an empty password keeps the stored one.
 * Submitting can take a while (backend runs the ONVIF probe), so the form
 * shows a busy state and cannot be closed mid-probe.
 */
export default function CameraForm({ open, camera = null, busy = false, error = null, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [validation, setValidation] = useState(null)

  useEffect(() => {
    if (!open) return
    setValidation(null)
    setForm(
      camera
        ? {
            name: camera.name,
            ip_address: camera.ip_address,
            onvif_port: String(camera.onvif_port),
            rtsp_port: String(camera.rtsp_port),
            username: camera.username,
            password: '',
          }
        : EMPTY_FORM,
    )
  }, [open, camera])

  if (!open) return null

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.ip_address.trim()) {
      setValidation('Name and IP address are required')
      return
    }
    const payload = {
      name: form.name.trim(),
      ip_address: form.ip_address.trim(),
      onvif_port: Number(form.onvif_port),
      rtsp_port: Number(form.rtsp_port),
      username: form.username.trim(),
      password: form.password,
    }
    onSave(payload)
  }

  const inputClass =
    'w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-slate-100">{camera ? 'Edit Camera' : 'Add Camera'}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {camera
            ? 'Connection fields are re-validated against ONVIF before saving.'
            : 'The camera is validated over ONVIF before it is saved. This can take a few seconds.'}
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Camera Name *</label>
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Lobby Camera 01" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">IP Address *</label>
            <input className={inputClass} value={form.ip_address} onChange={set('ip_address')} placeholder="192.168.1.10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">ONVIF Port</label>
              <input className={inputClass} type="number" min="1" max="65535" value={form.onvif_port} onChange={set('onvif_port')} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">RTSP Port</label>
              <input className={inputClass} type="number" min="1" max="65535" value={form.rtsp_port} onChange={set('rtsp_port')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Username</label>
              <input className={inputClass} value={form.username} onChange={set('username')} autoComplete="off" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Password</label>
              <input
                className={inputClass}
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                placeholder={camera ? 'leave blank to keep' : ''}
              />
            </div>
          </div>

          {(validation || error) && (
            <div className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {validation || error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" disabled={busy} onClick={onClose} className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="rounded-md bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-500 disabled:opacity-50">
              {busy ? (camera ? 'Validating…' : 'Validating ONVIF…') : camera ? 'Save Changes' : 'Add Camera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
