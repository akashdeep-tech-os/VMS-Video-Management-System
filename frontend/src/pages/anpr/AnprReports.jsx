import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import BodyHead from "../../components/common/BodyHead";
import BodyContainer from "../../components/common/BodyContainer";
import MapModal from "../../components/common/MapModal";
import DetectionChart from "../../components/anpr/DetectionChart";
import TopCamerasByDetections from "../../components/anpr/TopCamerasByDetections";

import { HiOutlineDocumentChartBar } from "react-icons/hi2";
import {
  FaFileExcel,
  FaFilePdf,
  FaDownload,
  FaMapMarkerAlt,
  FaFilter,
} from "react-icons/fa";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

const analyticsData = [
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
];
const analyticsTotal = 6240;

function AnalyticsTable({ page, setPage }) {
  const rowsPerPage = 8;
  const totalPages = Math.ceil(analyticsData.length / rowsPerPage);
  const currentPage = Math.min(page, totalPages);
  const paginatedData = analyticsData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  return (
    <div className="flex-1 min-h-0 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[var(--primary-color)]/16 via-[var(--primary-color)]/8 to-transparent border-b border-[var(--border-color)] uppercase text-[13px] tracking-wide">
              <th className="w-[50px] px-3 py-2.5 text-center font-semibold text-[var(--text-dark)] border-r border-[var(--border-color)]">
                SN.
              </th>

              <th className="px-3 py-2.5 text-left font-semibold text-[var(--text-dark)] border-r border-[var(--border-color)]">
                Time
              </th>

              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-dark)] border-r border-[var(--border-color)]">
                Detections
              </th>

              <th className="px-3 py-2.5 text-right font-semibold text-[var(--text-dark)] border-r border-[var(--border-color)]">
                % Share
              </th>

              <th className="w-[200px] px-3 py-2.5 text-left font-semibold text-[var(--text-dark)]">
                Distribution
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => {
              const share = ((item.detection / analyticsTotal) * 100).toFixed(
                1,
              );
              return (
                <tr
                  key={idx}
                  className="h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer"
                >
                  <td className="px-3 py-1.5 text-center text-[13px] font-normal text-[var(--text-muted)] border-r border-[var(--border-color)] whitespace-nowrap">
                    {(currentPage - 1) * rowsPerPage + idx + 1}
                  </td>
                  <td className="px-4 py-1.5 text-[13px] font-normal text-[var(--text-dark)] border-r border-[var(--border-color)] whitespace-nowrap">
                    {item.time}
                  </td>
                  <td className="px-4 py-1.5 text-right text-[13px] font-bold text-[var(--text-dark)] border-r border-[var(--border-color)] whitespace-nowrap">
                    {item.detection.toLocaleString()}
                  </td>
                  <td className="px-4 py-1.5 text-right text-[13px] font-normal text-[var(--text-muted)] border-r border-[var(--border-color)] whitespace-nowrap">
                    {share}%
                  </td>
                  <td className="px-4 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-[var(--border-color)] dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-color)]/60"
                          style={{ width: `${(item.detection / 800) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* PAGINATION */}
      <div className="shrink-0 min-h-[40px] px-4 border-t border-[var(--border-color)] flex items-center justify-between">
        <p className="text-[10px] text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-dark)]">
            {(currentPage - 1) * rowsPerPage + 1}
          </span>
          -
          <span className="font-semibold text-[var(--text-dark)]">
            {Math.min(currentPage * rowsPerPage, analyticsData.length)}
          </span>
          /{analyticsData.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <BiChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all ${p === currentPage ? "bg-[var(--primary-color)] text-white" : "border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-color)]"}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <BiChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

const ROWS_OPTIONS = [50, 100, 200, 250];

const allDetections = [
  {
    id: 1,
    time: "06:31:25 PM",
    date: "04-07-2026",
    camera: "Gate 1 - Entry",
    vehicleNumber: "DL9BAR1234",
    type: "Sedan",
    vehicleType: "Sedan",
    color: "White",
    confidence: 98,
    reason: "Stolen Vehicle",
    blacklistedOn: "04-07-2026 06:31 PM",
    caseNo: "FIR/2026/1256",
    status: "Blacklist Hit",
    blockedIn: "Gate 1 - Entry",
    location: "Sector 10 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 2,
    time: "06:28:11 PM",
    date: "04-07-2026",
    camera: "Gate 2 - Exit",
    vehicleNumber: "HR26DK3915",
    type: "SUV",
    vehicleType: "SUV",
    color: "Black",
    confidence: 97,
    reason: "Other Reason",
    blacklistedOn: "04-07-2026 06:28 PM",
    caseNo: "FIR/2026/0587",
    status: "Blacklist Hit",
    blockedIn: "Gate 2 - Exit",
    location: "Sector 10 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 3,
    time: "06:15:42 PM",
    date: "04-07-2026",
    camera: "Parking Area",
    vehicleNumber: "PB10E7788",
    type: "Hatchback",
    vehicleType: "Hatchback",
    color: "Red",
    confidence: 96,
    reason: "Hit and Run",
    blacklistedOn: "04-07-2026 06:15 PM",
    caseNo: "FIR/2026/0745",
    status: "Found",
    blockedIn: "Parking Area",
    location: "Sector 10 PS",
    foundedIn: "Gate 1 - Entry",
    foundedTimestamp: "04-07-2026 07:30 PM",
  },
  {
    id: 4,
    time: "05:58:33 PM",
    date: "04-07-2026",
    camera: "Gate 1 - Entry",
    vehicleNumber: "UP16CA4567",
    type: "Sedan",
    vehicleType: "Sedan",
    color: "Silver",
    confidence: 95,
    reason: "Stolen Vehicle",
    blacklistedOn: "04-07-2026 05:58 AM",
    caseNo: "FIR/2026/0633",
    status: "Normal",
    blockedIn: "Gate 1 - Entry",
    location: "Sector 10 PS",
    foundedIn: "Parking Area",
    foundedTimestamp: "04-07-2026 06:45 AM",
  },
  {
    id: 5,
    time: "05:42:18 PM",
    date: "04-07-2026",
    camera: "Road PTZ - Lane 1",
    vehicleNumber: "DL02BC5678",
    type: "SUV",
    vehicleType: "SUV",
    color: "Blue",
    confidence: 94,
    reason: "Fraud",
    blacklistedOn: "04-07-2026 05:42 AM",
    caseNo: "FIR/2026/0500",
    status: "Normal",
    blockedIn: "Road PTZ - Lane 1",
    location: "Sector 12 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 6,
    time: "05:30:05 PM",
    date: "04-07-2026",
    camera: "Lobby Entrance",
    vehicleNumber: "MH12DE3456",
    type: "Sedan",
    vehicleType: "Sedan",
    color: "Grey",
    confidence: 93,
    reason: "Other Reason",
    blacklistedOn: "04-07-2026 05:30 AM",
    caseNo: "FIR/2026/0380",
    status: "Normal",
    blockedIn: "Lobby Entrance",
    location: "Sector 10 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 7,
    time: "05:15:22 PM",
    date: "04-07-2026",
    camera: "Rear Gate",
    vehicleNumber: "GJ05FG7890",
    type: "Truck",
    vehicleType: "Truck",
    color: "White",
    confidence: 92,
    reason: "Stolen Vehicle",
    blacklistedOn: "04-07-2026 05:15 AM",
    caseNo: "FIR/2026/0290",
    status: "Normal",
    blockedIn: "Rear Gate",
    location: "Sector 14 PS",
    foundedIn: "Gate 2 - Exit",
    foundedTimestamp: "04-07-2026 06:00 AM",
  },
  {
    id: 8,
    time: "04:58:11 PM",
    date: "04-07-2026",
    camera: "Gate 1 - Entry",
    vehicleNumber: "RJ14UA9911",
    type: "Hatchback",
    vehicleType: "Hatchback",
    color: "Red",
    confidence: 91,
    reason: "Hit and Run",
    blacklistedOn: "04-07-2026 04:58 AM",
    caseNo: "FIR/2026/0412",
    status: "Blacklist Hit",
    blockedIn: "Gate 1 - Entry",
    location: "Sector 10 PS",
    foundedIn: "Lobby Entrance",
    foundedTimestamp: "04-07-2026 05:30 AM",
  },
  {
    id: 9,
    time: "04:42:30 PM",
    date: "04-07-2026",
    camera: "Gate 2 - Exit",
    vehicleNumber: "KA01MN4567",
    type: "SUV",
    vehicleType: "SUV",
    color: "Black",
    confidence: 90,
    reason: "Stolen Vehicle",
    blacklistedOn: "04-07-2026 04:42 AM",
    caseNo: "FIR/2026/0456",
    status: "Normal",
    blockedIn: "Gate 2 - Exit",
    location: "Sector 12 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 10,
    time: "04:30:15 PM",
    date: "04-07-2026",
    camera: "Parking Area",
    vehicleNumber: "TN09QR9012",
    type: "Sedan",
    vehicleType: "Sedan",
    color: "White",
    confidence: 89,
    reason: "Other Reason",
    blacklistedOn: "04-07-2026 04:30 AM",
    caseNo: "FIR/2026/0520",
    status: "Normal",
    blockedIn: "Parking Area",
    location: "Sector 10 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 11,
    time: "04:15:42 PM",
    date: "03-07-2026",
    camera: "Gate 1 - Entry",
    vehicleNumber: "DL3CCT1234",
    type: "SUV",
    vehicleType: "SUV",
    color: "Yellow",
    confidence: 96,
    reason: "Stolen Vehicle",
    blacklistedOn: "03-07-2026 04:15 AM",
    caseNo: "FIR/2026/0550",
    status: "Blacklist Hit",
    blockedIn: "Gate 1 - Entry",
    location: "Sector 10 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 12,
    time: "03:58:18 PM",
    date: "03-07-2026",
    camera: "Road PTZ - Lane 1",
    vehicleNumber: "HR26AB7890",
    type: "SUV",
    vehicleType: "SUV",
    color: "Black",
    confidence: 95,
    reason: "Hit and Run",
    blacklistedOn: "03-07-2026 03:58 AM",
    caseNo: "FIR/2026/0600",
    status: "Blacklist Hit",
    blockedIn: "Road PTZ - Lane 1",
    location: "Sector 12 PS",
    foundedIn: "Gate 2 - Exit",
    foundedTimestamp: "03-07-2026 04:30 AM",
  },
  {
    id: 13,
    time: "03:42:55 PM",
    date: "03-07-2026",
    camera: "Lobby Entrance",
    vehicleNumber: "MH02DK1234",
    type: "Sedan",
    vehicleType: "Sedan",
    color: "Blue",
    confidence: 94,
    reason: "Fraud",
    blacklistedOn: "03-07-2026 03:42 AM",
    caseNo: "FIR/2026/0650",
    status: "Normal",
    blockedIn: "Lobby Entrance",
    location: "Sector 10 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 14,
    time: "03:30:08 PM",
    date: "03-07-2026",
    camera: "Gate 2 - Exit",
    vehicleNumber: "DL01AB1234",
    type: "Sedan",
    vehicleType: "Sedan",
    color: "White",
    confidence: 93,
    reason: "Stolen Vehicle",
    blacklistedOn: "03-07-2026 03:30 AM",
    caseNo: "FIR/2026/0700",
    status: "Normal",
    blockedIn: "Gate 2 - Exit",
    location: "Sector 10 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 15,
    time: "03:15:33 PM",
    date: "03-07-2026",
    camera: "Parking Area",
    vehicleNumber: "KA01JK5678",
    type: "SUV",
    vehicleType: "SUV",
    color: "Black",
    confidence: 92,
    reason: "Other Reason",
    blacklistedOn: "03-07-2026 03:15 AM",
    caseNo: "FIR/2026/0750",
    status: "Normal",
    blockedIn: "Parking Area",
    location: "Sector 12 PS",
    foundedIn: "Gate 1 - Entry",
    foundedTimestamp: "03-07-2026 03:30 AM",
  },
  {
    id: 16,
    time: "02:58:21 PM",
    date: "02-07-2026",
    camera: "Gate 1 - Entry",
    vehicleNumber: "MH12IJ3456",
    type: "Sedan",
    vehicleType: "Sedan",
    color: "Grey",
    confidence: 91,
    reason: "Hit and Run",
    blacklistedOn: "02-07-2026 02:58 AM",
    caseNo: "FIR/2026/0800",
    status: "Blacklist Hit",
    blockedIn: "Gate 1 - Entry",
    location: "Sector 10 PS",
    foundedIn: "Lobby Entrance",
    foundedTimestamp: "02-07-2026 03:15 AM",
  },
  {
    id: 17,
    time: "02:42:45 PM",
    date: "02-07-2026",
    camera: "Rear Gate",
    vehicleNumber: "GJ05KL7890",
    type: "Truck",
    vehicleType: "Truck",
    color: "White",
    confidence: 90,
    reason: "Stolen Vehicle",
    blacklistedOn: "02-07-2026 02:42 AM",
    caseNo: "FIR/2026/0850",
    status: "Normal",
    blockedIn: "Rear Gate",
    location: "Sector 14 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 18,
    time: "02:30:12 PM",
    date: "02-07-2026",
    camera: "Gate 2 - Exit",
    vehicleNumber: "RJ14MN1234",
    type: "Hatchback",
    vehicleType: "Hatchback",
    color: "Red",
    confidence: 89,
    reason: "Fraud",
    blacklistedOn: "02-07-2026 02:30 AM",
    caseNo: "FIR/2026/0900",
    status: "Normal",
    blockedIn: "Gate 2 - Exit",
    location: "Sector 10 PS",
    foundedIn: null,
    foundedTimestamp: null,
  },
  {
    id: 19,
    time: "02:15:28 PM",
    date: "02-07-2026",
    camera: "Parking Area",
    vehicleNumber: "KA01OP5678",
    type: "SUV",
    vehicleType: "SUV",
    color: "Black",
    confidence: 88,
    reason: "Other Reason",
    blacklistedOn: "02-07-2026 02:15 AM",
    caseNo: "FIR/2026/0950",
    status: "Normal",
    blockedIn: "Parking Area",
    location: "Sector 12 PS",
    foundedIn: "Road PTZ - Lane 1",
    foundedTimestamp: "02-07-2026 02:30 AM",
  },
  {
    id: 20,
    time: "01:58:55 PM",
    date: "01-07-2026",
    camera: "Gate 1 - Entry",
    vehicleNumber: "TN09QR9012",
    type: "Sedan",
    vehicleType: "Sedan",
    color: "White",
    confidence: 87,
    reason: "Stolen Vehicle",
    blacklistedOn: "01-07-2026 01:58 AM",
    caseNo: "FIR/2026/1000",
    status: "Blacklist Hit",
    blockedIn: "Gate 1 - Entry",
    location: "Sector 10 PS",
    foundedIn: "Lobby Entrance",
    foundedTimestamp: "01-07-2026 02:15 AM",
  },
];

const tabs = [
  { key: "cameras", label: "Total ANPR Cameras" },
  { key: "vehicles", label: "Total Detected Vehicles" },
  { key: "blacklisted", label: "Blacklisted Vehicles" },
  { key: "founded", label: "Founded Vehicles" },
  { key: "analytics", label: "Vehicle Detection Time Analytics" },
  { key: "topcameras", label: "Top Active Cameras by Detections" },
];

function AnprReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "cameras";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [groupFilter, setGroupFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);

  const openMapModal = (camera, index) => {
    setSelectedCamera({ ...camera, district: camera.group });
    setSelectedCameraIndex(index);
    setMapModalOpen(true);
  };

  const closeMapModal = () => {
    setMapModalOpen(false);
  };

  // ANPR cameras data - currently no backend endpoint, using empty array
  const anprCameras = useMemo(() => [], []);

  const anprGroups = useMemo(
    () => [...new Set(anprCameras.map((c) => c.group))],
    [],
  );

  const vehicleTypes = useMemo(
    () => [...new Set(allDetections.map((d) => d.vehicleType))],
    [],
  );

  const tabCounts = useMemo(
    () => ({
      cameras: anprCameras.length,
      vehicles: 124800000,
      blacklisted: 1102,
      founded: 214,
      analytics: "",
      topcameras: "",
    }),
    [],
  );

  const filtered = useMemo(() => {
    if (activeTab === "cameras") {
      let data = anprCameras;
      if (groupFilter !== "All")
        data = data.filter((c) => c.group === groupFilter);
      if (statusFilter !== "All")
        data = data.filter((c) => c.status === statusFilter);
      return data;
    }
    let data = allDetections;
    if (activeTab === "vehicles") {
      if (typeFilter !== "All")
        data = data.filter((d) => d.type === typeFilter);
      if (statusFilter !== "All")
        data = data.filter((d) => d.status === statusFilter);
    } else if (activeTab === "blacklisted") {
      data = data.filter((d) => d.status === "Blacklist Hit");
    } else if (activeTab === "founded") {
      data = data.filter((d) => d.status === "Normal");
    }
    if (activeTab !== "vehicles") {
      if (typeFilter !== "All")
        data = data.filter((d) => d.vehicleType === typeFilter);
      if (statusFilter !== "All")
        data = data.filter((d) => d.status === statusFilter);
    }
    return data;
  }, [activeTab, groupFilter, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const resetFilters = () => {
    setGroupFilter("All");
    setTypeFilter("All");
    setStatusFilter("All");
    setPage(1);
  };

  const hasActiveFilters =
    activeTab === "cameras"
      ? groupFilter !== "All" || statusFilter !== "All"
      : activeTab === "vehicles" ||
          activeTab === "blacklisted" ||
          activeTab === "founded"
        ? typeFilter !== "All" || statusFilter !== "All"
        : false;

  const exportToCSV = () => {
    const isCameraTab = activeTab === "cameras";
    const headers = isCameraTab
      ? ["SN", "Camera / NVR Name", "Group", "Status"]
      : [
          "SN",
          "Vehicle Number",
          "Vehicle Type",
          "Color",
          "Reason",
          "Blacklisted On",
          "Case / FIR No.",
          "Blocked In",
          "Status",
        ];
    const rows = filtered.map((d, idx) =>
      isCameraTab
        ? [idx + 1, d.name, d.group, d.status]
        : [
            idx + 1,
            d.vehicleNumber,
            d.vehicleType,
            d.color,
            d.reason,
            d.blacklistedOn,
            d.caseNo,
            d.blockedIn,
            d.status,
          ],
    );
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `anpr_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    const isCameraTab = activeTab === "cameras";
    const tableHeaders = isCameraTab
      ? ["SN", "Camera / NVR Name", "Group", "Status"]
      : [
          "SN",
          "Vehicle Number",
          "Vehicle Type",
          "Color",
          "Reason",
          "Blacklisted On",
          "Case / FIR No.",
          "Blocked In",
          "Status",
        ];
    const tableRows = filtered
      .map((d, idx) => {
        if (isCameraTab) {
          return `<tr>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${d.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${d.group}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${d.status}</td>
          </tr>`;
        }
        return `<tr>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${d.vehicleNumber}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${d.vehicleType}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${d.color}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${d.reason}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${d.blacklistedOn}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${d.caseNo}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${d.blockedIn}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${d.status}</td>
        </tr>`;
      })
      .join("");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>ANPR Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f4f4f4; padding: 8px; border: 1px solid #ddd; font-size: 11px; }
            td { font-size: 10px; }
            .info { color: #666; font-size: 12px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>${isCameraTab ? "ANPR Cameras Report" : "ANPR Detection Report"}</h1>
          <p class="info">Generated on: ${new Date().toLocaleString()}</p>
          <p class="info">Total: ${filtered.length}</p>
          <table>
            <thead>
              <tr>${tableHeaders.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowExportMenu(false);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[var(--bg-color)] relative">
      <BodyHead>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 min-w-0">
            <div className=" flex-shrink-0">
              <HiOutlineDocumentChartBar className="text-[var(--primary-color)] text-2xl" />
            </div>
            <div className="leading-tight min-w-0">
              <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
                ANPR Reports
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {activeTab === "cameras" ? (
              <>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-blue-200 dark:border-blue-800">
                  <span className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Total
                  </span>
                  <span className="text-[14px] font-bold text-blue-600 dark:text-blue-400">
                    {filtered.length}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-emerald-200 dark:border-emerald-800">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Online
                  </span>
                  <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                    {filtered.filter((c) => c.status === "Online").length}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-red-200 dark:border-red-800">
                  <span className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Offline
                  </span>
                  <span className="text-[14px] font-bold text-red-500 dark:text-red-400">
                    {filtered.filter((c) => c.status === "Offline").length}
                  </span>
                </div>
              </>
            ) : activeTab === "vehicles" ? (
              <>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-purple-200 dark:border-purple-800">
                  <span className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Vehicles
                  </span>
                  <span className="text-[14px] font-bold text-purple-600 dark:text-purple-400">
                    {new Set(filtered.map((d) => d.vehicleNumber)).size}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-red-200 dark:border-red-800">
                  <span className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Blacklisted
                  </span>
                  <span className="text-[14px] font-bold text-red-500 dark:text-red-400">
                    {
                      filtered.filter((d) => d.status === "Blacklist Hit")
                        .length
                    }
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-emerald-200 dark:border-emerald-800">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Normal
                  </span>
                  <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                    {filtered.filter((d) => d.status === "Normal").length}
                  </span>
                </div>
              </>
            ) : activeTab === "blacklisted" || activeTab === "founded" ? (
              <>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-purple-200 dark:border-purple-800">
                  <span className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Total
                  </span>
                  <span className="text-[14px] font-bold text-purple-600 dark:text-purple-400">
                    {filtered.length}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-emerald-200 dark:border-emerald-800">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Active
                  </span>
                  <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                    {filtered.filter((d) => d.status === "Active").length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-blue-200 dark:border-blue-800">
                  <span className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400" />
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                    Found
                  </span>
                  <span className="text-[14px] font-bold text-blue-600 dark:text-blue-400">
                    {filtered.filter((d) => d.status === "Found").length}
                  </span>
                </div>
              </>
            ) : null}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] transition-all"
                title="Reset all filters"
              >
                <FaFilter size={12} />
                Reset
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-semibold bg-[var(--primary-color)] text-white hover:opacity-90 transition-all shadow-sm"
              >
                <FaDownload size={14} />
                Export
              </button>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="vms-dropdown absolute right-0 top-full mt-1 z-50 py-1 min-w-[140px]">
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 w-full px-3 py-2 text-[11px] font-medium text-[var(--text-dark)] hover:bg-[var(--bg-color)] transition-colors"
                    >
                      <FaFileExcel size={14} className="text-emerald-600" />
                      Export Excel
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="flex items-center gap-2 w-full px-3 py-2 text-[11px] font-medium text-[var(--text-dark)] hover:bg-[var(--bg-color)] transition-colors"
                    >
                      <FaFilePdf size={14} className="text-red-500" />
                      Export PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </BodyHead>

      {/* Main Content */}
      <BodyContainer className="flex-1 min-h-0 overflow-hidden p-3">
        <div className="h-full min-h-0 flex flex-col gap-3 overflow-hidden">
          {/* TAB PILLS + STATS + TABLE */}
          <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
            <div className="shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchParams({ tab: tab.key });
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-[13px] md:text-[13px] font-semibold border transition-all whitespace-nowrap shrink-0 ${activeTab === tab.key ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-sm" : "bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "analytics" ? (
              <AnalyticsTable page={page} setPage={setPage} />
            ) : activeTab === "topcameras" ? (
              <div className="flex-1 min-h-0 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
                <TopCamerasByDetections />
              </div>
            ) : (
              <div className="flex-1 min-h-0 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                  <table
                    className={`w-full text-left text-xs ${activeTab === "cameras" ? "min-w-[800px]" : activeTab === "vehicles" ? "min-w-[1100px]" : activeTab === "founded" ? "min-w-[1400px]" : "min-w-[1200px]"} `}
                  >
                    <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-[0_1px_0_0_var(--border-color)] ">
                      {activeTab === "cameras" ? (
                        <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
                          <th className="py-1.5 px-3 align-middle border-r border-b-2 border-[var(--border-color)] font-semibold w-[50px] text-center">
                            SN.
                          </th>

                          <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)] font-semibold min-w-[180px]">
                            DEVICE NAME
                          </th>

                          <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)]">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                                ZONE
                              </span>

                              <select
                                value={groupFilter}
                                onChange={(e) => {
                                  setGroupFilter(e.target.value);
                                  setPage(1);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 text-[12px] px-2 pr-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                              >
                                <option value="All">ALL</option>
                                {anprGroups.map((g) => (
                                  <option key={g} value={g}>
                                    {g.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </th>

                          <th className="py-1.5 px-3 border-r border-b-2 border-[var(--border-color)]">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                                STATUS
                              </span>

                              <select
                                value={statusFilter}
                                onChange={(e) => {
                                  setStatusFilter(e.target.value);
                                  setPage(1);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 text-[12px] px-2 pr-6 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                              >
                                <option value="All">ALL</option>
                                <option value="Online">ONLINE</option>
                                <option value="Offline">OFFLINE</option>
                              </select>
                            </div>
                          </th>

                          <th className="py-1.5 px-3 border-b-2 border-[var(--border-color)] font-semibold text-center w-[80px]">
                            MAP
                          </th>
                        </tr>
                      ) : activeTab === "vehicles" ? (
                        <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[50px] text-center">
                            SN.
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[100px]">
                            TIME
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] min-w-[120px]">
                            DEVICE NAME
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] min-w-[120px]">
                            VEHICLE NUMBER
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[120px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                                TYPE
                              </span>
                              <select
                                value={typeFilter}
                                onChange={(e) => {
                                  setTypeFilter(e.target.value);
                                  setPage(1);
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
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[80px]">
                            COLOR
                          </th>

                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[100px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                                STATUS
                              </span>
                              <select
                                value={statusFilter}
                                onChange={(e) => {
                                  setStatusFilter(e.target.value);
                                  setPage(1);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 text-[12px] px-2 pr-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                              >
                                <option value="All">ALL</option>
                                <option value="Blacklist Hit">BLACKLIST</option>
                                <option value="Normal">NORMAL</option>
                              </select>
                            </div>
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-[var(--border-color)] min-w-[100px]">
                            LOCATION
                          </th>
                        </tr>
                      ) : (
                        <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 px-3 py-3 border-b border-[var(--border-color)]">
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[50px] text-center">
                            SN.
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] min-w-[100px]">
                            VEHICLE NUMBER
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[90px]">
                            TYPE
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[90px]">
                            COLOR
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[120px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                                REASON
                              </span>
                              <select
                                value={typeFilter}
                                onChange={(e) => {
                                  setTypeFilter(e.target.value);
                                  setPage(1);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 text-[12px] px-2 pr-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                              >
                                <option value="All">ALL</option>
                                <option value="Stolen Vehicle">STOLEN</option>
                                <option value="Hit and Run">HIT & RUN</option>
                                <option value="Fraud">FRAUD</option>
                                <option value="Other Reason">OTHER</option>
                              </select>
                            </div>
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] min-w-[100px]">
                            BLACKLISTED ON
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] min-w-[100px]">
                            CASE / FIR NO.
                          </th>
                          <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[130px]">
                            BLOCKED IN
                          </th>
                          {activeTab === "founded" && (
                            <>
                              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b-2 border-r border-[var(--border-color)] w-[130px]">
                                FOUNDED IN
                              </th>
                              <th className="py-1.5 px-3 border-r border-[var(--border-color)] font-semibold border-b border-[var(--border-color)] w-[140px]">
                                FOUNDED ON
                              </th>
                            </>
                          )}
                          <th className="py-1.5 px-3 font-semibold border-b border-[var(--border-color)] w-[80px]">
                            ACTION
                          </th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {activeTab === "cameras"
                        ? paginated.map((c, idx) => (
                            <tr
                              key={c.id}
                              className="h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer"
                            >
                              {/* S.No */}
                              <td className="py-1.5 px-3 border-r border-[var(--border-color)] text-center whitespace-nowrap">
                                <span className="text-[13px] font-normal text-[var(--text-muted)]">
                                  {(page - 1) * rowsPerPage + idx + 1}
                                </span>
                              </td>

                              {/* Camera Name */}
                              <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                  {c.name}
                                </span>
                              </td>

                              {/* Group */}
                              <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0 rounded-full text-[13px] font-normal">
                                  {c.group}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0 rounded-full text-[12px] font-normal`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      c.status === "Online"
                                        ? "bg-emerald-500"
                                        : "bg-red-400"
                                    }`}
                                  />
                                  {c.status}
                                </span>
                              </td>

                              {/* Map Button */}
                              <td className="py-1.5 px-3 border-r border-[var(--border-color)] text-center whitespace-nowrap">
                                <button
                                  onClick={() =>
                                    openMapModal(
                                      c,
                                      (page - 1) * rowsPerPage + idx,
                                    )
                                  }
                                  title={`View ${c.name} on map`}
                                  className="p-1.5 rounded-lg hover:bg-[var(--primary-color)]/10 text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                                >
                                  <FaMapMarkerAlt size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        : activeTab === "vehicles"
                          ? paginated.map((d, idx) => (
                              <tr
                                key={d.id}
                                className={`h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer ${
                                  d.status === "Blacklist Hit"
                                    ? "bg-red-50/30"
                                    : ""
                                }`}
                              >
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] text-center whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-muted)]">
                                    {(page - 1) * rowsPerPage + idx + 1}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-muted)]">
                                    {d.time}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                    {d.camera}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-semibold  tracking-wide">
                                    {d.vehicleNumber}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                    {d.type}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                    {d.color}
                                  </span>
                                </td>

                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                    {d.status === "Blacklist Hit"
                                      ? "Blacklist"
                                      : "Normal"}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-muted)]">
                                    {d.location}
                                  </span>
                                </td>
                              </tr>
                            ))
                          : paginated.map((d, idx) => (
                              <tr
                                key={d.id}
                                className={`h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer ${
                                  d.status === "Found" ? "bg-blue-50/30" : ""
                                }`}
                              >
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] text-center whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-muted)]">
                                    {(page - 1) * rowsPerPage + idx + 1}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-semibold  tracking-wide">
                                    {d.vehicleNumber}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                    {d.vehicleType}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                    {d.color}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                    {d.reason}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-muted)]">
                                    {d.blacklistedOn}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span className="text-[13px] font-normal text-[var(--text-muted)]">
                                    {d.caseNo}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                  <span
                                    className="text-[13px] font-normal text-[var(--text-dark)]"
                                    title={d.blockedIn}
                                  >
                                    {d.blockedIn || "\u2014"}
                                  </span>
                                </td>
                                {activeTab === "founded" && (
                                  <>
                                    <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                      <span
                                        className="text-[13px] font-normal text-[var(--text-dark)]"
                                        title={d.foundedIn}
                                      >
                                        {d.foundedIn || "\u2014"}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                                      <span
                                        className="text-[13px] font-normal text-[var(--text-muted)]"
                                        title={d.foundedTimestamp}
                                      >
                                        {d.foundedTimestamp || "\u2014"}
                                      </span>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                      {paginated.length === 0 && (
                        <tr>
                          <td colSpan="9" className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <p className="text-[12px] font-medium text-[var(--text-muted)]">
                                {activeTab === "cameras"
                                  ? "No cameras found"
                                  : "No detections found"}
                              </p>
                              <p className="text-[14px] text-[var(--text-muted)]">
                                Try adjusting your filters
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="shrink-0 h-[48px] min-h-[48px] px-4 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-color)]/30">
                  <div className="flex items-center gap-3">
                    <p className="text-[14px] text-[var(--text-muted)]">
                      Showing{" "}
                      <span className="font-semibold text-[var(--text-dark)]">
                        {filtered.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}
                      </span>{" "}
                      -{" "}
                      <span className="font-semibold text-[var(--text-dark)]">
                        {Math.min(page * rowsPerPage, filtered.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-[var(--text-dark)]">
                        {filtered.length}
                      </span>{" "}
                      {activeTab === "cameras" ? "cameras" : "detections"}
                    </p>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                      className="h-7 text-[12px] px-2 pr-6 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                    >
                      {ROWS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt} rows
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <BiChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all ${
                            p === page
                              ? "bg-[var(--primary-color)] text-white shadow-sm"
                              : "border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages || totalPages === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <BiChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </BodyContainer>

      <MapModal
        isOpen={mapModalOpen}
        onClose={closeMapModal}
        camera={selectedCamera}
        index={selectedCameraIndex}
      />
    </div>
  );
}

export default AnprReports;
