import { useState } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

const allCameras = [
  { name: "Gate 1 - Entry", detections: 2846, share: 22.7 },
  { name: "Gate 2 - Exit", detections: 2451, share: 19.5 },
  { name: "Parking Area", detections: 1987, share: 15.8 },
  { name: "Lobby Entrance", detections: 1756, share: 14.0 },
  { name: "Road PTZ - Lane 1", detections: 1245, share: 9.9 },
  { name: "Rear Gate", detections: 1034, share: 8.2 },
  { name: "1st Floor Corridor", detections: 567, share: 4.5 },
  { name: "Warehouse Gate", detections: 654, share: 5.4 },
];

const ROWS_OPTIONS = [5, 10, 20];

function TopCamerasByDetections() {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(allCameras.length / rowsPerPage);
  const paginated = allCameras.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ================= TABLE ================= */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-[0_1px_0_0_var(--border-color)]">
            <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
              <th className="text-left px-4 py-2.5 text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide border-r border-[var(--border-color)]">
                Camera
              </th>
              <th className="text-right px-4 py-2.5 text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide border-r border-[var(--border-color)]">
                Detections
              </th>
              <th className="text-right px-4 py-2.5 text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide">
                % Share
              </th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((item, index) => (
              <tr
                key={index}
                className="h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer"
              >
                <td className="px-4 py-1.5 text-[13px] font-normal text-[var(--text-dark)] whitespace-nowrap border-r border-[var(--border-color)]">
                  {item.name}
                </td>
                <td className="px-4 py-1.5 text-right text-[13px] font-bold text-[var(--text-dark)] whitespace-nowrap border-r border-[var(--border-color)]">
                  {item.detections.toLocaleString()}
                </td>
                <td className="px-4 py-1.5 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-color)]/60"
                        style={{ width: `${(item.share / 25) * 100}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-medium text-[var(--text-muted)] w-8 text-right">
                      {item.share}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="shrink-0 min-h-[40px] px-4 border-t border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-dark)]">
              {(page - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-[var(--text-dark)]">
              {Math.min(page * rowsPerPage, allCameras.length)}
            </span>
            /{allCameras.length}
          </p>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="h-6 text-[9px] px-1.5 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer"
          >
            {ROWS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <BiChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all ${p === page ? "bg-[var(--primary-color)] text-white" : "border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-color)]"}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <BiChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopCamerasByDetections;
