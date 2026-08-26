import { useState } from "react";
import { usePlayback } from "../../context/PlaybackContext";
import { FaDownload, FaTimes } from "react-icons/fa";

function PeriodToggle({ value, onChange }) {
  return (
    <div className="flex rounded overflow-hidden border border-[var(--border-color)]">
      {["AM", "PM"].map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`text-[10px] font-bold px-2 py-1 transition ${
            value === p
              ? "bg-[var(--primary-color)] text-white"
              : "bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/**
 * Minimal modal to download a recorded window as MP4. Reuses the sidebar's
 * date/time selection as defaults; the actual request is issued by the context
 * (downloadRecording -> playbackService.download, GET
 * /api/playback/download/{cameraId}).
 */
function DownloadModal() {
  const {
    setShowDownloadModal, downloadRecording,
    selectedCameras, playbackDate, searchDate,
    searchStartTime, setSearchStartTime, searchStartPeriod, setSearchStartPeriod,
    searchEndTime, setSearchEndTime, searchEndPeriod, setSearchEndPeriod,
  } = usePlayback();

  const [busy, setBusy] = useState(false);

  const dateLabel = playbackDate
    || (searchDate ? searchDate.toLocaleDateString() : "— (pick a date in the sidebar)");
  const camLabel = selectedCameras[0] || "— (no camera selected)";

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadRecording();
      setShowDownloadModal(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowDownloadModal(false)}
    >
      <div
        className="w-full max-w-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <FaDownload className="text-[var(--primary-color)]" size={14} />
            <h3 className="text-sm font-bold text-[var(--text-dark)]">Download Recording</h3>
          </div>
          <button
            onClick={() => setShowDownloadModal(false)}
            className="p-1 hover:bg-[var(--hover-bg)] rounded transition"
          >
            <FaTimes className="text-[var(--text-muted)]" size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3 text-[var(--text-dark)]">
          <div className="text-xs text-[var(--text-muted)]">
            <div><span className="font-semibold">Camera:</span> {camLabel}</div>
            <div><span className="font-semibold">Date:</span> {dateLabel}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1">Start time</label>
              <div className="flex items-center gap-1">
                <input
                  value={searchStartTime}
                  onChange={(e) => setSearchStartTime(e.target.value)}
                  placeholder="hh:mm"
                  maxLength={5}
                  className="flex-1 min-w-0 bg-[var(--bg-color)] border border-[var(--border-color)] px-2 py-1 rounded text-xs focus:outline-none focus:border-[var(--primary-color)]"
                />
                <PeriodToggle value={searchStartPeriod} onChange={setSearchStartPeriod} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">End time</label>
              <div className="flex items-center gap-1">
                <input
                  value={searchEndTime}
                  onChange={(e) => setSearchEndTime(e.target.value)}
                  placeholder="hh:mm"
                  maxLength={5}
                  className="flex-1 min-w-0 bg-[var(--bg-color)] border border-[var(--border-color)] px-2 py-1 rounded text-xs focus:outline-none focus:border-[var(--primary-color)]"
                />
                <PeriodToggle value={searchEndPeriod} onChange={setSearchEndPeriod} />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-[var(--text-muted)]">
            Leave times blank to export the full day. Large windows can take a while to build.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)]">
          <button
            onClick={() => setShowDownloadModal(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--hover-bg)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary-color)] text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {busy ? "Preparing…" : "Download MP4"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;
