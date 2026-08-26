import { useState, useRef, useCallback, useEffect } from "react";
import { FaTimes, FaPlay, FaCog, FaTrash } from "react-icons/fa";

const directionButtons = [
  { label: "Up-Left", dir: "up-left" },
  { label: "Up", dir: "up" },
  { label: "Up-Right", dir: "up-right" },
  { label: "Left", dir: "left" },
  { label: "Home", dir: "home" },
  { label: "Right", dir: "right" },
  { label: "Down-Left", dir: "down-left" },
  { label: "Down", dir: "down" },
  { label: "Down-Right", dir: "down-right" },
];

const defaultPresets = Array.from({ length: 15 }, (_, i) => ({
  no: i,
  name: `${i + 1}`,
  time: 15,
}));

const PTZPanel = ({ cameraName, onClose, fullHeight }) => {
  const [zoom, setZoom] = useState(50);
  const [focus, setFocus] = useState(0);
  const [speed, setSpeed] = useState(3);
  const [presets] = useState(defaultPresets);
  const [dragDir, setDragDir] = useState(null);
  const padRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDirection = (dir) => {
    console.log(`PTZ ${cameraName}: ${dir}`);
  };

  const stopProp = (e) => e.stopPropagation();

  const getDirectionFromPosition = useCallback((clientX, clientY) => {
    if (!padRef.current) return null;
    const rect = padRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) return "home";
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle >= -22.5 && angle < 22.5) return "right";
    if (angle >= 22.5 && angle < 67.5) return "down-right";
    if (angle >= 67.5 && angle < 112.5) return "down";
    if (angle >= 112.5 && angle < 157.5) return "down-left";
    if (angle >= 157.5 || angle < -157.5) return "left";
    if (angle >= -157.5 && angle < -112.5) return "up-left";
    if (angle >= -112.5 && angle < -67.5) return "up";
    if (angle >= -67.5 && angle < -22.5) return "up-right";
    return null;
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const dir = getDirectionFromPosition(e.clientX, e.clientY);
    if (dir) {
      setDragDir(dir);
      handleDirection(dir);
    }
  }, [getDirectionFromPosition]);

  const handlePointerMove = useCallback((e) => {
    if (dragDir === null) return;
    const dir = getDirectionFromPosition(e.clientX, e.clientY);
    if (dir && dir !== dragDir) {
      setDragDir(dir);
      handleDirection(dir);
    }
  }, [dragDir, getDirectionFromPosition]);

  const handlePointerUp = useCallback(() => {
    setDragDir(null);
  }, []);

  useEffect(() => {
    if (dragDir !== null) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [dragDir, handlePointerMove, handlePointerUp]);

  const handleZoomIn = () => setZoom((z) => Math.min(100, z + 10));
  const handleZoomOut = () => setZoom((z) => Math.max(0, z - 10));
  const handleFocusIn = () => setFocus((f) => Math.min(100, f + 10));
  const handleFocusOut = () => setFocus((f) => Math.max(0, f - 10));
  const handleSpeedUp = () => setSpeed((s) => Math.min(100, s + 10));
  const handleSpeedDown = () => setSpeed((s) => Math.max(0, s - 10));

  if (fullHeight) {
    // Mobile compact PTZ panel (bottom-left corner)
    if (isMobile) {
      return (
        <div
          className="vms-dropdown absolute bottom-16 left-3 z-30 w-[180px]"
          onDoubleClick={stopProp}
          onPointerDown={stopProp}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success-color)] shadow-[0_0_6px_var(--success-color)]"></div>
              <span className="text-[9px] font-bold tracking-wider text-[var(--text-dark)]/90 uppercase">PTZ</span>
            </div>
            <button
              onClick={onClose}
              className="w-5 h-5 rounded-full bg-[var(--hover-bg)] flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-[var(--text-dark)]"
            >
              <FaTimes size={8} />
            </button>
          </div>

          <div className="p-2 space-y-2">
            {/* Directional Pad - Compact */}
            <div className="flex justify-center">
              <div className="relative">
                <div
                  ref={padRef}
                  onPointerDown={handlePointerDown}
                  className="w-[90px] h-[90px] rounded-full bg-[var(--hover-bg)] border border-[var(--border-color)] flex items-center justify-center cursor-pointer touch-none select-none"
                >
                  <div className="w-[60px] h-[60px] rounded-full bg-[var(--primary-light)] border border-[var(--primary-color)]/30 flex items-center justify-center pointer-events-none">
                    <button
                      onClick={() => handleDirection("home")}
                      onDoubleClick={stopProp}
                      className="w-7 h-7 rounded-full bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border border-[var(--primary-color)] flex items-center justify-center transition-all active:scale-95 shadow-sm pointer-events-auto"
                      title="Home"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </button>
                  </div>
                </div>
                {directionButtons.filter(b => b.dir !== "home").map((btn) => {
                  const angle = {
                    "up": -90, "up-right": -45, "right": 0,
                    "down-right": 45, "down": 90, "down-left": 135,
                    "left": 180, "up-left": -135,
                  }[btn.dir];
                  const radius = 33;
                  const rad = (angle * Math.PI) / 180;
                  const x = 45 + radius * Math.cos(rad) - 8;
                  const y = 45 + radius * Math.sin(rad) - 8;
                  const isActive = dragDir === btn.dir;
                  return (
                    <button
                      key={btn.dir}
                      onClick={() => handleDirection(btn.dir)}
                      onDoubleClick={stopProp}
                      className={`absolute w-4 h-4 rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-sm pointer-events-none ${
                        isActive
                          ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white"
                          : "bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border-[var(--primary-color)]/60 text-white"
                      }`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      title={btn.label}
                    >
                      <svg width="6" height="6" viewBox="0 0 24 24" fill="white">
                        {btn.dir === "up" && <polygon points="12,4 20,20 4,20" />}
                        {btn.dir === "down" && <polygon points="12,20 20,4 4,4" />}
                        {btn.dir === "left" && <polygon points="4,12 20,4 20,20" />}
                        {btn.dir === "right" && <polygon points="20,12 4,4 4,20" />}
                        {btn.dir === "up-left" && <polygon points="4,4 20,4 4,20" />}
                        {btn.dir === "up-right" && <polygon points="20,4 4,4 20,20" />}
                        {btn.dir === "down-left" && <polygon points="4,20 20,20 4,4" />}
                        {btn.dir === "down-right" && <polygon points="20,20 4,20 20,4" />}
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zoom / Focus - Compact */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-0.5 w-full">
                  <button onClick={handleZoomOut} onDoubleClick={stopProp} className="w-5 h-5 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 flex items-center justify-center text-[8px] font-bold text-white">-</button>
                  <div className="flex-1">
                    <div className="w-full h-1.5 bg-[var(--hover-bg)] rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div className="h-full bg-[var(--primary-color)] rounded-full transition-all" style={{ width: `${zoom}%` }} />
                    </div>
                  </div>
                  <button onClick={handleZoomIn} onDoubleClick={stopProp} className="w-5 h-5 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 flex items-center justify-center text-[8px] font-bold text-white">+</button>
                </div>
                <span className="text-[7px] font-semibold text-[var(--text-muted)] tracking-wider">ZOOM</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-0.5 w-full">
                  <button onClick={handleFocusOut} onDoubleClick={stopProp} className="w-5 h-5 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 flex items-center justify-center text-[8px] font-bold text-white">-</button>
                  <div className="flex-1">
                    <div className="w-full h-1.5 bg-[var(--hover-bg)] rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div className="h-full bg-[var(--primary-color)] rounded-full transition-all" style={{ width: `${focus}%` }} />
                    </div>
                  </div>
                  <button onClick={handleFocusIn} onDoubleClick={stopProp} className="w-5 h-5 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 flex items-center justify-center text-[8px] font-bold text-white">+</button>
                </div>
                <span className="text-[7px] font-semibold text-[var(--text-muted)] tracking-wider">FOCUS</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1">
              <button onDoubleClick={stopProp} className="flex-1 py-1 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-[8px] font-semibold text-white">AutoFocus</button>
              <button onDoubleClick={stopProp} className="flex-1 py-1 rounded bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] text-[8px] font-semibold text-[var(--text-dark)]">Restore</button>
            </div>
          </div>
        </div>
      );
    }

    // Desktop full-height PTZ panel
    return (
      <div
        className="h-full flex flex-col bg-[var(--card-bg)] border-r border-[var(--border-color)]"
        onDoubleClick={stopProp}
        onPointerDown={stopProp}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--success-color)] shadow-[0_0_8px_var(--success-color)]"></div>
            <span className="text-xs font-semibold tracking-widest text-[var(--text-dark)]/90 uppercase">PTZ Control</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--hover-bg)] px-2 py-0.5 rounded font-mono">{cameraName}</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-[var(--text-dark)]"
            >
              <FaTimes size={10} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin">
          {/* Directional Pad - Larger, more prominent */}
          <div className="flex flex-col items-center pt-4">
            <div className="relative">
              <div
                ref={padRef}
                onPointerDown={handlePointerDown}
                className={`rounded-full bg-[var(--hover-bg)]/50 border border-[var(--border-color)] flex items-center justify-center shadow-[inset_0_0_40px_rgba(0,0,0,0.4)] cursor-pointer touch-none select-none ${isMobile ? "w-[140px] h-[140px]" : "w-[180px] h-[180px]"}`}
              >
                <div className={`rounded-full bg-[var(--hover-bg)]/30 border border-[var(--border-color)] flex items-center justify-center shadow-[inset_0_0_25px_rgba(0,0,0,0.3)] pointer-events-none ${isMobile ? "w-[100px] h-[100px]" : "w-[130px] h-[130px]"}`}>
                  <button
                    onClick={() => handleDirection("home")}
                    onDoubleClick={stopProp}
                    className={`rounded-full bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-[var(--primary-color)]/30 border border-[var(--primary-color)]/30 pointer-events-auto ${isMobile ? "w-9 h-9" : "w-12 h-12"}`}
                    title="Home"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </button>
                </div>
              </div>
              {directionButtons.filter(b => b.dir !== "home").map((btn) => {
                const angle = {
                  "up": -90, "up-right": -45, "right": 0,
                  "down-right": 45, "down": 90, "down-left": 135,
                  "left": 180, "up-left": -135,
                }[btn.dir];
                const padSize = isMobile ? 140 : 180;
                const radius = isMobile ? 52 : 66;
                const rad = (angle * Math.PI) / 180;
                const x = (padSize / 2) + radius * Math.cos(rad) - (isMobile ? 11 : 14);
                const y = (padSize / 2) + radius * Math.sin(rad) - (isMobile ? 11 : 14);
                const isActive = dragDir === btn.dir;
                return (
                  <button
                    key={btn.dir}
                    onClick={() => handleDirection(btn.dir)}
                    onDoubleClick={stopProp}
                    className={`absolute rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-md pointer-events-none ${isMobile ? "w-6 h-6" : "w-7 h-7"} ${
                      isActive
                        ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white"
                        : "bg-[var(--hover-bg)] hover:bg-[var(--primary-color)]/80 border-[var(--border-color)] hover:border-[var(--primary-color)]/50 text-[var(--text-dark)]"
                    }`}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    title={btn.label}
                  >
                    <svg width={isMobile ? "10" : "12"} height={isMobile ? "10" : "12"} viewBox="0 0 24 24" fill={isActive ? "white" : "currentColor"}>
                      {btn.dir === "up" && <polygon points="12,4 20,20 4,20" />}
                      {btn.dir === "down" && <polygon points="12,20 20,4 4,4" />}
                      {btn.dir === "left" && <polygon points="4,12 20,4 20,20" />}
                      {btn.dir === "right" && <polygon points="20,12 4,4 4,20" />}
                      {btn.dir === "up-left" && <polygon points="4,4 20,4 4,20" />}
                      {btn.dir === "up-right" && <polygon points="20,4 4,4 20,20" />}
                      {btn.dir === "down-left" && <polygon points="4,20 20,20 4,4" />}
                      {btn.dir === "down-right" && <polygon points="20,20 4,20 20,4" />}
                    </svg>
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] mt-2 tracking-widest uppercase">Directional Pad</span>
          </div>

          <div className="border-t border-[var(--border-color)] pt-3">
            {/* Zoom / Focus - Full width with better spacing */}
            <div className="space-y-3">
              {/* Zoom */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">Zoom</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]/70">{zoom}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleZoomOut} onDoubleClick={stopProp} className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] flex items-center justify-center text-sm font-bold text-[var(--text-dark)] transition-all active:scale-95 shrink-0">-</button>
                  <div className="flex-1 relative">
                    <div className="w-full h-2.5 bg-[var(--hover-bg)] rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div className="h-full bg-[var(--primary-color)] rounded-full transition-all shadow-[0_0_12px_var(--primary-color)]" style={{ width: `${zoom}%` }} />
                    </div>
                  </div>
                  <button onClick={handleZoomIn} onDoubleClick={stopProp} className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] flex items-center justify-center text-sm font-bold text-[var(--text-dark)] transition-all active:scale-95 shrink-0">+</button>
                </div>
              </div>

              {/* PTZ Speed */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">PTZ Speed</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]/70">{speed}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleSpeedDown} onDoubleClick={stopProp} className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] flex items-center justify-center text-sm font-bold text-[var(--text-dark)] transition-all active:scale-95 shrink-0">-</button>
                  <div className="flex-1 relative">
                    <div className="w-full h-2.5 bg-[var(--hover-bg)] rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div className="h-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-color)]/70 rounded-full transition-all shadow-[0_0_12px_var(--primary-color)]" style={{ width: `${speed}%` }} />
                    </div>
                  </div>
                  <button onClick={handleSpeedUp} onDoubleClick={stopProp} className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] flex items-center justify-center text-sm font-bold text-[var(--text-dark)] transition-all active:scale-95 shrink-0">+</button>
                </div>
              </div>

              {/* Focus */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                      <polygon points="12,2 15,10 22,10 16,15 18,22 12,18 6,22 8,15 2,10 9,10" />
                    </svg>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase">Focus</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]/70">{focus}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleFocusOut} onDoubleClick={stopProp} className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] flex items-center justify-center text-sm font-bold text-[var(--text-dark)] transition-all active:scale-95 shrink-0">-</button>
                  <div className="flex-1 relative">
                    <div className="w-full h-2.5 bg-[var(--hover-bg)] rounded-full overflow-hidden border border-[var(--border-color)]">
                      <div className="h-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-color)]/70 rounded-full transition-all shadow-[0_0_12px_var(--primary-color)]" style={{ width: `${focus}%` }} />
                    </div>
                  </div>
                  <button onClick={handleFocusIn} onDoubleClick={stopProp} className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] flex items-center justify-center text-sm font-bold text-[var(--text-dark)] transition-all active:scale-95 shrink-0">+</button>
                </div>
               </div>
             </div>
           </div>

           {/* Action buttons - full width, side by side */}
          <div className="grid grid-cols-2 gap-2">
            <button onDoubleClick={stopProp} className="py-2.5 rounded-xl bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-xs font-semibold text-white transition-all shadow-lg shadow-[var(--primary-color)]/20 active:scale-[0.98]">
              AutoFocus
            </button>
            <button onDoubleClick={stopProp} className="py-2.5 rounded-xl bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] text-xs font-semibold text-[var(--text-dark)]/90 transition-all active:scale-[0.98]">
              Restore
            </button>
          </div>

          {/* Preset section - flex to fill remaining space */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-[var(--text-dark)]/70 tracking-wide uppercase">Camera Presets</span>
              <div className="flex items-center gap-2">
                <button onDoubleClick={stopProp} className="px-2 py-1 rounded-lg bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] transition-all flex items-center gap-1">
                  <FaPlay size={8} /> Run All
                </button>
                <input type="checkbox" onDoubleClick={stopProp} className="w-3.5 h-3.5 rounded accent-[var(--primary-color)]" />
              </div>
            </div>

            <div className="bg-[var(--hover-bg)] rounded-xl border border-[var(--border-color)] flex-1 overflow-y-auto scrollbar-thin min-h-[100px] max-h-none">
              <div className="grid grid-cols-[32px_1fr_36px_60px] gap-1.5 px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)]/60 border-b border-[var(--border-color)] sticky top-0 bg-[var(--card-bg)]">
                <span>No.</span>
                <span>Name</span>
                <span>Time</span>
                <span className="text-right">Action</span>
              </div>
              {presets.map((preset) => (
                <div
                  key={preset.no}
                  className="grid grid-cols-[32px_1fr_36px_60px] gap-1.5 px-3 py-2 text-[11px] border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--card-bg)] transition-colors"
                >
                  <span className="text-[var(--text-muted)]/60 font-mono">{String(preset.no).padStart(2, '0')}</span>
                  <span className="text-[var(--text-dark)]/80 font-medium">{preset.name}</span>
                  <span className="text-[var(--text-muted)]/60 font-mono">{preset.time}s</span>
                  <div className="flex items-center justify-end gap-1">
                    <button onDoubleClick={stopProp} className="p-1.5 hover:bg-[var(--primary-color)]/20 rounded-lg transition-colors text-[var(--primary-color)]" title="Go to preset"><FaPlay size={8} /></button>
                    <button onDoubleClick={stopProp} className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg transition-colors text-[var(--text-muted)]/60 hover:text-[var(--text-dark)]/70" title="Settings"><FaCog size={8} /></button>
                    <button onDoubleClick={stopProp} className="p-1.5 hover:bg-[var(--danger-color)]/20 rounded-lg transition-colors text-[var(--danger-color)]/60 hover:text-[var(--danger-color)]" title="Delete"><FaTrash size={8} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Camera info footer */}
          <div className="border-t border-[var(--border-color)] pt-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[var(--text-muted)]/60 tracking-wider uppercase">Bitrate</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">2.4 Mbps</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[var(--text-muted)]/60 tracking-wider uppercase">Resolution</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">1920x1080</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[var(--text-muted)]/60 tracking-wider uppercase">FPS</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">30</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[var(--text-muted)]/60 tracking-wider uppercase">Status</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--success-color)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-color)] shadow-[0_0_6px_var(--success-color)]"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-[var(--card-bg)] border-t border-[var(--border-color)] rounded-t-xl shadow-lg overflow-hidden"
      onDoubleClick={stopProp}
      onPointerDown={stopProp}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[var(--primary-color)] shrink-0">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="text-xs font-bold tracking-wide text-white">PTZ</span>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
        >
          <FaTimes size={8} />
        </button>
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Directional Pad - smaller */}
        <div className="flex justify-center">
          <div className="relative">
            <div
              ref={padRef}
              onPointerDown={handlePointerDown}
              className="w-[100px] h-[100px] rounded-full bg-[var(--hover-bg)] border border-[var(--border-color)] flex items-center justify-center cursor-pointer touch-none select-none"
            >
              <div className="w-[68px] h-[68px] rounded-full bg-[var(--primary-light)] border border-[var(--primary-color)]/30 flex items-center justify-center pointer-events-none">
                <button
                  onClick={() => handleDirection("home")}
                  onDoubleClick={stopProp}
                  className="w-7 h-7 rounded-full bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border border-[var(--primary-color)] flex items-center justify-center transition-all active:scale-95 shadow-sm pointer-events-auto"
                  title="Home"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </button>
              </div>
            </div>
            {directionButtons.filter(b => b.dir !== "home").map((btn) => {
              const angle = {
                "up": -90, "up-right": -45, "right": 0,
                "down-right": 45, "down": 90, "down-left": 135,
                "left": 180, "up-left": -135,
              }[btn.dir];
              const radius = 37;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + radius * Math.cos(rad) - 9;
              const y = 50 + radius * Math.sin(rad) - 9;
              const isActive = dragDir === btn.dir;
              return (
                <button
                  key={btn.dir}
                  onClick={() => handleDirection(btn.dir)}
                  onDoubleClick={stopProp}
                  className={`absolute w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-sm pointer-events-none ${
                    isActive
                      ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white"
                      : "bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border-[var(--primary-color)]/60 text-white"
                  }`}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  title={btn.label}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                    {btn.dir === "up" && <polygon points="12,4 20,20 4,20" />}
                    {btn.dir === "down" && <polygon points="12,20 20,4 4,4" />}
                    {btn.dir === "left" && <polygon points="4,12 20,4 20,20" />}
                    {btn.dir === "right" && <polygon points="20,12 4,4 4,20" />}
                    {btn.dir === "up-left" && <polygon points="4,4 20,4 4,20" />}
                    {btn.dir === "up-right" && <polygon points="20,4 4,4 20,20" />}
                    {btn.dir === "down-left" && <polygon points="4,20 20,20 4,4" />}
                    {btn.dir === "down-right" && <polygon points="20,20 4,20 20,4" />}
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoom / Focus - 2 columns, no Iris */}
        <div className="grid grid-cols-2 gap-2">
          {/* Zoom */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 w-full">
              <button onClick={handleZoomOut} onDoubleClick={stopProp} className="w-6 h-6 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border border-[var(--primary-color)]/60 flex items-center justify-center text-[10px] font-bold text-white transition-colors">-</button>
              <div className="flex-1 relative">
                <div className="w-full h-[6px] bg-[var(--hover-bg)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div className="h-full bg-[var(--primary-color)] rounded-full transition-all" style={{ width: `${zoom}%` }} />
                </div>
              </div>
              <button onClick={handleZoomIn} onDoubleClick={stopProp} className="w-6 h-6 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border border-[var(--primary-color)]/60 flex items-center justify-center text-[10px] font-bold text-white transition-colors">+</button>
            </div>
            <div className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="text-[8px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">Zoom</span>
            </div>
          </div>

          {/* Focus */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 w-full">
              <button onClick={handleFocusOut} onDoubleClick={stopProp} className="w-6 h-6 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border border-[var(--primary-color)]/60 flex items-center justify-center text-[10px] font-bold text-white transition-colors">-</button>
              <div className="flex-1 relative">
                <div className="w-full h-[6px] bg-[var(--hover-bg)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div className="h-full bg-[var(--primary-color)] rounded-full transition-all" style={{ width: `${focus}%` }} />
                </div>
              </div>
              <button onClick={handleFocusIn} onDoubleClick={stopProp} className="w-6 h-6 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border border-[var(--primary-color)]/60 flex items-center justify-center text-[10px] font-bold text-white transition-colors">+</button>
            </div>
            <div className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                <polygon points="12,2 15,10 22,10 16,15 18,22 12,18 6,22 8,15 2,10 9,10" />
              </svg>
              <span className="text-[8px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">Focus</span>
            </div>
          </div>
        </div>

        {/* Action buttons - no Refresh */}
        <div className="flex gap-1.5">
          <button onDoubleClick={stopProp} className="flex-1 py-1 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border border-[var(--primary-color)]/60 text-[10px] font-semibold text-white transition-colors">
            AutoFocus
          </button>
          <button onDoubleClick={stopProp} className="flex-1 py-1 rounded bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 border border-[var(--primary-color)]/60 text-[10px] font-semibold text-white transition-colors">
            Restore
          </button>
        </div>

        {/* Preset section with scroll */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-[var(--text-dark)]">Preset</span>
            <div className="flex items-center gap-1.5">
              <button onDoubleClick={stopProp} className="p-0.5 rounded hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-muted)]" title="Play Preset">
                <FaPlay size={8} />
              </button>
              <input type="checkbox" onDoubleClick={stopProp} className="w-2.5 h-2.5 accent-[var(--primary-color)]" />
            </div>
          </div>

          <div className="bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] max-h-[100px] overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-[24px_1fr_30px_52px] gap-1 px-2 py-1 text-[9px] font-semibold text-[var(--text-muted)] border-b border-[var(--border-color)] sticky top-0 bg-[var(--hover-bg)]">
              <span>No.</span>
              <span>Name</span>
              <span>Time</span>
              <span className="text-right">Operation</span>
            </div>
            {presets.map((preset) => (
              <div
                key={preset.no}
                className="grid grid-cols-[24px_1fr_30px_52px] gap-1 px-2 py-1 text-[10px] border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--card-bg)] transition-colors"
              >
                <span className="text-[var(--text-muted)]">{preset.no}</span>
                <span className="text-[var(--text-dark)] font-medium">{preset.name}</span>
                <span className="text-[var(--text-muted)]">{preset.time}</span>
                <div className="flex items-center justify-end gap-0.5">
                  <button onDoubleClick={stopProp} className="p-0.5 hover:bg-[var(--primary-color)]/10 rounded transition-colors text-[var(--primary-color)]" title="Go to preset"><FaPlay size={7} /></button>
                  <button onDoubleClick={stopProp} className="p-0.5 hover:bg-[var(--primary-color)]/10 rounded transition-colors text-[var(--text-muted)]" title="Settings"><FaCog size={7} /></button>
                  <button onDoubleClick={stopProp} className="p-0.5 hover:bg-[var(--danger-color)]/10 rounded transition-colors text-[var(--danger-color)]" title="Delete"><FaTrash size={7} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PTZPanel;
