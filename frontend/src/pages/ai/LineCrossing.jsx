import { useState, useEffect, useCallback, useRef } from "react";
import FaceSidebar from "../../components/ai/FaceSidebar";
import VideoPlayer from "../../components/livestream/VideoPlayer";
import BodyHead from "../../components/common/BodyHead";
import BodyContainer from "../../components/common/BodyContainer";
import { useLiveStreaming } from "../../context/LiveStreamingContext";
import { MdOutlineSave, MdRestartAlt, MdDelete } from "react-icons/md";
import { IoReorderThreeOutline } from "react-icons/io5";
import { FaSyncAlt, FaDrawPolygon } from "react-icons/fa";
import { TbLine } from "react-icons/tb";

function LiveClock() {
  const ref = useRef(null);

  useEffect(() => {
    const update = () => {
      if (ref.current) {
        const now = new Date();
        ref.current.textContent =
          now.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }) +
          " " +
          now.toLocaleTimeString("en-US", { hour12: false });
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span ref={ref} className="text-xs text-white font-medium tabular-nums" />
  );
}

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
        enabled ? "bg-[#3b82f6]" : "bg-gray-400"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-36 shrink-0">
        <label className="text-xs font-medium text-[var(--text-dark)]">
          {label}
        </label>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-44 px-2.5 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] text-xs focus:outline-none focus:border-[var(--primary-color)] select-arrow-bg appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SliderField({ label, value, min, max, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-36 shrink-0">
        <label className="text-xs font-medium text-[var(--text-dark)]">
          {label}
        </label>
      </div>
      <div className="flex-1 max-w-xs flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-muted)] w-7 text-right shrink-0">
            {min}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-1.5 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
          />
          <span className="text-[10px] text-[var(--text-muted)] w-7 shrink-0">
            {max}
          </span>
        </div>
        <div className="flex justify-start ml-9">
          <span className="px-2 py-0.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded text-[10px] text-[var(--text-dark)] font-medium">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, min, max, onChange, suffix }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-36 shrink-0">
        <label className="text-xs font-medium text-[var(--text-dark)]">
          {label}
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 px-2.5 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] text-xs focus:outline-none focus:border-[var(--primary-color)] appearance-none [&::-webkit-inner-spin-button]:appearance-auto [&::-webkit-outer-spin-button]:appearance-auto"
        />
        {suffix && (
          <span className="text-[10px] text-[var(--text-muted)]">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function CheckboxGroup({ label, options, selected, onChange }) {
  const toggle = (val) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val],
    );
  };

  return (
    <div className="flex items-start gap-2">
      <div className="flex items-center gap-1 w-36 shrink-0 pt-0.5">
        <label className="text-xs font-medium text-[var(--text-dark)]">
          {label}
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="w-3.5 h-3.5 rounded border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)] accent-[var(--primary-color)]"
            />
            <span className="text-xs text-[var(--text-dark)] group-hover:text-[var(--primary-color)] transition-colors">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function LineOverlay({
  ruleType,
  lines,
  onLinesChange,
  enabled,
  ruleEnable,
  ruleNumber,
  activeRuleIndex,
  onActiveRuleChange,
}) {
  const containerRef = useRef(null);
  const [drawStep, setDrawStep] = useState("idle"); // idle | drawing | done
  const [anchorPoint, setAnchorPoint] = useState(null); // point A during drawing
  const [cursorPos, setCursorPos] = useState(null); // live cursor preview
  const [isDragging, setIsDragging] = useState(null);
  const dragStartedRef = useRef(false);

  const maxRules = parseInt(ruleNumber, 10) || 1;
  const currentLine = lines[activeRuleIndex] || null;
  const canDrawMore = lines.length < maxRules;

  const getMousePos = (e) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  // Reset when toggled off
  useEffect(() => {
    if (!enabled || !ruleEnable) {
      setDrawStep("idle");
      setAnchorPoint(null);
      setCursorPos(null);
      setIsDragging(null);
      onLinesChange([]);
    }
  }, [enabled, ruleEnable]);

  // Reset when lines is cleared externally
  useEffect(() => {
    if (lines === null || (Array.isArray(lines) && lines.length === 0)) {
      setDrawStep("idle");
      setAnchorPoint(null);
      setCursorPos(null);
      setIsDragging(null);
    }
  }, [lines]);

  // Sync with external lines (e.g. loaded from localStorage)
  useEffect(() => {
    if (Array.isArray(lines) && lines.length > 0 && drawStep === "idle") {
      setDrawStep("done");
      // Set active rule index to the next available slot
      setActiveRuleIndex(lines.length < maxRules ? lines.length : 0);
    }
  }, [lines]);

  // Start drawing a new line at the next available rule index
  const startNewLine = () => {
    if (lines.length >= maxRules) return;
    const nextIndex = lines.length;
    onActiveRuleChange(nextIndex);
    setDrawStep("drawing");
    setAnchorPoint(null);
    setCursorPos(null);
  };

  // mousedown: start drag on existing points (done state)
  const handleMouseDown = (e) => {
    if (!enabled || !ruleEnable) return;
    if (drawStep !== "done" || !currentLine) return;
    // Safety: ensure currentLine has valid coordinates
    if (
      typeof currentLine.x1 !== "number" ||
      typeof currentLine.x2 !== "number"
    )
      return;

    const pos = getMousePos(e);
    const distA = Math.hypot(pos.x - currentLine.x1, pos.y - currentLine.y1);
    const distB = Math.hypot(pos.x - currentLine.x2, pos.y - currentLine.y2);

    if (distA < 8) {
      setIsDragging("a");
      dragStartedRef.current = true;
      e.preventDefault();
      return;
    }
    if (distB < 8) {
      setIsDragging("b");
      dragStartedRef.current = true;
      e.preventDefault();
      return;
    }
  };

  // click: draw lines (idle -> drawing -> done)
  const handleClick = (e) => {
    if (!enabled || !ruleEnable) return;

    // If a drag just started via mousedown, skip click handling
    if (dragStartedRef.current) {
      dragStartedRef.current = false;
      return;
    }

    e.stopPropagation();
    const pos = getMousePos(e);

    // DONE state - check if clicking near existing points (for drag)
    if (drawStep === "done" && currentLine) {
      const distA = Math.hypot(pos.x - currentLine.x1, pos.y - currentLine.y1);
      const distB = Math.hypot(pos.x - currentLine.x2, pos.y - currentLine.y2);
      // If clicking near a point, mousedown will handle drag
      if (distA < 8 || distB < 8) return;
      // If we can draw more lines, start the next one
      if (lines.length < maxRules) {
        const nextIndex = lines.length;
        onActiveRuleChange(nextIndex);
        setDrawStep("drawing");
        setAnchorPoint(pos);
        setCursorPos(pos);
        return;
      }
      return;
    }

    // IDLE state - first click starts drawing for next available rule
    if (drawStep === "idle") {
      if (lines.length >= maxRules) return;
      const nextIndex = lines.length;
      onActiveRuleChange(nextIndex);
      setDrawStep("drawing");
      setAnchorPoint(pos);
      setCursorPos(pos);
      return;
    }

    // DRAWING state - second click finalizes point B
    if (drawStep === "drawing" && anchorPoint) {
      const dist = Math.hypot(pos.x - anchorPoint.x, pos.y - anchorPoint.y);
      if (dist < 2) return; // ignore tiny clicks
      const newLine = {
        x1: anchorPoint.x,
        y1: anchorPoint.y,
        x2: pos.x,
        y2: pos.y,
        ruleNumber: activeRuleIndex + 1,
      };
      const updatedLines = [...lines];
      updatedLines[activeRuleIndex] = newLine;
      onLinesChange(updatedLines);
      setDrawStep("done");
      setAnchorPoint(null);
      setCursorPos(null);
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (!enabled || !ruleEnable) return;
    const pos = getMousePos(e);

    // Dragging an endpoint
    if (isDragging === "a" && currentLine) {
      const updatedLines = [...lines];
      updatedLines[activeRuleIndex] = { ...currentLine, x1: pos.x, y1: pos.y };
      onLinesChange(updatedLines);
    } else if (isDragging === "b" && currentLine) {
      const updatedLines = [...lines];
      updatedLines[activeRuleIndex] = { ...currentLine, x2: pos.x, y2: pos.y };
      onLinesChange(updatedLines);
    }

    // Drawing preview - cursor follows mouse
    if (drawStep === "drawing") {
      setCursorPos(pos);
    }
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      return () => window.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  if (!enabled || !ruleEnable) return null;

  // Build arrow helper for a single line
  const renderLine = (line, index) => {
    if (!line) return null;
    const { x1, y1, x2, y2 } = line;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const lineAngle = Math.atan2(y2 - y1, x2 - x1);
    const perpAngleUp = lineAngle - Math.PI / 2;
    const perpAngleDown = lineAngle + Math.PI / 2;
    const arrowLen = 12;
    const arrowHeadLen = 4;
    const arrowHeadWidth = 3;

    const isBidirectional = ruleType === "both";
    const isBtoA = ruleType === "b-to-a";

    const buildArrow = (angle) => {
      const endX = midX + Math.cos(angle) * arrowLen;
      const endY = midY + Math.sin(angle) * arrowLen;
      const baseX = midX + Math.cos(angle) * (arrowLen - arrowHeadLen);
      const baseY = midY + Math.sin(angle) * (arrowLen - arrowHeadLen);
      const head1X = baseX + Math.cos(angle + Math.PI / 2) * arrowHeadWidth;
      const head1Y = baseY + Math.sin(angle + Math.PI / 2) * arrowHeadWidth;
      const head2X = baseX + Math.cos(angle - Math.PI / 2) * arrowHeadWidth;
      const head2Y = baseY + Math.sin(angle - Math.PI / 2) * arrowHeadWidth;
      return { endX, endY, head1X, head1Y, head2X, head2Y };
    };

    const showUp = !isBtoA;
    const showDown = isBtoA || isBidirectional;
    const upArrow = showUp ? buildArrow(perpAngleUp) : null;
    const downArrow = showDown ? buildArrow(perpAngleDown) : null;

    const perpOffset = 4;
    const perpDx = Math.cos(perpAngleUp) * perpOffset;
    const perpDy = Math.sin(perpAngleUp) * perpOffset;
    const aLabelX = midX - perpDx;
    const aLabelY = midY - perpDy;
    const bLabelX = midX + perpDx;
    const bLabelY = midY + perpDy;

    const isActive = index === activeRuleIndex && drawStep === "done";

    return (
      <g key={index} opacity={drawStep === "done" && !isActive ? 0.7 : 1}>
        {/* Main yellow line */}
        <line
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${x2}%`}
          y2={`${y2}%`}
          stroke="#facc15"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Glow */}
        <line
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${x2}%`}
          y2={`${y2}%`}
          stroke="#facc15"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.15"
        />
        {/* UP arrow */}
        {upArrow && (
          <>
            <line
              x1={`${midX}%`}
              y1={`${midY}%`}
              x2={`${upArrow.endX}%`}
              y2={`${upArrow.endY}%`}
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <polygon
              points={`${upArrow.endX}%,${upArrow.endY}% ${upArrow.head1X}%,${upArrow.head1Y}% ${upArrow.head2X}%,${upArrow.head2Y}%`}
              fill="#06b6d4"
            />
          </>
        )}
        {/* DOWN arrow */}
        {downArrow && (
          <>
            <line
              x1={`${midX}%`}
              y1={`${midY}%`}
              x2={`${downArrow.endX}%`}
              y2={`${downArrow.endY}%`}
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <polygon
              points={`${downArrow.endX}%,${downArrow.endY}% ${downArrow.head1X}%,${downArrow.head1Y}% ${downArrow.head2X}%,${downArrow.head2Y}%`}
              fill="#06b6d4"
            />
          </>
        )}
        {/* B label */}
        <rect
          x={`${bLabelX - 2.5}%`}
          y={`${bLabelY - 2}%`}
          width="5%"
          height="3.2%"
          rx="3"
          fill="rgba(0,0,0,0.55)"
        />
        <text
          x={`${bLabelX}%`}
          y={`${bLabelY + 0.3}%`}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#06b6d4"
          fontSize="12"
          fontWeight="bold"
        >
          B
        </text>
        {/* A label */}
        <rect
          x={`${aLabelX - 2.5}%`}
          y={`${aLabelY - 1.8}%`}
          width="5%"
          height="3.2%"
          rx="3"
          fill="rgba(0,0,0,0.55)"
        />
        <text
          x={`${aLabelX}%`}
          y={`${aLabelY + 0.3}%`}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#facc15"
          fontSize="12"
          fontWeight="bold"
        >
          A
        </text>
        {/* Point A */}
        <g style={{ cursor: isActive ? "grab" : "default" }}>
          <rect
            x={x1 - 2}
            y={y1 - 2}
            width="4"
            height="4"
            rx="0.8"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="0.6"
          />
          <circle cx={x1} cy={y1} r="1.8" fill="#ffffff" />
          <circle cx={x1} cy={y1} r="1.3" fill="#ef4444" />
          <text
            x={x1}
            y={y1 + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize="2.2"
            fontWeight="bold"
          >
            {line.ruleNumber || index + 1}
          </text>
        </g>
        {/* Point B */}
        <circle
          cx={`${x2}%`}
          cy={`${y2}%`}
          r="3"
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth="1.5"
          style={{ cursor: isActive ? "grab" : "default" }}
        />
      </g>
    );
  };

  // IDLE: show "click to draw" prompt (only if we can draw more)
  if (drawStep === "idle" && lines.length < maxRules) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-20"
        style={{ cursor: "crosshair" }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {lines.map((line, i) => renderLine(line, i))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-1.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#facc15"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <circle
                  cx="5"
                  cy="12"
                  r="2"
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <circle
                  cx="19"
                  cy="12"
                  r="2"
                  fill="#3b82f6"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="text-white text-xs font-semibold">
                {lines.length === 0
                  ? "Draw Detection Line"
                  : `Draw Line ${lines.length + 1}/${maxRules}`}
              </span>
            </div>
            <p className="text-white/60 text-[10px]">
              Click to set{" "}
              <span className="text-red-400 font-bold">point A</span>, then
              click to set{" "}
              <span className="text-blue-400 font-bold">point B</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // IDLE with all rules drawn - render existing lines
  if (drawStep === "idle" && lines.length >= maxRules) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-20"
        style={{ cursor: "crosshair" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {lines.map((line, i) => renderLine(line, i))}
        </svg>
      </div>
    );
  }

  // DRAWING: First click done, preview line follows cursor
  if (drawStep === "drawing" && anchorPoint && cursorPos) {
    const midX = (anchorPoint.x + cursorPos.x) / 2;
    const midY = (anchorPoint.y + cursorPos.y) / 2;

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-20"
        style={{ cursor: isDragging ? "grabbing" : "crosshair" }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {lines.map((line, i) => renderLine(line, i))}
          <line
            x1={`${anchorPoint.x}%`}
            y1={`${anchorPoint.y}%`}
            x2={`${cursorPos.x}%`}
            y2={`${cursorPos.y}%`}
            stroke="#facc15"
            strokeWidth="2"
            strokeDasharray="6 3"
            opacity="0.7"
          />
          <circle
            cx={`${anchorPoint.x}%`}
            cy={`${anchorPoint.y}%`}
            r="5"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <text
            x={`${anchorPoint.x}%`}
            y={`${anchorPoint.y - 3}%`}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            stroke="#000000"
            strokeWidth="0.3"
          >
            A
          </text>
          <circle
            cx={`${cursorPos.x}%`}
            cy={`${cursorPos.y}%`}
            r="3"
            fill="#facc15"
            opacity="0.8"
          />
          <text
            x={`${midX}%`}
            y={`${midY - 3}%`}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            stroke="#000000"
            strokeWidth="0.2"
            opacity="0.7"
          >
            Click to place B ({lines.length + 1}/{maxRules})
          </text>
        </svg>
      </div>
    );
  }

  // DONE: Render all lines - click to add more or drag to adjust
  if (drawStep === "done" || (Array.isArray(lines) && lines.length > 0)) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-20"
        style={{ cursor: isDragging ? "grabbing" : "crosshair" }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {lines.map((line, i) => renderLine(line, i))}
        </svg>
        {/* Hint when more lines can be drawn */}
        {lines.length < maxRules && drawStep === "done" && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-white/70 text-[10px]">
                Click to draw line {lines.length + 1}/{maxRules}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function LineCrossing() {
  const { cameraGroups, cameraStreams, openGroups, toggleGroup } =
    useLiveStreaming();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectCamera = useCallback((cam) => {
    setSelectedCamera((prev) => (prev === cam ? null : cam));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setShowSidebar(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const defaultConfig = {
    enable: false,
    dynamicMarking: false,
    sensitivity: 50,
    targetValidity: "3",
    minPixel: 64,
    maxPixel: 640,
    detectionTargets: [],
    ruleNumber: "1",
    ruleEnable: true,
    ruleType: "a-to-b",
  };

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("vms_line_config");
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  });

  const [lines, setLines] = useState(() => {
    try {
      const saved = localStorage.getItem("vms_line_points");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Handle legacy single-line format
        if (parsed && !Array.isArray(parsed)) {
          return [{ ...parsed, ruleNumber: 1 }];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });
  const [activeRuleIndex, setActiveRuleIndex] = useState(0);

  const handleToggle = (key) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSliderChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleSave = () => {
    localStorage.setItem("vms_line_config", JSON.stringify(config));
    if (lines && lines.length > 0) {
      localStorage.setItem("vms_line_points", JSON.stringify(lines));
    } else {
      localStorage.removeItem("vms_line_points");
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setVideoKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleResetConfig = useCallback(() => {
    setConfig({
      enable: false,
      dynamicMarking: false,
      sensitivity: 50,
      targetValidity: "3",
      minPixel: 64,
      maxPixel: 640,
      detectionTargets: [],
      ruleNumber: "1",
      ruleEnable: true,
      ruleType: "a-to-b",
    });
    setLines([]);
    setActiveRuleIndex(0);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  // Trim excess lines when ruleNumber changes to a smaller value
  useEffect(() => {
    const maxRules = parseInt(config.ruleNumber, 10) || 1;
    if (lines.length > maxRules) {
      setLines((prev) => prev.slice(0, maxRules));
      setActiveRuleIndex((prev) => Math.min(prev, maxRules - 1));
    }
  }, [config.ruleNumber, lines.length]);

  return (
    <div className="h-full w-full flex bg-[var(--bg-color)] text-[var(--text-dark)] overflow-hidden relative">
      <FaceSidebar
        isMobile={isMobile}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        cameraGroups={cameraGroups}
        openGroups={openGroups}
        toggleGroup={toggleGroup}
        onSelectCamera={handleSelectCamera}
        selectedCamera={selectedCamera}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <BodyHead className="gap-2">
          <div className="flex items-center gap-2 shrink-0 overflow-hidden">
            <button
              onClick={handleToggleSidebar}
              className="p-1.5 text-[var(--text-dark)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors focus:outline-none"
            >
              <IoReorderThreeOutline
                size={22}
                className="text-[var(--text-dark)]"
              />
            </button>

            <div className="flex-shrink-0 hidden sm:flex">
              <TbLine className="text-[var(--primary-color)] text-[22px]" />
            </div>

            <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none truncate flex items-center gap-1.5">
              <span className="hidden sm:inline">Line Crossing</span>
              <span className="inline sm:hidden">Line Config</span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              className="hidden md:flex items-center justify-center w-8 h-8 text-[var(--text-dark)] hover:bg-[var(--hover-bg)] hover:text-[var(--primary-color)] rounded-lg transition-colors focus:outline-none"
            >
              <FaSyncAlt
                size={14}
                className={
                  isRefreshing ? "animate-spin text-[var(--primary-color)]" : ""
                }
              />
            </button>
          </div>
        </BodyHead>

        <BodyContainer>
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col xl:flex-row gap-3 p-3">
              <div
                className={`flex-1 max-w-2xl space-y-2 transition-opacity duration-200 ${!config.enable ? "opacity-50 pointer-events-none select-none" : ""}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="w-36 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Enable
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.enable}
                      onToggle={() => handleToggle("enable")}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-36 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Dynamic Marking
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.dynamicMarking}
                      onToggle={() => handleToggle("dynamicMarking")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <SliderField
                    label="Sensitivity"
                    value={config.sensitivity}
                    min={0}
                    max={100}
                    onChange={(v) => handleSliderChange("sensitivity", v)}
                  />

                  <SelectField
                    label="Target Validity"
                    value={config.targetValidity}
                    onChange={(v) => handleSelectChange("targetValidity", v)}
                    options={[
                      { value: "1", label: "1" },
                      { value: "2", label: "2" },
                      { value: "3", label: "3" },
                      { value: "5", label: "5" },
                      { value: "10", label: "10" },
                    ]}
                  />

                  <SliderField
                    label="Min Pixel"
                    value={config.minPixel}
                    min={64}
                    max={1080}
                    onChange={(v) => handleSliderChange("minPixel", v)}
                  />

                  <SliderField
                    label="Max Pixel"
                    value={config.maxPixel}
                    min={320}
                    max={1080}
                    onChange={(v) => handleSliderChange("maxPixel", v)}
                  />

                  <CheckboxGroup
                    label="Detection Target"
                    options={[
                      { value: "pedestrian", label: "Pedestrian" },
                      { value: "motor-vehicle", label: "Motor Vehicle" },
                      {
                        value: "non-motorized",
                        label: "Non-motorized Vehicle",
                      },
                    ]}
                    selected={config.detectionTargets}
                    onChange={(v) =>
                      setConfig((prev) => ({ ...prev, detectionTargets: v }))
                    }
                  />

                  <SelectField
                    label="Rule Number"
                    value={config.ruleNumber}
                    onChange={(v) => handleSelectChange("ruleNumber", v)}
                    options={[
                      { value: "1", label: "1" },
                      { value: "2", label: "2" },
                      { value: "3", label: "3" },
                      { value: "4", label: "4" },
                    ]}
                  />

                  <div className="flex items-center gap-2">
                    <div className="w-36 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Rule Enable
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.ruleEnable}
                      onToggle={() => handleToggle("ruleEnable")}
                    />
                  </div>

                  <SelectField
                    label="Rule Type"
                    value={config.ruleType}
                    onChange={(v) => handleSelectChange("ruleType", v)}
                    options={[
                      { value: "a-to-b", label: "A->B" },
                      { value: "b-to-a", label: "B->A" },
                      { value: "both", label: "A<->B" },
                    ]}
                  />
                </div>
              </div>

              <div className="w-full xl:w-[480px] shrink-0">
                <div className="relative bg-[#000] rounded-xl overflow-hidden aspect-[4/3] border border-[var(--border-color)]">
                  {selectedCamera ? (
                    <>
                      <VideoPlayer
                        key={`${selectedCamera}-${videoKey}`}
                        url={cameraStreams[selectedCamera]}
                        muted={true}
                        objectFit="object-cover"
                      />
                      <LineOverlay
                        ruleType={config.ruleType}
                        lines={lines}
                        onLinesChange={setLines}
                        enabled={config.enable}
                        ruleEnable={config.ruleEnable}
                        ruleNumber={config.ruleNumber}
                        activeRuleIndex={activeRuleIndex}
                        onActiveRuleChange={setActiveRuleIndex}
                      />
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-3 py-2 flex items-center justify-between z-10">
                        <span className="text-xs text-white font-medium">
                          {selectedCamera}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] text-white font-medium">
                            REC
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 z-10">
                        <LiveClock />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl text-gray-500 mx-auto mb-3">
                          📹
                        </div>
                        <p className="text-sm text-gray-400">
                          Live Camera Feed
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Select a camera from the sidebar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Line Drawing Controls */}
                {config.enable && config.ruleEnable && selectedCamera && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <button
                      onClick={() => {
                        if (lines.length > 0) {
                          const updated = [...lines];
                          updated.splice(activeRuleIndex, 1);
                          setLines(updated);
                          setActiveRuleIndex(
                            Math.min(activeRuleIndex, updated.length - 1),
                          );
                        }
                      }}
                      disabled={lines.length === 0}
                      className="px-4 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-dark)] text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setLines([]);
                        setActiveRuleIndex(0);
                      }}
                      disabled={lines.length === 0}
                      className="px-4 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-dark)] text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-3 py-2 border-t border-[var(--border-color)] flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary-color)] hover:opacity-90 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <MdOutlineSave className="text-sm" />
              Save
            </button>
            {saveSuccess && (
              <span className="text-xs text-green-500 font-medium">
                Saved successfully!
              </span>
            )}
            <button
              onClick={handleResetConfig}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-dark)] text-xs font-medium rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </BodyContainer>
      </div>
    </div>
  );
}

export default LineCrossing;
