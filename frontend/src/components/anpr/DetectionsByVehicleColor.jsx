import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "White", value: 3640, color: "#E5E7EB" },
  { name: "Silver", value: 2210, color: "#9CA3AF" },
  { name: "Black", value: 1870, color: "#1F2937" },
  { name: "Grey", value: 950, color: "#6B7280" },
  { name: "Blue", value: 620, color: "#3B82F6" },
  { name: "Red", value: 410, color: "#EF4444" },
  { name: "Other", value: 284, color: "#F59E0B" },
];

const total = data.reduce((sum, item) => sum + item.value, 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const percent = ((item.value / total) * 100).toFixed(1);
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-2 shadow-lg">
        <p className="text-xs font-semibold" style={{ color: item.payload.color }}>
          {item.name}: {item.value.toLocaleString()} ({percent}%)
        </p>
      </div>
    );
  }
  return null;
};

function DetectionsByVehicleColor() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-auto md:h-[48px] min-h-0 md:min-h-[48px] px-3 md:px-4 py-2 md:py-0 border-b border-[var(--border-color)] flex items-center">
        <h2 className="text-[13px] md:text-sm font-semibold text-[var(--text-dark)]">
          Detections by Vehicle Color
        </h2>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center gap-2 md:gap-3 px-2 md:px-3 py-2 overflow-hidden">
        {/* Donut Chart */}
        <div className="relative w-[120px] h-[120px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-[var(--text-dark)]">
              {total.toLocaleString()}
            </span>
            <span className="text-[9px] text-[var(--text-muted)]">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0 space-y-1.5 overflow-y-auto custom-scrollbar">
          {data.map((item, index) => {
            const percent = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] text-[var(--text-muted)] truncate min-w-0">
                  {item.name}
                </span>
                <span className="text-[10px] font-bold text-[var(--text-dark)] ml-auto flex-shrink-0">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-[9px] text-[var(--text-muted)] w-[35px] text-right flex-shrink-0">
                  {percent}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DetectionsByVehicleColor;
