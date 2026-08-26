import { FaSyncAlt } from "react-icons/fa";
import { HiOutlineUserAdd } from "react-icons/hi";
import { FiTrash2, FiSearch } from "react-icons/fi";

function UserHeader({
  search,
  setSearch,
  selectedIds = [],
  handleBulkDelete,
  onAddClick,
  onRefresh,
  isRefreshing,
}) {
  const hasSelection = selectedIds.length > 0;

  return (
    <>
      {/* LEFT: Title */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-[var(--primary-color)]/10 flex-shrink-0">
          <HiOutlineUserAdd className="text-[var(--primary-color)] text-base" />
        </div>
        <h2 className="text-xs md:text-sm font-bold tracking-tight text-[var(--text-dark)] leading-none">
          User Management
        </h2>
      </div>

      {/* RIGHT: Controls */}
      <div className="w-full md:w-auto flex flex-col gap-2 md:flex-row md:items-center">
        {/* SEARCH */}
        <div className="relative w-full md:w-[170px]">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <FiSearch size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)] bg-[var(--input-bg)] text-[var(--text-dark)] placeholder:text-[var(--text-muted)] transition-all"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-1.5 w-full md:w-auto items-center">
          <button
            onClick={onAddClick}
            type="button"
            className="w-full md:w-auto py-1.5 px-2.5 text-[11px] font-bold bg-[var(--primary-color)] hover:opacity-90 text-white rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
          >
            <HiOutlineUserAdd size={13} className="flex-shrink-0" />
            <span>Add User</span>
          </button>

          <button
            onClick={handleBulkDelete}
            type="button"
            disabled={!hasSelection}
            className={`hidden md:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
              hasSelection
                ? "bg-[var(--danger-color)] text-white shadow-md hover:opacity-90"
                : "bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border-color)] opacity-50 cursor-not-allowed"
            }`}
            title={`Delete Selected (${selectedIds.length})`}
          >
            <div className="relative">
              <FiTrash2 size={14} />
              {hasSelection && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-white text-[var(--danger-color)] text-[9px] font-bold shadow">
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

          {/* Mobile utilities */}
          <div className="flex items-center gap-1 md:hidden">
            {hasSelection && (
              <button
                onClick={handleBulkDelete}
                type="button"
                className="p-1.5 rounded-lg border border-[var(--danger-color)]/30 bg-[var(--danger-color)]/10 text-[var(--danger-color)] transition-all"
              >
                <FiTrash2 size={13} />
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-dark)] bg-[var(--input-bg)] transition-all ${isRefreshing ? "opacity-60" : ""}`}
            >
              <FaSyncAlt
                className={`text-[10px] ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserHeader;
