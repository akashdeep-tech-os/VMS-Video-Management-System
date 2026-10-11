import { useMemo, useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

const MIN_HEIGHT = 200;

function CameraReport({ data = [], selectedDistrict, onDistrictClick }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

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

  // Responsive padding based on container width
  const PADDING = useMemo(() => {
    if (width < 400) return { top: 16, right: 2, bottom: 72, left: 36 };
    if (width < 700) return { top: 18, right: 3, bottom: 72, left: 42 };
    return { top: 20, right: 4, bottom: 68, left: 50 };
  }, [width]);

  const yMax = useMemo(() => {
    const max = Math.max(...data.map((d) => Math.max(d.working, d.nonWorking)));
    return Math.max(25, Math.ceil(max / 10) * 10);
  }, [data]);

  const yTicks = useMemo(() => {
    const step = yMax <= 30 ? 5 : 10;
    const ticks = [];
    for (let i = 0; i <= yMax; i += step) ticks.push(i);
    return ticks;
  }, [yMax]);

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  // Dynamic bandWidth: allow wider bars on larger screens
  const maxBand = width > 1200 ? 80 : width > 800 ? 70 : 60;
  const bandWidth = Math.min(
    data.length > 0 ? chartWidth / data.length : 0,
    maxBand,
  );
  const singleBarWidth = Math.min(bandWidth * 0.38, 20);
  const groupWidth = singleBarWidth * 2 + 6;

  const groupOffset = (bandWidth - groupWidth) / 2;

  // Hide X-axis labels on very narrow screens
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

  const makeBarPath = (bx, by, bw, bh) => {
    if (bh <= 0) return "";
    const r = Math.min(4, bw / 2, bh / 2);
    return `M${bx},${by + bh} L${bx},${by + r} Q${bx},${by} ${bx + r},${by} L${bx + bw - r},${by} Q${bx + bw},${by} ${bx + bw},${by + r} L${bx + bw},${by + bh} Z`;
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-3 sm:p-4 h-full flex flex-col cursor-pointer hover:border-[var(--primary-color)]/40 glass-lift card-glow-hover">
      <div className="relative mb-2 shrink-0">
        <h4 className="text-[13px] sm:text-[13px] uppercase font-semibold text-[var(--text-dark)]">
          Cameras Working Status
        </h4>
        {selectedDistrict && (
          <button
            onClick={() => onDistrictClick(null)}
            className="absolute top-0 right-0 p-1 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 cursor-pointer"
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
            <defs>
              <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                {/* <stop offset="0%" stopColor="#86efac" /> */}
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="wGradH" x1="0" y1="0" x2="0" y2="1">
                {/* <stop offset="0%" stopColor="#bbf7d0" /> */}
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
              <linearGradient id="nGrad" x1="0" y1="0" x2="0" y2="1">
                {/* <stop offset="0%" stopColor="#fca5a5" /> */}
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="nGradH" x1="0" y1="0" x2="0" y2="1">
                {/* <stop offset="0%" stopColor="#fecaca" /> */}
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* Grid */}
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={PADDING.left}
                y1={PADDING.top + yScale(tick)}
                x2={width - PADDING.right}
                y2={PADDING.top + yScale(tick)}
                stroke="var(--border-color)"
                strokeDasharray="3 3"
                strokeWidth={0.5}
              />
            ))}

            {/* Y labels */}
            {yTicks.map((tick) => (
              <text
                key={tick}
                x={PADDING.left - 6}
                y={PADDING.top + yScale(tick) + 3}
                textAnchor="end"
                fontSize={10}
                fill="var(--text-muted)"
                opacity={0.45}
              >
                {tick}
              </text>
            ))}

            {/* Grouped bars */}
            {data.map((d, i) => {
              const isSelected = selectedDistrict === d.district;
              const isHovered = hoveredIndex === i;
              const opacity = selectedDistrict ? (isSelected ? 1 : 0.3) : 1;
              const groupX = PADDING.left + i * bandWidth + groupOffset;

              const wH = Math.max((d.working / yMax) * chartHeight, 4);
              const wX = groupX;
              const wY = PADDING.top + chartHeight - wH;
              const wPath = makeBarPath(wX, wY, singleBarWidth, wH);

              const nwH = Math.max((d.nonWorking / yMax) * chartHeight, 4);
              const nwX = groupX + singleBarWidth + 3;
              const nwY = PADDING.top + chartHeight - nwH;
              const nwPath = makeBarPath(nwX, nwY, singleBarWidth, nwH);

              return (
                <g key={d.district} opacity={opacity}>
                  {wPath && (
                    <path
                      d={wPath}
                      fill={isHovered ? "url(#wGradH)" : "url(#wGrad)"}
                      style={{
                        animation: `barGrowUp 0.6s ease-out ${i * 80}ms both`,
                        transformOrigin: `${wX + singleBarWidth / 2}px ${wY + wH}px`,
                      }}
                    />
                  )}
                  {isSelected && wH > 0 && (
                    <rect
                      x={wX - 1}
                      y={wY - 1}
                      width={singleBarWidth + 2}
                      height={wH + 2}
                      rx={4}
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth={2}
                    />
                  )}

                  {nwPath && (
                    <path
                      d={nwPath}
                      fill={isHovered ? "url(#nGradH)" : "url(#nGrad)"}
                      style={{
                        animation: `barGrowUp 0.6s ease-out ${i * 80 + 40}ms both`,
                        transformOrigin: `${nwX + singleBarWidth / 2}px ${nwY + nwH}px`,
                      }}
                    />
                  )}
                  {isSelected && nwH > 0 && (
                    <rect
                      x={nwX - 1}
                      y={nwY - 1}
                      width={singleBarWidth + 2}
                      height={nwH + 2}
                      rx={4}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}

            {/* X-axis line */}
            <line
              x1={PADDING.left}
              y1={PADDING.top + chartHeight}
              x2={width - PADDING.right}
              y2={PADDING.top + chartHeight}
              stroke="var(--border-color)"
              strokeWidth={1}
              strokeOpacity={0.3}
            />

            {/* X labels - hidden on very narrow screens */}
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
                    fontWeight={isSelected ? 700 : 400}
                    fill={isSelected ? "#2563eb" : "var(--text-muted)"}
                    opacity={0.6}
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
                  x={Math.min(tooltipPos.x + 12, width - 180)}
                  y={tooltipPos.y - 60}
                  width={170}
                  height={52}
                  rx={8}
                  fill="var(--card-bg)"
                  stroke="var(--border-color)"
                  strokeWidth={1}
                  filter="drop-shadow(0 2px 8px rgba(0,0,0,0.15))"
                />
                <text
                  x={Math.min(tooltipPos.x + 22, width - 170)}
                  y={tooltipPos.y - 40}
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--text-dark)"
                >
                  {data[hoveredIndex].district}
                </text>
                <text
                  x={Math.min(tooltipPos.x + 22, width - 170)}
                  y={tooltipPos.y - 25}
                  fontSize={10}
                  fill="#dc2626"
                  opacity={0.8}
                >
                  Non Working: {data[hoveredIndex].nonWorking}
                </text>
                <text
                  x={Math.min(tooltipPos.x + 22, width - 170)}
                  y={tooltipPos.y - 12}
                  fontSize={10}
                  fill="#16a34a"
                  opacity={0.8}
                >
                  Working: {data[hoveredIndex].working}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-1 text-[12px] text-[var(--text-dark)] font-medium leading-none select-none shrink-0">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded"
            style={{
              background: "linear-gradient(to bottom,  #dc2626)",
            }}
          />
          Not Working
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded"
            style={{
              background: "linear-gradient(to bottom, #16a34a)",
            }}
          />
          Working
        </span>
      </div>
    </div>
  );
}

export default CameraReport;
