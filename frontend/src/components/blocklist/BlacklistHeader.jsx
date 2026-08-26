import { FaSearch, FaDownload } from "react-icons/fa";

function BlacklistHeader({
  search,
  setSearch,
  reasonFilter,
  setReasonFilter,
  activeTab,
  setActiveTab,
  counts,
}) {
  const tabs = [
    { key: "blacklist", label: "Blacklist Vehicle", count: counts.blacklist },
    { key: "found", label: "Founded Vehicle", count: counts.found },
  ];

  return (
    <div className="flex justify-between items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
      {/* Left: Stats Tabs */}
      <div className="flex items-center gap-1 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-1.5 sm:px-2.5 py-1.5 text-[9px] sm:text-[10px] md:text-[13px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-[var(--primary-color)] text-white"
                : "bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-dark)]"
            }`}
          >
            {tab.label} <span className="ml-0.5 opacity-80">{tab.count}</span>
          </button>
        ))}
      </div>
      {/* Right: Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search */}
        <div className="relative shrink-0">
          <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[9px] sm:text-[10px] md:text-[13px]" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-20 sm:w-28 md:w-40 pl-6 sm:pl-7 pr-1.5 sm:pr-2 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[9px] sm:text-[10px] md:text-[13px] text-[var(--text-dark)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-color)] transition-all"
          />
        </div>

        {/* Reason Filter */}
        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className="px-1 sm:px-2 py-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[9px] sm:text-[10px] md:text-[13px] text-[var(--text-dark)] cursor-pointer focus:outline-none focus:border-[var(--primary-color)] shrink-0"
        >
          <option value="">All</option>
          <option value="Stolen Vehicle">Stolen</option>
          <option value="Other Reason">Other</option>
          <option value="Fraud">Fraud</option>
          <option value="Hit and Run">Hit & Run</option>
        </select>

        {/* Export */}
        <button className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1.5 text-[9px] sm:text-[10px] md:text-[13px] font-medium text-white bg-[var(--primary-color)] rounded-lg hover:opacity-90 transition-opacity shrink-0">
          <FaDownload size={10} />
          Export
        </button>
      </div>
    </div>
  );
}

export default BlacklistHeader;
