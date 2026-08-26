import { useState, useMemo } from "react";
import {
  FaRoute,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const mockDetections = [
  {
    id: 1,
    time: "06:31:25 PM",
    vehicleNumber: "DL01AB1234",
    listTag: "WL",
    vehicleType: "Car",
    color: "White",
    camera: "Gate 1 - Entry",
    location: "Sector 10 PS",
  },
  {
    id: 2,
    time: "06:30:58 PM",
    vehicleNumber: "HR26DK9815",
    listTag: null,
    vehicleType: "Bike",
    color: "Black",
    camera: "Gate 2 - Exit",
    location: "Sector 10 PS",
  },
  {
    id: 3,
    time: "06:30:21 PM",
    vehicleNumber: "UP16CA4457",
    listTag: "BL",
    vehicleType: "Car",
    color: "Silver",
    camera: "Road 1",
    location: "Sector 9 PS",
  },
  {
    id: 4,
    time: "06:29:47 PM",
    vehicleNumber: "DL3CCT1234",
    listTag: null,
    vehicleType: "Truck",
    color: "Yellow",
    camera: "Parking Area",
    location: "Sector 9 PS",
  },
  {
    id: 5,
    time: "06:29:10 PM",
    vehicleNumber: "PB10EF7788",
    listTag: null,
    vehicleType: "Car",
    color: "Blue",
    camera: "Gate 3 - Entry",
    location: "Sector 23 PS",
  },
  {
    id: 6,
    time: "06:28:33 PM",
    vehicleNumber: "RJ14UA9911",
    listTag: null,
    vehicleType: "Car",
    color: "White",
    camera: "Gate 1 - Entry",
    location: "Sector 10 PS",
  },
  {
    id: 7,
    time: "06:27:55 PM",
    vehicleNumber: "DL8CAK1122",
    listTag: null,
    vehicleType: "Car",
    color: "Red",
    camera: "Road 2",
    location: "Sector 23 PS",
  },
  {
    id: 8,
    time: "06:27:18 PM",
    vehicleNumber: "MH02DK1234",
    listTag: null,
    vehicleType: "Bike",
    color: "Black",
    camera: "Gate 2 - Entry",
    location: "Sector 10 PS",
  },
  {
    id: 9,
    time: "06:26:42 PM",
    vehicleNumber: "DL01AB5678",
    listTag: "WL",
    vehicleType: "Car",
    color: "Silver",
    camera: "Road 1",
    location: "Sector 9 PS",
  },
  {
    id: 10,
    time: "06:25:55 PM",
    vehicleNumber: "KA01MN4567",
    listTag: null,
    vehicleType: "Car",
    color: "White",
    camera: "Gate 1 - Entry",
    location: "Sector 10 PS",
  },
  {
    id: 11,
    time: "06:25:12 PM",
    vehicleNumber: "TN09AB3322",
    listTag: null,
    vehicleType: "Bike",
    color: "Red",
    camera: "Gate 3 - Entry",
    location: "Sector 23 PS",
  },
  {
    id: 12,
    time: "06:24:38 PM",
    vehicleNumber: "GJ05CD8899",
    listTag: "BL",
    vehicleType: "Car",
    color: "Black",
    camera: "Parking Area",
    location: "Sector 9 PS",
  },
];

const vehicleColors = {
  White: "bg-gray-100",
  Black: "bg-gray-800",
  Silver: "bg-gray-400",
  Red: "bg-red-500",
  Blue: "bg-blue-500",
  Yellow: "bg-yellow-400",
  Green: "bg-green-500",
};

function DetectionResultsTable({ onSelectVehicle, selectedVehicleNumber }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [typeFilter, setTypeFilter] = useState("All");
  const [cameraFilter, setCameraFilter] = useState("All");

  const vehicleTypes = useMemo(
    () => [...new Set(mockDetections.map((d) => d.vehicleType))],
    [],
  );
  const cameras = useMemo(
    () => [...new Set(mockDetections.map((d) => d.camera))],
    [],
  );

  const filtered = useMemo(() => {
    let data = mockDetections;
    if (typeFilter !== "All")
      data = data.filter((d) => d.vehicleType === typeFilter);
    if (cameraFilter !== "All")
      data = data.filter((d) => d.camera === cameraFilter);
    return data;
  }, [typeFilter, cameraFilter]);

  const totalPages = Math.ceil(filtered.length / entriesPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage,
  );

  return (
    <div className="h-full flex flex-col bg-[var(--card-bg)] rounded-2xl border-2 border-[var(--border-color)] shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border-color)] flex-shrink-0">
        <h3 className="text-sm font-bold text-[var(--text-dark)] uppercase">
          Detection Results{" "}
          <span className="font-normal">({filtered.length})</span>
        </h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-scroll custom-scrollbar">
        <div className="min-w-[700px]">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-[0_1px_0_0_var(--border-color)]">
              <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 to-transparent border-b border-[var(--border-color)]">
                <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)] font-semibold w-[110px] text-[var(--text-dark)]">
                  TIME
                </th>
                <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)] font-semibold min-w-[150px] text-[var(--text-dark)]">
                  VEHICLE NUMBER
                </th>
                <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)] font-semibold w-[110px] text-[var(--text-dark)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                      TYPE
                    </span>
                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 text-[12px] px-2 pr-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                    >
                      <option value="All">ALL</option>
                      {vehicleTypes.map((t) => (
                        <option key={t} value={t}>
                          {t.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)] font-semibold w-[90px] text-[var(--text-dark)]">
                  COLOR
                </th>
                <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)] font-semibold min-w-[130px] text-[var(--text-dark)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                      CAMERA
                    </span>
                    <select
                      value={cameraFilter}
                      onChange={(e) => {
                        setCameraFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 text-[12px] px-2 pr-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                    >
                      <option value="All">ALL</option>
                      {cameras.map((c) => (
                        <option key={c} value={c}>
                          {c.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="py-1.5 px-3 border-b-2 border-[var(--border-color)] font-semibold w-[110px] text-[var(--text-dark)]">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((row) => (
                <tr
                  key={row.id}
                  className={`h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer ${
                    selectedVehicleNumber === row.vehicleNumber
                      ? "bg-[var(--primary-color)]/5"
                      : ""
                  }`}
                  onClick={() => onSelectVehicle(row.vehicleNumber)}
                >
                  <td className="py-1.5 px-3 whitespace-nowrap text-[13px] font-normal text-[var(--text-dark)] w-[110px] border-r border-[var(--border-color)]">
                    {row.time}
                  </td>
                  <td className="py-1.5 px-3 whitespace-nowrap min-w-[150px] border-r border-[var(--border-color)]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold tracking-wide ">
                        {row.vehicleNumber}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap text-[13px] font-normal text-[var(--text-dark)] w-[110px]">
                    {row.vehicleType}
                  </td>
                  <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap w-[90px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${vehicleColors[row.color] || "bg-gray-300 dark:bg-gray-600"}`}
                      />
                      <span className="text-[13px] font-normal text-[var(--text-dark)]">
                        {row.color}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap text-[13px] font-normal text-[var(--text-dark)] min-w-[130px]">
                    {row.camera}
                  </td>
                  <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap w-[110px]">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVehicle(row.vehicleNumber);
                        }}
                        className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500 dark:text-purple-400 transition-colors"
                        title="View Route"
                      >
                        <FaRoute size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500 dark:text-green-400 transition-colors"
                        title="Download"
                      >
                        <FaDownload size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="shrink-0 h-[48px] min-h-[48px] px-4 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-color)]/30">
        <div className="flex items-center gap-3">
          <p className="text-[14px] text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-dark)]">
              {(currentPage - 1) * entriesPerPage + 1}
            </span>
            {" - "}
            <span className="font-semibold text-[var(--text-dark)]">
              {Math.min(currentPage * entriesPerPage, filtered.length)}
            </span>
            {" / "}
            <span className="font-semibold text-[var(--text-dark)]">
              {filtered.length}
            </span>
          </p>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-7 text-[12px] px-2 pr-6 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <FaChevronLeft size={14} />
          </button>
          {[1, 2, 3, 4, 5]
            .filter((p) => p <= totalPages)
            .map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all ${
                  currentPage === page
                    ? "bg-[var(--primary-color)] text-white shadow-sm"
                    : "border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                }`}
              >
                {page}
              </button>
            ))}
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <FaChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetectionResultsTable;
