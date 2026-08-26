import { useState, useMemo } from "react";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { FaCamera, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

const colorMap = {
  White: "#f3f4f6",
  Black: "#1f2937",
  Silver: "#9ca3af",
  Red: "#ef4444",
  Blue: "#3b82f6",
  Green: "#22c55e",
  Yellow: "#eab308",
};

const ROWS_OPTIONS = [10, 25, 50];

const selectStyles = `h-6 text-[12px] px-2 pr-6 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg`;

function BlacklistTable({ data, onEdit, onDelete, activeTab }) {
  const isFoundTab = activeTab === "found";
  const [typeFilter, setTypeFilter] = useState("All");
  const [reasonFilter, setReasonFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const vehicleTypes = useMemo(
    () => [...new Set(data.map((d) => d.vehicleType))],
    [data],
  );
  const reasons = useMemo(
    () => [...new Set(data.map((d) => d.reason))],
    [data],
  );
  const statuses = useMemo(
    () => [...new Set(data.map((d) => d.status))],
    [data],
  );

  const filtered = useMemo(() => {
    let result = data;
    if (typeFilter !== "All")
      result = result.filter((d) => d.vehicleType === typeFilter);
    if (reasonFilter !== "All")
      result = result.filter((d) => d.reason === reasonFilter);
    if (statusFilter !== "All")
      result = result.filter((d) => d.status === statusFilter);
    return result;
  }, [data, typeFilter, reasonFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const colCount = isFoundTab ? 11 : 9;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <table
          className={`w-full text-left text-xs ${isFoundTab ? "min-w-[1400px]" : "min-w-[1200px]"}`}
        >
          <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-[0_1px_0_0_var(--border-color)]">
            <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] min-w-[100px]">
                VEHICLE NUMBER
              </th>
              <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)] font-semibold w-[80px]">
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                    TYPE
                  </span>

                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`${selectStyles} w-[70px]`}
                  >
                    <option value="All">ALL</option>
                    {vehicleTypes.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] w-[90px]">
                COLOR
              </th>
              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] w-[120px]">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                    REASON
                  </span>
                  <select
                    value={reasonFilter}
                    onChange={(e) => {
                      setReasonFilter(e.target.value);
                      setPage(1);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`${selectStyles} w-[70px]`}
                  >
                    <option value="All">ALL</option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>
                        {r.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] min-w-[100px]">
                BLACKLISTED ON
              </th>
              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] min-w-[100px]">
                CASE / FIR NO.
              </th>
              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] w-[130px]">
                BLOCKED IN
              </th>
              {isFoundTab && (
                <>
                  <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] w-[130px]">
                    FOUNDED IN
                  </th>
                  <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] w-[140px]">
                    FOUNDED ON
                  </th>
                </>
              )}
              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] w-[100px]">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                    STATUS
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`${selectStyles} w-[70px]`}
                  >
                    <option value="All">ALL</option>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="py-1.5 px-3 font-semibold border-b border-[var(--border-color)] w-[80px]">
                ACTIONS
              </th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((row) => (
              <tr
                key={row.id}
                className={`h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer ${
                  row.status === "Found" ? "bg-blue-50/30" : ""
                }`}
              >
                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                  <span className="text-[13px] font-semibold tracking-wide">
                    {row.number}
                  </span>
                </td>
                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                    {row.vehicleType}
                  </span>
                </td>
                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 border border-[var(--border-color)]"
                      style={{
                        backgroundColor: colorMap[row.color] || "#9ca3af",
                      }}
                    />
                    <span className="text-[13px] font-normal text-[var(--text-dark)]">
                      {row.color}
                    </span>
                  </div>
                </td>
                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                    {row.reason}
                  </span>
                </td>
                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                  <span className="text-[13px] font-normal text-[var(--text-muted)]">
                    {row.blacklistedOn}
                  </span>
                </td>
                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                  <span className="text-[13px] font-normal text-[var(--text-muted)]">
                    {row.caseNo}
                  </span>
                </td>
                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                  <span
                    className="text-[13px] font-normal text-[var(--text-dark)]"
                    title={row.blockedIn}
                  >
                    {row.blockedIn || "\u2014"}
                  </span>
                </td>
                {isFoundTab && (
                  <>
                    <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                      <span
                        className="text-[13px] font-normal text-[var(--text-dark)]"
                        title={row.foundedIn}
                      >
                        {row.foundedIn || "\u2014"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                      <span
                        className="text-[13px] font-normal text-[var(--text-muted)]"
                        title={row.foundedTimestamp}
                      >
                        {row.foundedTimestamp || "\u2014"}
                      </span>
                    </td>
                  </>
                )}
                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                  <span
                    className={`px-2 py-0 rounded-full text-[13px] font-normal whitespace-nowrap ${
                      row.status === "Active"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-blue-500 dark:text-blue-400"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-1.5 px-3 whitespace-nowrap">
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => onEdit?.(row)}
                      className="p-1.5 rounded-lg hover:bg-[var(--primary-color)]/10 text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                      title="Edit"
                    >
                      <CiEdit size={14} />
                    </button>
                    <button
                      onClick={() => onDelete?.(row.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <MdDelete size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[12px] font-medium text-[var(--text-muted)]">
                      NO VEHICLES FOUND
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      TRY ADJUSTING YOUR SEARCH OR FILTERS
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="shrink-0 h-[30px] min-h-[30px] px-4 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-color)]/30">
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-[var(--text-muted)]">
            Showing{" "}
            <span className="font-semibold text-[var(--text-dark)]">
              {filtered.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-[var(--text-dark)]">
              {Math.min(page * rowsPerPage, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[var(--text-dark)]">
              {filtered.length}
            </span>{" "}
            vehicles
          </p>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="h-7 text-[10px] px-2 pr-6 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
          >
            {ROWS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} rows
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <BiChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all ${
                p === page
                  ? "bg-[var(--primary-color)] text-white shadow-sm"
                  : "border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <BiChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BlacklistTable;
