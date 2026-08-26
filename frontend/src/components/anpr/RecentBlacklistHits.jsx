const allBlacklistHits = [
  {
    time: "06:31:25 PM",
    vehicleNumber: "DL01AB1234",
    camera: "Gate 1 - Entry",
    location: "Sector 10 PS",
    confidence: 98,
  },
  {
    time: "06:28:11 PM",
    vehicleNumber: "HR26DK9815",
    camera: "Gate 2 - Exit",
    location: "Sector 10 PS",
    confidence: 97,
  },
  {
    time: "06:22:47 PM",
    vehicleNumber: "PB10EF7788",
    camera: "Parking Area",
    location: "Sector 10 PS",
    confidence: 96,
  },
];

function RecentBlacklistHits() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ================= HEADER ================= */}
      <div
        className="
          h-[42px]
          min-h-[42px]
          px-4
          border-b border-[var(--border-color)]
          flex items-center
        "
      >
        <h2 className="text-sm font-semibold text-[var(--text-dark)]">
          Recent Blacklist Hits
        </h2>
      </div>

      {/* ================= TABLE ================= */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead
            className="
              sticky
              top-0
              z-10
              bg-[var(--card-bg)]
              border-b border-[var(--border-color)]
            "
          >
            <tr>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                Time
              </th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                Vehicle Number
              </th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                Camera
              </th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                Location
              </th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                Confidence
              </th>
            </tr>
          </thead>

          <tbody>
            {allBlacklistHits.map((item, index) => (
              <tr
                key={index}
                className="
                  border-b border-[var(--border-color)]
                  hover:bg-[var(--bg-color)]/40
                  transition-all duration-150
                "
              >
                <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                  {item.time}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="
                      inline-block
                      px-2
                      py-0.5
                      rounded
                      bg-gradient-to-r from-purple-500/20 to-blue-500/20
                      text-[11px]
                      font-bold
                      text-purple-600
                      dark:text-purple-400
                    "
                  >
                    {item.vehicleNumber}
                  </span>
                </td>
                <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                  {item.camera}
                </td>
                <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                  {item.location}
                </td>
                <td className="px-3 py-2 text-right text-[11px] font-semibold text-green-500 whitespace-nowrap">
                  {item.confidence}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentBlacklistHits;
