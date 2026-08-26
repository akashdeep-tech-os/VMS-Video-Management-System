import { useMemo, useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

const MIN_HEIGHT = 200;

function TotalCameraGraph({ data = [], selectedDistrict, onDistrictClick }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const groupLabel = useMemo(() => {
    const saved = localStorage.getItem("vms_departments");
    const departments = saved ? JSON.parse(saved) : [];
    const config =
      departments.length > 0
        ? {
            departmentName: departments[0].name,
            groupName: departments[0].groupName,
          }
        : null;
    return config?.groupName || "Group";
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height: Math.max(height, MIN_HEIGHT) });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;

  const PADDING = useMemo(() => {
    if (width < 400) return { top: 16, right: 2, bottom: 72, left: 36 };
    if (width < 700) return { top: 18, right: 3, bottom: 72, left: 42 };
    return { top: 20, right: 4, bottom: 68, left: 50 };
  }, [width]);

  const yMax = useMemo(() => {
    const max = Math.max(...data.map((d) => d.alerts));
    return Math.max(35, Math.ceil(max / 10) * 10);
  }, [data]);

  const yTicks = useMemo(() => {
    const step = yMax <= 40 ? 5 : 10;
    const ticks = [];
    for (let i = 0; i <= yMax; i += step) ticks.push(i);
    return ticks;
  }, [yMax]);

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const maxBand = width > 1200 ? 80 : width > 800 ? 70 : 60;
  const bandWidth = Math.min(
    data.length > 0 ? chartWidth / data.length : 0,
    maxBand,
  );
  const barWidth = Math.min(bandWidth * 0.55, 32);
  const barGap = (bandWidth - barWidth) / 2;

  const showLabels = width >= 350;

  const yScale = (val) => chartHeight - (val / yMax) * chartHeight;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING.left;
    const index = Math.floor(x / bandWidth);
    if (index >= 0 && index < data.length) {
      setHoveredIndex(index);
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredIndex(null);
      setTooltipPos(null);
    }
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING.left;
    const index = Math.floor(x / bandWidth);
    if (index >= 0 && index < data.length) {
      onDistrictClick(data[index].district);
    }
  };

  const BAR_COLOR = "#6366F1";
  const BAR_HOVER = "#818CF8";
  const BAR_SELECTED = "#4F46E5";
  const BAR_RADIUS = 6;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg hover:shadow-[var(--primary-color)]/5 transition-all duration-300 p-3 sm:p-4 h-full flex flex-col cursor-pointer hover:border-[var(--primary-color)]/40 glass-lift card-glow-hover">
      <div className="relative mb-2 shrink-0">
        <h4 className="text-[13px] sm:text-[13px] uppercase font-semibold text-[var(--text-dark)]">
          Total Cameras ({groupLabel})
        </h4>
        {selectedDistrict && (
          <button
            onClick={() => onDistrictClick(null)}
            className="absolute top-0 right-0 p-1 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/25 cursor-pointer"
            title={`Clear filter: ${selectedDistrict}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 w-full relative overflow-visible"
        style={{ minHeight: MIN_HEIGHT }}
      >
        {width > 0 && height > 0 && (
          <svg
            width={width}
            height={height}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onMouseLeave={() => {
              setHoveredIndex(null);
              setTooltipPos(null);
            }}
            style={{ cursor: "pointer" }}
          >
            {/* Subtle grid lines */}
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={PADDING.left}
                y1={PADDING.top + yScale(tick)}
                x2={width - PADDING.right}
                y2={PADDING.top + yScale(tick)}
                stroke="var(--border-color)"
                strokeDasharray="4 4"
                strokeWidth={0.5}
                opacity={0.4}
              />
            ))}

            {/* Y labels */}
            {yTicks.map((tick) => (
              <text
                key={tick}
                x={PADDING.left - 8}
                y={PADDING.top + yScale(tick) + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="var(--text-muted)"
                opacity={0.5}
              >
                {tick}
              </text>
            ))}

            {/* Bars */}
            {data.map((d, i) => {
              const rawH = (d.alerts / yMax) * chartHeight;
              const barH = Math.max(rawH, 6);
              const x = PADDING.left + i * bandWidth + barGap;
              const y = PADDING.top + chartHeight - barH;
              const isSelected = selectedDistrict === d.district;
              const isHovered = hoveredIndex === i;
              const opacity = selectedDistrict ? (isSelected ? 1 : 0.25) : 1;
              const r = Math.min(BAR_RADIUS, barWidth / 2, barH / 2);

              const fill = isSelected
                ? BAR_SELECTED
                : isHovered
                  ? BAR_HOVER
                  : BAR_COLOR;

              const path =
                barH > 0
                  ? `M${x},${y + barH} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + barWidth - r},${y} Q${x + barWidth},${y} ${x + barWidth},${y + r} L${x + barWidth},${y + barH} Z`
                  : "";

              return (
                <g key={d.district} opacity={opacity}>
                  {path && (
                    <path
                      d={path}
                      fill={fill}
                      style={{
                        transition: "fill 0.2s ease, opacity 0.3s ease",
                        animation: `barGrowUp 0.5s ease-out ${i * 60}ms both`,
                        transformOrigin: `${x + barWidth / 2}px ${y + barH}px`,
                      }}
                    />
                  )}
                  {isSelected && barH > 0 && (
                    <rect
                      x={x - 1}
                      y={y - 1}
                      width={barWidth + 2}
                      height={barH + 2}
                      rx={r}
                      fill="none"
                      stroke={BAR_SELECTED}
                      strokeWidth={2}
                      opacity={0.5}
                    />
                  )}
                </g>
              );
            })}

            {/* X-axis baseline */}
            <line
              x1={PADDING.left}
              y1={PADDING.top + chartHeight}
              x2={width - PADDING.right}
              y2={PADDING.top + chartHeight}
              stroke="var(--border-color)"
              strokeWidth={1}
              opacity={0.3}
            />

            {/* X labels */}
            {showLabels &&
              data.map((d, i) => {
                const cx = PADDING.left + i * bandWidth + bandWidth / 2;
                const ty = PADDING.top + chartHeight;
                const isSelected = selectedDistrict === d.district;
                return (
                  <text
                    key={d.district}
                    x={cx}
                    y={ty + 16}
                    textAnchor="end"
                    fontSize={width < 500 ? 8 : 9.5}
                    fontWeight={isSelected ? 600 : 400}
                    fill={isSelected ? BAR_SELECTED : "var(--text-muted)"}
                    opacity={0.55}
                    transform={`rotate(-35, ${cx}, ${ty + 16})`}
                  >
                    {d.district}
                  </text>
                );
              })}

            {/* Tooltip */}
            {hoveredIndex !== null && tooltipPos && (
              <g>
                <rect
                  x={Math.min(tooltipPos.x + 12, width - 170)}
                  y={tooltipPos.y - 50}
                  width={160}
                  height={44}
                  rx={10}
                  fill="var(--card-bg)"
                  stroke="var(--border-color)"
                  strokeWidth={1}
                  filter="drop-shadow(0 4px 12px rgba(0,0,0,0.12))"
                />
                <text
                  x={Math.min(tooltipPos.x + 22, width - 160)}
                  y={tooltipPos.y - 32}
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--text-dark)"
                >
                  {data[hoveredIndex].district}
                </text>
                <text
                  x={Math.min(tooltipPos.x + 22, width - 160)}
                  y={tooltipPos.y - 17}
                  fontSize={10}
                  fill="var(--text-muted)"
                  opacity={0.65}
                >
                  # of Cameras: {data[hoveredIndex].alerts}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-1 shrink-0">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm"
          style={{ background: BAR_COLOR }}
        />
        <span className="text-[12px] text-[var(--text-dark)] font-medium leading-none select-none">
          Total Cameras
        </span>
      </div>
    </div>
  );
}

export default TotalCameraGraph;
