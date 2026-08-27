import { useMemo } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import StatusBadge from "../ui/StatusBadge";

function CameraTable({
  cameras = [],
  statuses = {},
  toggleVisibility,
  handleDelete,
  onEdit,
  onToggle,
  selectedIds = [],
  toggleSelect,
  toggleSelectAll,
  onRowDetailsClick,
  activeDetailCamera,
}) {
  if (cameras.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
        No cameras yet. Add your first ONVIF camera to start load testing.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900 text-xs uppercase text-slate-400">
          <tr>
            <th className="px-4 py-3">Camera</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Device</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Stream</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {cameras.map((camera) => {
            const status = statuses[camera.id];
            const state = camera.enabled ? status?.state || "idle" : "disabled";
            return (
              <tr
                key={camera.id}
                className="bg-slate-950/50 hover:bg-slate-900"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">
                    {camera.name}
                  </div>
                  <div className="text-xs text-slate-500">#{camera.id}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {camera.ip_address || camera.ip}
                  <div className="text-xs text-slate-500">
                    ONVIF {camera.onvif_port || "80"} / RTSP{" "}
                    {camera.rtsp_port || "554"}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {camera.manufacturer || "—"}
                  <div className="text-xs text-slate-500">
                    {camera.model || ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge state={state} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {camera.stream_state || "—"}
                  <div className="text-xs text-slate-500">
                    {camera.rtsp_source === "fallback"
                      ? "rtsp path (fallback)"
                      : camera.rtsp_source || ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => onEdit?.(camera)}
                      className="rounded-md border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onToggle?.(camera)}
                      className={`rounded-md border px-2.5 py-1 ${
                        camera.enabled
                          ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                          : "border-emerald-700 text-emerald-400 hover:bg-emerald-950/40"
                      }`}
                    >
                      {camera.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDelete?.(camera.id)}
                      className="rounded-md border border-red-900 px-2.5 py-1 text-red-400 hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CameraTable;
