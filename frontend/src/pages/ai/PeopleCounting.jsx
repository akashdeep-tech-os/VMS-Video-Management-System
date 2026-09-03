import { useState, useEffect, useCallback, useRef } from "react";
import FaceSidebar from "../../components/ai/FaceSidebar";
import VideoPlayer from "../../components/livestream/VideoPlayer";
import BodyHead from "../../components/common/BodyHead";
import BodyContainer from "../../components/common/BodyContainer";
import { useLiveStreaming } from "../../context/LiveStreamingContext";
import { IoMdPeople } from "react-icons/io";
import { MdOutlineSave, MdRestartAlt } from "react-icons/md";
import { IoReorderThreeOutline } from "react-icons/io5";
import { FaSyncAlt } from "react-icons/fa";

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

// Counting Line Overlay - similar to Line Crossing but for people counting
function CountingLineOverlay({
  linePoints,
  onLineChange,
  enabled,
  detectionDirection,
}) {
  const containerRef = useRef(null);
  const [drawStep, setDrawStep] = useState("idle");
  const [anchorPoint, setAnchorPoint] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);
  const [isDragging, setIsDragging] = useState(null);
  const dragStartedRef = useRef(false);

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

  useEffect(() => {
    if (!enabled) {
      setDrawStep("idle");
      setAnchorPoint(null);
      setCursorPos(null);
      setIsDragging(null);
      onLineChange(null);
    }
  }, [enabled]);

  useEffect(() => {
    if (linePoints === null) {
      setDrawStep("idle");
      setAnchorPoint(null);
      setCursorPos(null);
      setIsDragging(null);
    }
  }, [linePoints]);

  useEffect(() => {
    if (linePoints && drawStep === "idle") {
      setDrawStep("done");
    }
  }, [linePoints]);

  const handleMouseDown = (e) => {
    if (!enabled) return;
    if (drawStep !== "done" || !linePoints) return;
    const pos = getMousePos(e);
    const distA = Math.hypot(pos.x - linePoints.x1, pos.y - linePoints.y1);
    const distB = Math.hypot(pos.x - linePoints.x2, pos.y - linePoints.y2);
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

  const handleClick = (e) => {
    if (!enabled) return;
    if (dragStartedRef.current) {
      dragStartedRef.current = false;
      return;
    }
    e.stopPropagation();
    const pos = getMousePos(e);
    if (drawStep === "done" && linePoints) return;
    if (drawStep === "idle") {
      setDrawStep("drawing");
      setAnchorPoint(pos);
      setCursorPos(pos);
      return;
    }
    if (drawStep === "drawing" && anchorPoint) {
      const dist = Math.hypot(pos.x - anchorPoint.x, pos.y - anchorPoint.y);
      if (dist < 2) return;
      onLineChange({
        x1: anchorPoint.x,
        y1: anchorPoint.y,
        x2: pos.x,
        y2: pos.y,
      });
      setDrawStep("done");
      setAnchorPoint(null);
      setCursorPos(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!enabled) return;
    const pos = getMousePos(e);
    if (isDragging === "a" && linePoints)
      onLineChange({ ...linePoints, x1: pos.x, y1: pos.y });
    else if (isDragging === "b" && linePoints)
      onLineChange({ ...linePoints, x2: pos.x, y2: pos.y });
    if (drawStep === "drawing") setCursorPos(pos);
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

  if (!enabled) return null;

  if (drawStep === "idle") {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-20"
        style={{ cursor: "crosshair" }}
        onClick={handleClick}
      >
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
                Draw Counting Line
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

  if (drawStep === "drawing" && anchorPoint && cursorPos) {
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
        </svg>
      </div>
    );
  }

  if (!linePoints) return null;

  const { x1, y1, x2, y2 } = linePoints;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const lineAngle = Math.atan2(y2 - y1, x2 - x1);
  const perpAngleUp = lineAngle - Math.PI / 2;
  const perpAngleDown = lineAngle + Math.PI / 2;
  const arrowLen = 12,
    arrowHeadLen = 4,
    arrowHeadWidth = 3;
  const isExit = detectionDirection === "exit";
  const isBoth = detectionDirection === "both";

  const buildArrow = (angle) => {
    const endX = midX + Math.cos(angle) * arrowLen;
    const endY = midY + Math.sin(angle) * arrowLen;
    const baseX = midX + Math.cos(angle) * (arrowLen - arrowHeadLen);
    const baseY = midY + Math.sin(angle) * (arrowLen - arrowHeadLen);
    return {
      endX,
      endY,
      head1X: baseX + Math.cos(angle + Math.PI / 2) * arrowHeadWidth,
      head1Y: baseY + Math.sin(angle + Math.PI / 2) * arrowHeadWidth,
      head2X: baseX + Math.cos(angle - Math.PI / 2) * arrowHeadWidth,
      head2Y: baseY + Math.sin(angle - Math.PI / 2) * arrowHeadWidth,
    };
  };

  const upArrow = !isExit ? buildArrow(perpAngleUp) : null;
  const downArrow = isExit || isBoth ? buildArrow(perpAngleDown) : null;
  const perpDx = Math.cos(perpAngleUp) * 4;
  const perpDy = Math.sin(perpAngleUp) * 4;

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
        <line
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${x2}%`}
          y2={`${y2}%`}
          stroke="#facc15"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
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
        <rect
          x={`${midX + perpDx - 2.5}%`}
          y={`${midY + perpDy - 2}%`}
          width="5%"
          height="3.2%"
          rx="3"
          fill="rgba(0,0,0,0.55)"
        />
        <text
          x={`${midX + perpDx}%`}
          y={`${midY + perpDy + 0.3}%`}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#06b6d4"
          fontSize="12"
          fontWeight="bold"
        >
          B
        </text>
        <rect
          x={`${midX - perpDx - 2.5}%`}
          y={`${midY - perpDy - 1.8}%`}
          width="5%"
          height="3.2%"
          rx="3"
          fill="rgba(0,0,0,0.55)"
        />
        <text
          x={`${midX - perpDx}%`}
          y={`${midY - perpDy + 0.3}%`}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#facc15"
          fontSize="12"
          fontWeight="bold"
        >
          A
        </text>
        <g style={{ cursor: "grab" }}>
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
        </g>
        <circle
          cx={`${x2}%`}
          cy={`${y2}%`}
          r="3"
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth="1.5"
          style={{ cursor: "grab" }}
        />
      </svg>
    </div>
  );
}

function PeopleCounting() {
  const { cameraList, cameraStreams, openGroups, toggleGroup } =
    useLiveStreaming();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [linePoints, setLinePoints] = useState(() => {
    try {
      const saved = localStorage.getItem("vms_people_line_points");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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
    countingMode: "line",
    detectionDirection: "entry",
    maxOccupancy: 100,
    alertThreshold: 80,
    countingLine: "horizontal",
    minTargetSize: 32,
    maxTargetSize: 512,
    detectionInterval: 1,
    trackingEnabled: true,
    crowdDetection: true,
    tailgatingAlert: false,
  };

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("vms_people_config");
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  });

  const handleToggle = (key) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSliderChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleNumberChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleSave = () => {
    localStorage.setItem("vms_people_config", JSON.stringify(config));
    if (linePoints) {
      localStorage.setItem(
        "vms_people_line_points",
        JSON.stringify(linePoints),
      );
    } else {
      localStorage.removeItem("vms_people_line_points");
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
      countingMode: "line",
      detectionDirection: "entry",
      maxOccupancy: 100,
      alertThreshold: 80,
      countingLine: "horizontal",
      minTargetSize: 32,
      maxTargetSize: 512,
      detectionInterval: 1,
      trackingEnabled: true,
      crowdDetection: true,
      tailgatingAlert: false,
    });
    setLinePoints(null);
    localStorage.removeItem("vms_people_line_points");
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  return (
    <div className="h-full w-full flex bg-[var(--bg-color)] text-[var(--text-dark)] overflow-hidden relative">
      {/* Camera Sidebar - single select */}
      <FaceSidebar
        isMobile={isMobile}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        cameraList={cameraList}
        openGroups={openGroups}
        toggleGroup={toggleGroup}
        onSelectCamera={handleSelectCamera}
        selectedCamera={selectedCamera}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
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
              <IoMdPeople className="text-[var(--primary-color)] text-[22px]" />
            </div>

            <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none truncate flex items-center gap-1.5 pb-[0.6px]">
              <span className="hidden sm:inline">People Counting</span>
              <span className="inline sm:hidden">People Config</span>
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

        {/* Body Content */}
        <BodyContainer>
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col xl:flex-row gap-3 p-3">
              {/* Settings Form */}
              <div
                className={`flex-1 max-w-2xl space-y-2 transition-opacity duration-200 ${!config.enable ? "opacity-50 pointer-events-none select-none" : ""}`}
              >
                {/* Toggle Fields */}
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
                        Tracking
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.trackingEnabled}
                      onToggle={() => handleToggle("trackingEnabled")}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-36 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Crowd Detection
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.crowdDetection}
                      onToggle={() => handleToggle("crowdDetection")}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-36 shrink-0">
                      <label className="text-xs font-medium text-[var(--text-dark)]">
                        Tailgating Alert
                      </label>
                    </div>
                    <ToggleSwitch
                      enabled={config.tailgatingAlert}
                      onToggle={() => handleToggle("tailgatingAlert")}
                    />
                  </div>
                </div>

                {/* Select Fields */}
                <div className="space-y-1.5 pt-1">
                  <SelectField
                    label="Detection Direction"
                    value={config.detectionDirection}
                    onChange={(v) =>
                      handleSelectChange("detectionDirection", v)
                    }
                    options={[
                      { value: "entry", label: "Entry Only" },
                      { value: "exit", label: "Exit Only" },
                      { value: "both", label: "Both Direction" },
                    ]}
                  />

                  <SelectField
                    label="Counting Line"
                    value={config.countingLine}
                    onChange={(v) => handleSelectChange("countingLine", v)}
                    options={[
                      { value: "horizontal", label: "Horizontal" },
                      { value: "vertical", label: "Vertical" },
                      { value: "custom", label: "Custom" },
                    ]}
                  />
                </div>

                {/* Slider Fields */}
                <div className="space-y-2 pt-1">
                  <SliderField
                    label="Min Target Size"
                    value={config.minTargetSize}
                    min={16}
                    max={256}
                    onChange={(v) => handleSliderChange("minTargetSize", v)}
                  />

                  <SliderField
                    label="Max Target Size"
                    value={config.maxTargetSize}
                    min={128}
                    max={1024}
                    onChange={(v) => handleSliderChange("maxTargetSize", v)}
                  />
                </div>

                {/* Number Fields */}
                <div className="space-y-1.5 pt-1">
                  <NumberField
                    label="Max Occupancy"
                    value={config.maxOccupancy}
                    min={1}
                    max={9999}
                    onChange={(v) => handleNumberChange("maxOccupancy", v)}
                    suffix="people"
                  />

                  <NumberField
                    label="Alert Threshold"
                    value={config.alertThreshold}
                    min={1}
                    max={100}
                    onChange={(v) => handleNumberChange("alertThreshold", v)}
                    suffix="%"
                  />

                  <NumberField
                    label="Detection Interval"
                    value={config.detectionInterval}
                    min={1}
                    max={30}
                    onChange={(v) => handleNumberChange("detectionInterval", v)}
                    suffix="sec"
                  />
                </div>
              </div>

              {/* Live Preview */}
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
                      <CountingLineOverlay
                        linePoints={linePoints}
                        onLineChange={setLinePoints}
                        enabled={config.enable}
                        detectionDirection={config.detectionDirection}
                      />
                      {/* Top Bar - Camera Name */}
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
                      {/* Bottom Bar - Timestamp */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 z-10">
                        <LiveClock />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl text-gray-500 mx-auto mb-3">
                          👥
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
                {/* Counting Line Controls */}
                {config.enable && selectedCamera && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <button
                      onClick={() => setLinePoints(null)}
                      disabled={!linePoints}
                      className="px-4 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-dark)] text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setLinePoints(null)}
                      disabled={!linePoints}
                      className="px-4 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--text-dark)] text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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

export default PeopleCounting;
