import { useState, useEffect, useRef } from "react";
import {
  FaVideo,
  FaSyncAlt,
  FaExpand,
  FaCompress,
  FaTimes,
  FaTrash,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import { IoReorderThreeOutline } from "react-icons/io5";
import { Radio, LayoutGrid } from "lucide-react";
import BodyHead from "../common/BodyHead";
import { useLiveStreaming } from "../../context/LiveStreamingContext";

const autoShiftOptions = [
  { label: "30 sec", value: 30 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
];

function StreamingHeader({
  isMobile,
  showSidebar,
  setShowSidebar,
  onToggleFullScreen,
  isGridFullscreen,
  onRefresh,
  isRefreshing,
  onMobileGridChange,
  mobileGrid,
}) {
  const {
    grid,
    setGrid,
    showingCount,
    totalCount,
    autoShiftEnabled,
    autoShiftInterval,
    setAutoShiftEnabled,
    setAutoShiftInterval,
    streamType,
    setStreamType,
    showEventPanel,
    setShowEventPanel,
    showMiniMap,
    setShowMiniMap,
    unreadEventCount,
    savedLayouts,
    saveLayout,
    loadLayout,
    deleteLayout,
    selectedTiles,
    clearTileSelection,
    gridCols,
    gridRows,
    setGridCols,
    setGridRows,
  } = useLiveStreaming();

  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeVal, setCustomTimeVal] = useState("");
  const [showLayoutPopup, setShowLayoutPopup] = useState(false);
  const [layoutTab, setLayoutTab] = useState("grid");
  const [showLayoutSave, setShowLayoutSave] = useState(false);
  const [layoutName, setLayoutName] = useState("");
  const [showStreamTypeDropdown, setShowStreamTypeDropdown] = useState(false);
  const streamTypeRef = useRef(null);
  const layoutPopupRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const maxGridSize = 15;

  // Close stream type dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (streamTypeRef.current && !streamTypeRef.current.contains(e.target)) {
        setShowStreamTypeDropdown(false);
      }
    };
    if (showStreamTypeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showStreamTypeDropdown]);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        layoutPopupRef.current &&
        !layoutPopupRef.current.contains(e.target)
      ) {
        setShowLayoutPopup(false);
        setShowLayoutSave(false);
      }
    };
    if (showLayoutPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showLayoutPopup]);
  const [customTimeLabel, setCustomTimeLabel] = useState(() => {
    if (
      !autoShiftOptions.some((o) => o.value === autoShiftInterval) &&
      autoShiftInterval > 0
    ) {
      return `${Math.round(autoShiftInterval / 60)} min`;
    }
    return "";
  });

  const applyGrid = () => {
    setGrid(gridCols * gridRows);
    setShowLayoutPopup(false);
  };

  const handleGridMouseDown = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / maxGridSize;
    const cellHeight = rect.height / maxGridSize;
    const col = Math.min(
      maxGridSize,
      Math.max(1, Math.ceil((e.clientX - rect.left) / cellWidth)),
    );
    const row = Math.min(
      maxGridSize,
      Math.max(1, Math.ceil((e.clientY - rect.top) / cellHeight)),
    );
    setIsDragging(true);
    setDragStart({ col, row });
    setDragEnd({ col, row });
    setGridCols(col);
    setGridRows(row);
  };

  const handleGridMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / maxGridSize;
    const cellHeight = rect.height / maxGridSize;
    const col = Math.min(
      maxGridSize,
      Math.max(1, Math.ceil((e.clientX - rect.left) / cellWidth)),
    );
    const row = Math.min(
      maxGridSize,
      Math.max(1, Math.ceil((e.clientY - rect.top) / cellHeight)),
    );
    setDragEnd({ col, row });
    setGridCols(col);
    setGridRows(row);
  };

  const handleGridMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveLayout = () => {
    if (layoutName.trim()) {
      saveLayout(layoutName.trim());
      setLayoutName("");
      setShowLayoutSave(false);
    }
  };

  return (
    <BodyHead className="gap-2">
      {/* LEFT: Title + Badge */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0 min-w-0">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-0.5 md:p-1.5 text-[var(--text-dark)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors focus:outline-none shrink-0"
        >
          <IoReorderThreeOutline className="text-[22px]" />
        </button>

        <div className="flex-shrink-0">
          <FaVideo className="text-[var(--primary-color)] text-[22px]" />
        </div>

        <h2 className="text-lg md:text-sm font-bold tracking-tight text-[var(--text-dark)] leading-none truncate flex items-center gap-1.5 p-1">
          <span className="hidden sm:inline text-[18px]">Live Monitoring</span>
          <span className="inline sm:hidden">Live</span>
          <span className="bg-[var(--hover-bg)] border border-[var(--border-color)] text-[var(--text-dark)] text-[12px] px-2 py-1 rounded-sm font-bold tabular-nums">
            {showingCount} / {totalCount}
          </span>
        </h2>

        {/* Selection badge */}
        {selectedTiles.size > 0 && (
          <button
            onClick={clearTileSelection}
            className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[10px] font-semibold text-blue-600 hover:bg-blue-500/20 transition-colors"
          >
            {selectedTiles.size} selected
            <FaTimes size={8} />
          </button>
        )}
      </div>

      {/* RIGHT: Controls */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Stream Type Dropdown */}
        <div className="relative hidden md:block" ref={streamTypeRef}>
          <button
            onClick={() => setShowStreamTypeDropdown(!showStreamTypeDropdown)}
            className="flex items-center gap-1 px-3 h-7 md:h-9 text-[11px] font-medium uppercase tracking-wider bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] focus:outline-none cursor-pointer"
          >
            {streamType}
            <FaChevronDown
              size={13}
              className={`transition-transform duration-200 ${
                showStreamTypeDropdown ? "rotate-180" : ""
              }`}
            />
          </button>
          {showStreamTypeDropdown && (
            <div className="vms-dropdown absolute right-0 top-full mt-1 w-full z-50">
              {["sub", "main", "mobile"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setStreamType(type);
                    setShowStreamTypeDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-left transition-colors ${
                    streamType === type
                      ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)]"
                      : "text-[var(--text-dark)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout Button (Desktop) - unified popup */}
        <div className="relative hidden md:block" ref={layoutPopupRef}>
          <button
            onClick={() => {
              setShowLayoutPopup(!showLayoutPopup);
              setShowLayoutSave(false);
              if (!showLayoutPopup) setLayoutTab("grid");
            }}
            title="Layout"
            className="flex items-center gap-1 px-2.5 h-[32px] md:h-[36px] bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <LayoutGrid size={13} className="text-[var(--primary-color)]" />
            <span className="text-[11px] font-medium uppercase tracking-wider hidden md:block">
              Layout
            </span>
          </button>

          {showLayoutPopup && (
            <div className="vms-dropdown absolute right-0 top-full mt-1 w-[280px] z-50">
              {/* Tab Selector */}
              <div className="flex border-b border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setLayoutTab("grid");
                    setShowLayoutSave(false);
                  }}
                  className={`flex-1 px-3 py-2 text-[13px] font-semibold transition-colors ${
                    layoutTab === "grid"
                      ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)] bg-[var(--primary-color)]/5"
                      : "text-[var(--text-muted)] hover:text-[var(--text-dark)]"
                  }`}
                >
                  Grid Layout
                </button>
                <button
                  onClick={() => {
                    setLayoutTab("saved");
                    setShowLayoutSave(false);
                  }}
                  className={`flex-1 px-3 py-2 text-[13px] font-semibold transition-colors ${
                    layoutTab === "saved"
                      ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)] bg-[var(--primary-color)]/5"
                      : "text-[var(--text-muted)] hover:text-[var(--text-dark)]"
                  }`}
                >
                  Saved Layout
                </button>
              </div>

              {/* Grid Layout Tab */}
              {layoutTab === "grid" && (
                <>
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-start justify-center gap-6 mb-4">
                      {/* Columns Control */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                          Cols
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const v = Math.max(1, gridCols - 1);
                              setGridCols(v);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--hover-bg)] border border-[var(--border-color)] hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)]/30 text-[var(--text-dark)] transition-all"
                          >
                            <FaChevronDown size={10} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={15}
                            value={gridCols}
                            onChange={(e) => {
                              const v = Math.max(
                                1,
                                Math.min(15, Number(e.target.value) || 1),
                              );
                              setGridCols(v);
                            }}
                            className="w-10 h-9 text-center bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[15px] font-bold text-[var(--text-dark)] tabular-nums focus:outline-none focus:border-[var(--primary-color)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                          <button
                            onClick={() => {
                              const v = Math.min(15, gridCols + 1);
                              setGridCols(v);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--hover-bg)] border border-[var(--border-color)] hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)]/30 text-[var(--text-dark)] transition-all"
                          >
                            <FaChevronUp size={10} />
                          </button>
                        </div>
                      </div>

                      {/* X Separator */}
                      <span className="text-[16px] font-bold text-[var(--text-muted)] mt-6">
                        x
                      </span>

                      {/* Rows Control */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                          Rows
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const v = Math.max(1, gridRows - 1);
                              setGridRows(v);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--hover-bg)] border border-[var(--border-color)] hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)]/30 text-[var(--text-dark)] transition-all"
                          >
                            <FaChevronDown size={10} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={15}
                            value={gridRows}
                            onChange={(e) => {
                              const v = Math.max(
                                1,
                                Math.min(15, Number(e.target.value) || 1),
                              );
                              setGridRows(v);
                            }}
                            className="w-10 h-9 text-center bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[15px] font-bold text-[var(--text-dark)] tabular-nums focus:outline-none focus:border-[var(--primary-color)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                          <button
                            onClick={() => {
                              const v = Math.min(15, gridRows + 1);
                              setGridRows(v);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--hover-bg)] border border-[var(--border-color)] hover:bg-[var(--primary-color)]/10 hover:border-[var(--primary-color)]/30 text-[var(--text-dark)] transition-all"
                          >
                            <FaChevronUp size={10} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Grid Preview */}
                    <div
                      className="w-full h-28 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg grid cursor-crosshair select-none"
                      style={{
                        gridTemplateColumns: `repeat(${maxGridSize}, 1fr)`,
                        gridTemplateRows: `repeat(${maxGridSize}, 1fr)`,
                        gap: "0",
                      }}
                      onMouseDown={handleGridMouseDown}
                      onMouseMove={handleGridMouseMove}
                      onMouseUp={handleGridMouseUp}
                      onMouseLeave={handleGridMouseUp}
                    >
                      {[...Array(maxGridSize * maxGridSize)].map((_, i) => {
                        const col = (i % maxGridSize) + 1;
                        const row = Math.floor(i / maxGridSize) + 1;
                        const isSelected = col <= gridCols && row <= gridRows;
                        return (
                          <div
                            key={i}
                            className={`transition-colors duration-75 ${
                              isSelected
                                ? "bg-[var(--primary-color)]/50 border border-[var(--primary-color)]"
                                : "bg-white border border-slate-300"
                            }`}
                          />
                        );
                      })}
                    </div>

                    <p className="text-center text-[12px] text-[var(--text-muted)] mt-2">
                      {gridCols}x{gridRows} • {gridCols * gridRows} total slots
                      • Drag to select grid size
                    </p>
                  </div>

                  {/* Preset Quick Buttons */}
                  <div className="px-4 py-2 border-t border-[var(--border-color)]">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Quick Presets
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { cols: 1, rows: 1 },
                        { cols: 2, rows: 2 },
                        { cols: 3, rows: 3 },
                        { cols: 4, rows: 4 },
                        { cols: 6, rows: 6 },
                        { cols: 8, rows: 8 },
                      ].map((preset) => (
                        <button
                          key={`${preset.cols}x${preset.rows}`}
                          onClick={() => {
                            setGridCols(preset.cols);
                            setGridRows(preset.rows);
                          }}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-all ${
                            gridCols === preset.cols && gridRows === preset.rows
                              ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)]"
                              : "bg-[var(--hover-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--primary-color)]/30"
                          }`}
                        >
                          {preset.cols}x{preset.rows}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="px-4 py-3 border-t border-[var(--border-color)] flex items-center gap-2">
                    <button
                      onClick={applyGrid}
                      className="flex-1 px-3 py-2 bg-[var(--primary-color)] text-white text-[13px] font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Apply {gridCols}x{gridRows}
                    </button>
                    <button
                      onClick={() => {
                        setGridCols(2);
                        setGridRows(2);
                        setGrid(4);
                        setShowLayoutPopup(false);
                      }}
                      className="px-3 py-2 text-[13px] bg-[var(--hover-bg)]/80 font-medium text-[var(--text-Dark)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}

              {/* Saved Layouts Tab */}
              {layoutTab === "saved" && (
                <>
                  <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[var(--text-dark)]">
                      Saved Layout
                    </span>
                    <button
                      onClick={() => setShowLayoutSave(true)}
                      className="text-[13px] font-semibold text-[var(--primary-color)] hover:underline"
                    >
                      + New
                    </button>
                  </div>

                  {!showLayoutSave ? (
                    <div className="h-[315px] overflow-y-auto">
                      {savedLayouts.length === 0 ? (
                        <div className="px-3 py-4 h-full flex items-center justify-center text-[15px] text-[var(--text-muted)]">
                          No saved layout yet
                        </div>
                      ) : (
                        savedLayouts.map((layout) => (
                          <div
                            key={layout.id}
                            className="px-3 py-2 hover:bg-[var(--hover-bg)] flex items-center justify-between group overflow-auto
                            "
                          >
                            <button
                              onClick={() => {
                                loadLayout(layout.id);
                                setShowLayoutPopup(false);
                              }}
                              className="flex-1 text-left"
                            >
                              <p className="text-[13px] font-semibold text-[var(--text-dark)]">
                                {layout.name}
                              </p>
                              <p className="text-[13px] text-[var(--text-muted)]">
                                {layout.grid}x{layout.grid} •{" "}
                                {layout.cameras.length} cams
                              </p>
                            </button>
                            <button
                              onClick={() => deleteLayout(layout.id)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <FaTrash size={10} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="p-3 min-h-[290px]">
                      <p className="text-[13px] font-bold text-[var(--text-dark)] mb-2">
                        Save Current Layout
                      </p>
                      <input
                        type="text"
                        value={layoutName}
                        onChange={(e) => setLayoutName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveLayout()
                        }
                        placeholder="Layout name..."
                        autoFocus
                        className="w-full px-2 py-1.5 text-[11px] bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] focus:outline-none focus:border-[var(--primary-color)]"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={handleSaveLayout}
                          className="flex-1 px-2 py-1.5 bg-[var(--primary-color)] text-white text-[10px] font-semibold rounded-lg hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setShowLayoutSave(false)}
                          className="px-2 py-1.5 text-[10px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-bg)] rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Auto-Shift Toggle - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1.5 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg px-2 py-1 md:py-1.5 h-[32px] md:h-[36px]">
          <FaSyncAlt
            size={13}
            className={`${autoShiftEnabled ? "text-[var(--primary-color)] animate-spin spin-slow" : "text-[var(--text-muted)]"}`}
          />
          <span className="text-[11px] font-medium text-[var(--text-dark)] hidden md:block uppercase tracking-wider">
            Auto
          </span>
          <button
            onClick={() => setAutoShiftEnabled(!autoShiftEnabled)}
            className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
              autoShiftEnabled ? "bg-[var(--primary-color)]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${autoShiftEnabled ? "translate-x-4" : ""}`}
            />
          </button>
        </div>

        {autoShiftEnabled && (
          <div className="flex items-center gap-1 bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg px-2 py-1 md:py-1.5 h-[32px] md:h-[36px] animate-fade-in">
            {isCustomTime ? (
              <div className="flex items-center animate-fade-in">
                <input
                  type="text"
                  required
                  value={customTimeVal}
                  onChange={(e) => setCustomTimeVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = parseInt(customTimeVal, 10);
                      if (!isNaN(val) && val >= 1) {
                        setAutoShiftInterval(val * 60);
                        setCustomTimeLabel(`${val} min`);
                        setIsCustomTime(false);
                      }
                    }
                  }}
                  autoFocus
                  placeholder="min"
                  className="w-10 text-sm bg-transparent text-[var(--primary-color)] font-bold focus:outline-none text-center"
                />
                <span className="text-xs font-semibold text-[var(--text-muted)] mx-0.5">
                  min
                </span>
                <button
                  onClick={() => {
                    const val = parseInt(customTimeVal, 10);
                    if (!isNaN(val) && val >= 1) {
                      setAutoShiftInterval(val * 60);
                      setCustomTimeLabel(`${val} min`);
                      setIsCustomTime(false);
                    }
                  }}
                  className="ml-1 text-[10px] font-semibold text-[var(--primary-color)] hover:opacity-80 bg-[var(--primary-color)]/10 px-1.5 py-0.5 rounded"
                >
                  Set
                </button>
                <button
                  onClick={() => setIsCustomTime(false)}
                  className="ml-0.5 p-1 text-[var(--text-muted)] hover:text-red-500 rounded-full hover:bg-black/5"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ) : (
              <select
                value={autoShiftInterval}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setCustomTimeVal(
                      customTimeLabel
                        ? String(parseInt(customTimeLabel, 10))
                        : "",
                    );
                    setIsCustomTime(true);
                  } else {
                    setAutoShiftInterval(Number(val));
                    setCustomTimeLabel("");
                  }
                }}
                className="text-xs bg-transparent text-[var(--text-dark)] font-semibold focus:outline-none cursor-pointer"
              >
                {autoShiftOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                {customTimeLabel && (
                  <option value={autoShiftInterval}>{customTimeLabel}</option>
                )}
                <option value="custom">Custom</option>
              </select>
            )}
          </div>
        )}

        {/* Mobile: Simple 1x1 / 2x2 buttons */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={() => onMobileGridChange(1)}
            className={`px-2.5 h-7 text-[10px] font-bold rounded-lg transition-all ${
              mobileGrid === 1
                ? "bg-[var(--primary-color)] text-white shadow-[0_2px_8px_rgba(var(--primary-color-rgb,124,58,237),0.3)]"
                : "bg-[var(--hover-bg)] text-[var(--text-muted)] border border-[var(--border-color)]"
            }`}
          >
            1x1
          </button>
          <button
            onClick={() => onMobileGridChange(2)}
            className={`px-2.5 h-7 text-[10px] font-bold rounded-lg transition-all ${
              mobileGrid === 2
                ? "bg-[var(--primary-color)] text-white shadow-[0_2px_8px_rgba(var(--primary-color-rgb,124,58,237),0.3)]"
                : "bg-[var(--hover-bg)] text-[var(--text-muted)] border border-[var(--border-color)]"
            }`}
          >
            2x2
          </button>
        </div>

        <button
          onClick={onToggleFullScreen}
          title={isGridFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="hidden md:flex items-center justify-center w-8 h-8 text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:text-[var(--primary-color)] rounded-lg transition-colors focus:outline-none"
        >
          {isGridFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
        </button>

        <div className="hidden sm:block w-px h-5 bg-[var(--border-color)]"></div>

        {/* Event Panel Toggle - hidden on mobile, handled by settings menu */}
        <button
          onClick={() => setShowEventPanel(!showEventPanel)}
          title="Live Events"
          className={`hidden md:flex relative items-center justify-center w-8 h-8 rounded-lg transition-colors focus:outline-none ${
            showEventPanel
              ? "bg-[var(--primary-color)] text-white"
              : "text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:text-[var(--primary-color)]"
          }`}
        >
          <Radio size={18} />
          {unreadEventCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold">
              {unreadEventCount > 99 ? "99+" : unreadEventCount}
            </span>
          )}
        </button>

        <button
          onClick={onRefresh}
          className="hidden md:flex items-center justify-center w-8 h-8 text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:text-[var(--primary-color)] rounded-lg transition-colors focus:outline-none"
        >
          <FaSyncAlt
            size={14}
            className={
              isRefreshing ? "animate-spin text-[var(--primary-color)]" : ""
            }
          />
        </button>

        {/* Mobile: Fullscreen button - Hidden */}
        {/* <button
          onClick={onToggleFullScreen}
          title={isGridFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="flex md:hidden items-center justify-center w-7 h-7 text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:text-[var(--primary-color)] rounded-lg transition-colors focus:outline-none"
        >
          {isGridFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
        </button> */}
      </div>
    </BodyHead>
  );
}

export default StreamingHeader;
