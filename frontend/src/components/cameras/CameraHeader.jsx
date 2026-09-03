import { FaCamera, FaSyncAlt, FaArrowLeft } from "react-icons/fa";
import { FiTrash2, FiSearch } from "react-icons/fi";

function CameraHeader({
  search,
  setSearch,
  status,
  setStatus,
  selectedIds = [],
  handleBulkDelete,
  onAddClick,
  onRefresh,
  isRefreshing,
  onBack,
  cameraCount = 0,
}) {
  const hasSelection = selectedIds.length > 0;

  return (
    <>
      {/* LEFT: Title */}
      <div className="flex items-center gap-2 shrink-0">
        <div className=" flex-shrink-0">
          <FaCamera className="text-[var(--primary-color)] text-[22px]" />
        </div>
        <h2 className="text-xs md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none whitespace-nowrap">
          Device Management
        </h2>
        <span className="text-[13px] bg-[var(--primary-color)]/10 text-[var(--primary-color)] px-2 py-0.5 rounded-full font-bold">
          {cameraCount}
        </span>
      </div>

      {/* RIGHT: Search + Filters + Actions */}
      <div className="w-full md:w-auto flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative w-full md:w-[170px]">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <FiSearch size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search device / IP..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)] bg-[var(--input-bg)] text-[var(--text-dark)] placeholder:text-[var(--text-muted)] transition-all"
          />
        </div>

        <div className="flex gap-1.5 w-full md:w-auto items-center">
          <button
            onClick={onAddClick}
            type="button"
            className="w-full md:w-auto py-1.5 px-2.5 text-[11px] font-bold bg-[var(--primary-color)] hover:opacity-90 text-white rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
          >
            <FaCamera size={12} className="flex-shrink-0" />
            <span>Add Device</span>
          </button>
          <button
            onClick={handleBulkDelete}
            type="button"
            disabled={!hasSelection}
            className={`hidden md:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
              hasSelection
                ? "bg-red-500 text-white shadow-md hover:opacity-90"
                : "bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border-color)] opacity-50 cursor-not-allowed"
            }`}
            title={`Delete Selected (${selectedIds.length})`}
          >
            <div className="relative">
              <FiTrash2 size={14} />
              {hasSelection && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-[var(--card-bg)] text-red-500 text-[9px] font-bold shadow">
                  {selectedIds.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--hover-bg)] transition border border-[var(--border-color)]/40 text-[var(--text-muted)] hover:text-[var(--text-dark)] bg-[var(--card-bg)]"
          >
            <FaSyncAlt
              className={`text-[11px] ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>
    </>
  );
}

export default CameraHeader;
