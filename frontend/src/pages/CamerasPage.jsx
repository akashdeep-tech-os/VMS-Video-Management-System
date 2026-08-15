import { useState } from 'react'
import CameraForm from '../components/CameraForm'
import CameraTable from '../components/CameraTable'
import ConfirmDialog from '../components/ConfirmDialog'
import { useCameras } from '../context/CameraContext'

export default function CamerasPage() {
  const { cameras, statuses, loading, error: contextError, addCamera, updateCamera, removeCamera } = useCameras()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [pageError, setPageError] = useState(null)

  const openAdd = () => {
    setEditing(null)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (camera) => {
    setEditing(camera)
    setFormError(null)
    setFormOpen(true)
  }

  const handleSave = async (payload) => {
    setBusy(true)
    setFormError(null)
    try {
      if (editing) {
        await updateCamera(editing.id, payload)
      } else {
        await addCamera(payload)
      }
      setFormOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleToggle = async (camera) => {
    try {
      await updateCamera(camera.id, { enabled: !camera.enabled })
    } catch (err) {
      setPageError(err.message)
    }
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await removeCamera(deleting.id)
      setDeleting(null)
    } catch (err) {
      setPageError(err.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const message = pageError || contextError

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Camera Management</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading cameras…' : `${cameras.length} camera(s) registered`}
          </p>
        </div>
        <button onClick={openAdd} className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">
          + Add Camera
        </button>
      </div>

      {message && (
        <div className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">{message}</div>
      )}

      <CameraTable
        cameras={cameras}
        statuses={statuses}
        onEdit={openEdit}
        onToggle={handleToggle}
        onDelete={setDeleting}
      />

      <CameraForm
        open={formOpen}
        camera={editing}
        busy={busy}
        error={formError}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete camera"
        message={`Delete "${deleting?.name}"? The camera record and its MediaMTX stream path will be removed.`}
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
