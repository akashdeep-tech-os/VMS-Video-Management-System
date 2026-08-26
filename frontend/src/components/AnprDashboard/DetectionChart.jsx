import { useMemo, useState, useRef, useEffect } from "react";

const MIN_HEIGHT = 180;

function DetectionChart() {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const chartData = useMemo(() => [
    { time: "00:00", detection: 120 },
    { time: "02:00", detection: 260 },
    { time: "04:00", detection: 380 },
    { time: "06:00", detection: 430 },
    { time: "08:00", detection: 510 },
    { time: "10:00", detection: 470 },
    { time: "12:00", detection: 620 },
    { time: "14:00", detection: 780 },
    { time: "16:00", detection: 730 },
    { time: "18:00", detection: 580 },
    { time: "20:00", detection: 640 },
    { time: "22:00", detection: 720 },
  ], []);

  const totalDetections = useMemo(() => chartData.reduce((sum, item) => sum + item.detection, 0), [chartData]);
  const peakDetection = useMemo(() => Math.max(...chartData.map((item) => item.detection)), [chartData]);

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
    if (width < 400) return { top: 12, right: 8, bottom: 28, left: 32 };
    return { top: 14, right: 10, bottom: 30, left: 36 };
  }, [width]);

  const yMax = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.detection));
    return Math.max(100, Math.ceil(max / 100) * 100);
  }, [chartData]);

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const yScale = (val) => chartHeight - (val / yMax) * chartHeight;

  const xScale = (i) => (i / (chartData.length - 1)) * chartWidth;

  const pathD = useMemo(() => {
    if (chartWidth <= 0 || chartHeight <= 0) return "";
    return chartData
      .map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.detection);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartData, chartWidth, chartHeight]);

  const areaD = useMemo(() => {
    if (chartWidth <= 0 || chartHeight <= 0) return "";
    const linePath = chartData
      .map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.detection);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
    return `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [chartData, chartWidth, chartHeight]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING.left;
    const index = Math.round((x / chartWidth) * (chartData.length - 1));
    if (index >= 0 && index < chartData.length) {
      setHoveredIndex(index);
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  const showLabels = width >= 300;

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden rounded-2xl">
      {/* HEADER */}
      <div className="h-auto md:h-[52px] min-h-0 md:min-h-[52px] px-3 md:px-5 py-2 md:py-0 border-b border-[var(--border-color)] flex items-center justify-between">
        <div>
          <h2 className="text-[13px] md:text-[15px] font-semibold tracking-wide text-[var(--text-dark)]">
            Vehicle Detection Time Analytics
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <select className="h-7 md:h-8 px-2 md:px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] text-[11px] md:text-[12px] text-[var(--text-dark)] outline-none transition-all focus:ring-2 focus:ring-[var(--primary-color)]/20">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* CHART */}
      <div className="flex-1 px-2 py-2 overflow-hidden min-h-[150px]">
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          {width > 0 && height > 0 && (
            <svg width={width} height={height} className="overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-color)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary-color)" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartHeight - ratio * chartHeight;
                  return (
                    <line
                      key={ratio}
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="var(--border-color)"
                      strokeDasharray="4 4"
                      opacity={0.4}
                    />
                  );
                })}
              </g>

              {/* Area Fill */}
              <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                <path d={areaD} fill="url(#areaGradient)" />
              </g>

              {/* Line */}
              <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                <path d={pathD} fill="none" stroke="var(--primary-color)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Data Points */}
              <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                {chartData.map((d, i) => {
                  const x = xScale(i);
                  const y = yScale(d.detection);
                  const isActive = hoveredIndex === i;
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? 5 : 3}
                        fill={isActive ? "var(--primary-color)" : "var(--card-bg)"}
                        stroke="var(--primary-color)"
                        strokeWidth={2}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </g>

              {/* Y Axis Labels */}
              <g transform={`translate(${PADDING.left - 8}, ${PADDING.top})`}>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartHeight - ratio * chartHeight;
                  const value = Math.round(ratio * yMax);
                  return (
                    <text
                      key={ratio}
                      x={0}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="text-[9px] fill-[var(--text-muted)]"
                    >
                      {showLabels ? value : ""}
                    </text>
                  );
                })}
              </g>

              {/* X Axis Labels */}
              <g transform={`translate(${PADDING.left}, ${PADDING.top + chartHeight + 12})`}>
                {chartData.map((d, i) => {
                  const x = xScale(i);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={0}
                      textAnchor="middle"
                      className="text-[8px] fill-[var(--text-muted)]"
                    >
                      {showLabels ? d.time : ""}
                    </text>
                  );
                })}
              </g>

              {/* Hover Line */}
              {hoveredIndex !== null && (
                <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                  <line
                    x1={xScale(hoveredIndex)}
                    y1={0}
                    x2={xScale(hoveredIndex)}
                    y2={chartHeight}
                    stroke="var(--primary-color)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.5}
                  />
                </g>
              )}
            </svg>
          )}

          {/* Tooltip */}
          {hoveredIndex !== null && tooltipPos && (
            <div
              className="absolute pointer-events-none z-10 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 shadow-lg"
              style={{
                left: Math.min(tooltipPos.x + 10, width - 120),
                top: Math.max(tooltipPos.y - 60, 10),
              }}
            >
              <p className="text-[11px] font-semibold text-[var(--text-dark)]">{chartData[hoveredIndex].time}</p>
              <p className="text-[10px] text-[var(--primary-color)]">detection : {chartData[hoveredIndex].detection}</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="hidden md:flex h-[40px] min-h-[40px] px-5 border-t border-[var(--border-color)] items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-[11px] text-[var(--text-muted)]">System status operational</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[11px] font-semibold">
          +12.8% Traffic Increase
        </div>
      </div>
    </div>
  );
}

export default DetectionChart;
