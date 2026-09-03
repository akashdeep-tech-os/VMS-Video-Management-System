import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import BodyHead from "../../components/common/BodyHead";
import BodyContainer from "../../components/common/BodyContainer";
import MapModal from "../../components/common/MapModal";
import cameraService from "../../api/cameraService";
import userService from "../../api/userService";
import dashboardService from "../../api/dashboardService";

// Map a backend CameraResponse -> the row shape this report renders/exports.
function mapCameraRow(c) {
  return {
    id: c.id,
    name: c.name,
    district: c.zone || c.nvr_name || "—",
    type: c.camera_type || "—",
    status: c.active === false ? "Offline" : c.healthy ? "Online" : "Offline",
    ip: c.camera_ip || c.nvr_ip || "—",
  };
}

// Map a backend user -> the row shape the Users report renders/exports.
function mapUserRow(u) {
  const name =
    [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
  return {
    id: u.id,
    name,
    role: u.role_name || "—",
    station: u.station_name || u.department_name || "—",
    status: u.active === false ? "Inactive" : "Active",
    lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : "—",
  };
}

import { BiLineChart, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import {
  FaMapMarkerAlt,
  FaFileExcel,
  FaFilePdf,
  FaDownload,
  FaClipboardList,
  FaFilter,
} from "react-icons/fa";

const ROWS_OPTIONS = [50, 100, 200, 250];

const tabs = [
  { key: "users", label: "Total Users" },
  { key: "total", label: "Total Cameras" },
  { key: "online", label: "Online Cameras" },
  { key: "offline", label: "Offline Cameras" },
  { key: "alerts", label: "Alerts" },
  { key: "stations", label: "Graph Details (Total Cameras)" },
];

function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "total";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabFilters, setTabFilters] = useState({
    total: { group: "All", type: "All", status: "All" },
    online: { group: "All", type: "All" },
    offline: { group: "All", type: "All" },
    users: {},
    alerts: {},
    stations: {},
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);

  // Live data: cameras + users + per-police-station stats.
  const [cameras, setCameras] = useState([]);
  const [users, setUsers] = useState([]);
  const [stationStats, setStationStats] = useState([]);
  // Alerts: no backend endpoint yet, using empty array
  const alerts = [];

  useEffect(() => {
    cameraService
      .list()
      .then((list) =>
        setCameras(Array.isArray(list) ? list.map(mapCameraRow) : []),
      )
      .catch((err) => console.error("Reports: cameras failed", err));
    userService
      .getUsers()
      .then((list) => setUsers(Array.isArray(list) ? list.map(mapUserRow) : []))
      .catch((err) => console.error("Reports: users failed", err));
    dashboardService
      .getCameraStats()
      .then((list) => setStationStats(Array.isArray(list) ? list : []))
      .catch((err) => console.error("Reports: camera-stats failed", err));
  }, []);

  const activeFilters = tabFilters[activeTab] || {};
  const groupFilter = activeFilters.group || "All";
  const typeFilter = activeFilters.type || "All";
  const statusFilter = activeFilters.status || "All";

  const updateFilter = (key, value) => {
    setTabFilters((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [key]: value },
    }));
    setPage(1);
  };

  const types = useMemo(
    () => [...new Set(cameras.map((c) => c.type))].filter(Boolean),
    [cameras],
  );
  const stationNames = useMemo(
    () => [...new Set(cameras.map((c) => c.district))].filter(Boolean),
    [cameras],
  );

  const resetFilters = () => {
    const base = { group: "All", type: "All" };
    if (activeTab === "total") base.status = "All";
    setTabFilters((prev) => ({ ...prev, [activeTab]: base }));
    setPage(1);
  };

  const openMapModal = (camera, index) => {
    setSelectedCamera(camera);
    setSelectedCameraIndex(index);
    setMapModalOpen(true);
  };

  const closeMapModal = () => {
    setMapModalOpen(false);
    setSelectedCamera(null);
    setSelectedCameraIndex(0);
  };

  const hasActiveFilters =
    groupFilter !== "All" ||
    typeFilter !== "All" ||
    (activeTab === "total" && statusFilter !== "All");

  // Per-police-station breakdown: prefer the live camera-stats endpoint;
  // fall back to grouping the fetched cameras by their zone/station.
  const stationData = useMemo(() => {
    if (stationStats.length > 0) {
      return stationStats.map((s) => ({
        name: s.station_name,
        total: s.total,
        online: s.working,
        offline: s.non_working,
      }));
    }
    const byStation = {};
    cameras.forEach((c) => {
      const key = c.district || "Unassigned";
      if (!byStation[key])
        byStation[key] = { name: key, total: 0, online: 0, offline: 0 };
      byStation[key].total += 1;
      if (c.status === "Online") byStation[key].online += 1;
      else byStation[key].offline += 1;
    });
    return Object.values(byStation);
  }, [stationStats, cameras]);

  const tabCounts = useMemo(
    () => ({
      total: cameras.length,
      online: cameras.filter((c) => c.status === "Online").length,
      offline: cameras.filter((c) => c.status === "Offline").length,
      stations: stationData.length,
      users: users.length,
      alerts: alerts.length,
    }),
    [cameras, users, stationData],
  );

  const filtered = useMemo(() => {
    let data = cameras;
    if (activeTab === "online")
      data = data.filter((c) => c.status === "Online");
    else if (activeTab === "offline")
      data = data.filter((c) => c.status === "Offline");
    if (groupFilter !== "All")
      data = data.filter((c) => c.district === groupFilter);
    if (typeFilter !== "All") data = data.filter((c) => c.type === typeFilter);
    if (statusFilter !== "All")
      data = data.filter((c) => c.status === statusFilter);
    return data;
  }, [cameras, activeTab, groupFilter, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const getExportData = () => {
    switch (activeTab) {
      case "users":
        return {
          title: "Users Report",
          headers: ["SN", "Name", "Role", "Station", "Status", "Last Login"],
          rows: users.map((u, idx) => [
            idx + 1,
            u.name,
            u.role,
            u.station,
            u.status,
            u.lastLogin,
          ]),
          filename: "users_report",
        };
      case "alerts":
        return {
          title: "Alerts Report",
          headers: [
            "SN",
            "Alert",
            "Location",
            "Severity",
            "Time",
            "Description",
          ],
          rows: alerts.map((a, idx) => [
            idx + 1,
            a.alert,
            a.location,
            a.severity,
            a.time,
            a.description,
          ]),
          filename: "alerts_report",
        };
      case "stations":
        return {
          title: "Graph Details (Total Cameras) Report",
          headers: [
            "SN",
            "Police Station",
            "Total",
            "Online",
            "Offline",
            "Working %",
          ],
          rows: stationData.map((s, idx) => [
            idx + 1,
            s.name,
            s.total,
            s.online,
            s.offline,
            s.total > 0 ? `${Math.round((s.online / s.total) * 100)}%` : "0%",
          ]),
          filename: "graph_details_report",
        };
      case "total":
      case "online":
      case "offline":
      default:
        return {
          title: "Camera / NVR Inventory Report",
          headers: ["SN", "Camera / NVR Name", groupLabel, "Type", "Status"],
          rows: filtered.map((c, idx) => [
            idx + 1,
            c.name,
            c.district,
            c.type,
            c.status,
          ]),
          filename: `${activeTab}_cameras_report`,
        };
    }
  };

  const exportToCSV = () => {
    const { headers, rows, filename } = getExportData();
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const { title, headers, rows } = getExportData();
    const printWindow = window.open("", "_blank");
    const tableRows = rows
      .map(
        (row) => `
        <tr>
          ${row.map((cell) => `<td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${cell}</td>`).join("")}
        </tr>
      `,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f4f4f4; padding: 8px; border: 1px solid #ddd; font-size: 12px; font-weight: bold; }
            td { font-size: 11px; }
            .info { color: #666; font-size: 12px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="info">Generated on: ${new Date().toLocaleString()}</p>
          <p class="info">Total Records: ${rows.length}</p>
          ${
            hasActiveFilters
              ? `<p class="info">Filters Applied: ${Object.entries(
                  activeFilters,
                )
                  .filter(([_, v]) => v !== "All")
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")}</p>`
              : ""
          }
          <table>
            <thead>
              <tr>
                ${headers.map((h) => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
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
            <div className="flex-shrink-0">
              <FaClipboardList className="text-[var(--primary-color)] text-[22px]" />
            </div>
            <div className="leading-tight min-w-0">
              <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
                Reports
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)]">
              <span className="w-3 h-3 rounded-full bg-[var(--primary-color)]" />
              <span className="text-[14px] font-semibold text-[var(--text-muted)]">
                Total
              </span>
              <span className="text-[14px] font-bold text-[var(--text-dark)]">
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
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-semibold border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] transition-all"
                title="Reset all filters"
              >
                <FaFilter size={14} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-[14px] font-semibold bg-[var(--primary-color)] text-white hover:opacity-90 transition-all shadow-sm"
              >
                <FaDownload size={14} />
                <span className="hidden sm:inline">Export</span>
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
                      className="flex items-center gap-2 w-full px-3 py-2 text-[14px] font-medium text-[var(--text-dark)] hover:bg-[var(--bg-color)] transition-colors"
                    >
                      <FaFileExcel size={14} className="text-emerald-600" />
                      Export Excel
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="flex items-center gap-2 w-full px-3 py-2 text-[14px] font-medium text-[var(--text-dark)] hover:bg-[var(--bg-color)] transition-colors"
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

      <BodyContainer className="flex-1 min-h-0 overflow-hidden p-2">
        <div className="h-full min-h-0 flex flex-col gap-2 overflow-hidden">
          {/* TAB PILLS + STATS */}
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
                <span
                  className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold ${activeTab === tab.key ? "bg-white/25 text-white" : "bg-[var(--bg-color)] text-[var(--text-muted)]"}`}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* TABLE or STATION VIEW or USERS or ALERTS */}
          {activeTab === "stations" ? (
            <div className="flex-1 min-h-0 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="min-w-[500px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-[0_1px_0_0_var(--border-color)]">
                      <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
                        <th className="py-[0.575rem] px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)] w-[50px]">
                          SN.
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Police Station
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Total
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Online
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Offline
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)] w-[120px]">
                          Working %
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-b-2 border-[var(--border-color)] w-[80px]">
                          Map
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stationData.map((s, i) => {
                        const pct =
                          s.total > 0
                            ? Math.round((s.online / s.total) * 100)
                            : 0;
                        return (
                          <tr
                            key={s.name}
                            className="h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer"
                          >
                            <td className="py-1.5 px-3 text-center text-[13px] font-normal text-[var(--text-muted)] border-r border-[var(--border-color)]">
                              {i + 1}
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                {s.name}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-center border-r border-[var(--border-color)]">
                              <span className="text-[13px] font-bold text-[var(--text-dark)]">
                                {s.total}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-center border-r border-[var(--border-color)]">
                              <span className="inline-flex items-center gap-1 text-[13px] font-normal text-emerald-600 dark:text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                {s.online}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-center border-r border-[var(--border-color)]">
                              <span className="inline-flex items-center gap-1 text-[13px] font-normal text-red-500 dark:text-red-400">
                                <span className="w-2 h-2 rounded-full bg-red-400 dark:bg-red-500" />
                                {s.offline}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-20 h-1.5 rounded-full bg-[var(--border-color)] dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[13px] font-bold text-[var(--text-dark)] w-8 text-right">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <button
                                onClick={() => {
                                  const firstCamera = cameras.find(
                                    (c) => c.district === s.name,
                                  );
                                  if (firstCamera) {
                                    const camIndex =
                                      cameras.indexOf(firstCamera);
                                    openMapModal(firstCamera, camIndex);
                                  }
                                }}
                                title={`View ${s.name} on map`}
                                className="p-1.5 rounded-lg hover:bg-[var(--primary-color)]/10 text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                              >
                                <FaMapMarkerAlt size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === "users" ? (
            <div className="flex-1 min-h-0 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="min-w-[500px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-[0_1px_0_0_var(--border-color)]">
                      <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
                        <th className="py-[0.575rem] px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)] w-[50px]">
                          SN.
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Name
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Role
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Station
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Status
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-b-2 border-[var(--border-color)]">
                          Last Login
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <FaMapMarkerAlt
                                size={28}
                                className="text-[var(--text-muted)]/40"
                              />
                              <p className="text-[13px] font-medium text-[var(--text-muted)]">
                                No users found
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                No user data available
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        users.map((u, idx) => (
                          <tr
                            key={u.id || idx}
                            className="h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer"
                          >
                            <td className="py-1.5 px-3 text-center text-[13px] font-normal text-[var(--text-muted)] border-r border-[var(--border-color)]">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                {u.name}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 text-[11px] font-medium">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[11px] font-medium">
                                {u.station}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  u.status === "Active"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-red-500/10 text-red-500 dark:text-red-400"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${u.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`}
                                />
                                {u.status}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-[13px] font-normal text-[var(--text-muted)]">
                              {u.lastLogin}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === "alerts" ? (
            <div className="flex-1 min-h-0 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="min-w-[600px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-[0_1px_0_0_var(--border-color)]">
                      <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/10 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
                        <th className="py-[0.575rem] px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)] w-[50px]">
                          SN.
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Alert
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Location
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Severity
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Time
                        </th>
                        <th className="py-[0.575rem] px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-b-2 border-[var(--border-color)]">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <FaMapMarkerAlt
                                size={28}
                                className="text-[var(--text-muted)]/40"
                              />
                              <p className="text-[13px] font-medium text-[var(--text-muted)]">
                                No alerts found
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                No alert data available
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        alerts.map((a, idx) => (
                          <tr
                            key={a.id || idx}
                            className="h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer"
                          >
                            <td className="py-1.5 px-3 text-center text-[13px] font-normal text-[var(--text-muted)] border-r border-[var(--border-color)]">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <span className="text-[13px] font-normal text-[var(--text-dark)]">
                                {a.alert}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[11px] font-medium">
                                {a.location}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 border-r border-[var(--border-color)]">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  a.severity === "High"
                                    ? "bg-red-500/10 text-red-500 dark:text-red-400"
                                    : a.severity === "Medium"
                                      ? "bg-amber-500/10 text-amber-500 dark:text-amber-400"
                                      : "bg-blue-500/10 text-blue-500 dark:text-blue-400"
                                }`}
                              >
                                {a.severity}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-[13px] font-normal text-[var(--text-muted)] border-r border-[var(--border-color)]">
                              {a.time}
                            </td>
                            <td className="py-1.5 px-3 text-[13px] font-normal text-[var(--text-muted)]">
                              {a.description}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="min-w-[600px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[var(--card-bg)] shadow-[0_1px_0_0_var(--border-color)]">
                      <tr className="uppercase text-[13px] tracking-wide bg-[var(--primary-color)]/16 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
                        <th className="py-1.5 px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)] w-[50px]">
                          SN.
                        </th>
                        <th className="py-1.5 px-3 align-middle text-left font-semibold text-[var(--text-dark)] border-r border-b-2 border-[var(--border-color)]">
                          Camera / NVR Name
                        </th>
                        <th className="py-1.5 px-3 align-middle border-r border-b-2 border-[var(--border-color)]">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                              ZONE
                            </span>
                            <select
                              value={groupFilter}
                              onChange={(e) =>
                                updateFilter("group", e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 text-[12px] px-2 pr-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                            >
                              <option value="All">ALL</option>
                              {stationNames.map((g) => (
                                <option key={g} value={g}>
                                  {g.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                        </th>
                        <th className="py-1.5 px-3 align-middle border-r border-b-2 border-[var(--border-color)]">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                              TYPE
                            </span>
                            <select
                              value={typeFilter}
                              onChange={(e) =>
                                updateFilter("type", e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 text-[12px] px-2 pr-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                            >
                              <option value="All">ALL</option>
                              {types.map((t) => (
                                <option key={t} value={t}>
                                  {t.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                        </th>
                        <th className="py-1.5 px-3 align-middle border-r border-b-2 border-[var(--border-color)]">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[var(--text-dark)] uppercase tracking-wide whitespace-nowrap">
                              STATUS
                            </span>
                            {activeTab === "total" && (
                              <select
                                value={statusFilter}
                                onChange={(e) =>
                                  updateFilter("status", e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 text-[12px] px-2 pr-3 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] font-medium uppercase focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]/30 cursor-pointer select-arrow-bg"
                              >
                                <option value="All">ALL</option>
                                <option value="Online">ONLINE</option>
                                <option value="Offline">OFFLINE</option>
                              </select>
                            )}
                          </div>
                        </th>
                        <th className="py-1.5 px-3 align-middle text-center font-semibold text-[var(--text-dark)] border-b-2 border-[var(--border-color)] w-[80px]">
                          MAP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((c, idx) => (
                        <tr
                          key={c.id}
                          className="h-[44px] border-b border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--primary-color)]/[0.07] cursor-pointer"
                        >
                          <td className="py-1.5 px-3 text-center border-r border-[var(--border-color)]">
                            <span className="text-[13px] font-normal text-[var(--text-muted)]">
                              {(page - 1) * rowsPerPage + idx + 1}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                            <span className="text-[13px] font-normal text-[var(--text-dark)]">
                              {c.name}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0 rounded-full text-[13px] font-normal">
                              {c.district}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0 rounded-full text-[13px] font-normal ${
                                c.type === "PTZ"
                                  ? "text-purple-500 dark:text-purple-400"
                                  : c.type === "Dome"
                                    ? "text-sky-500 dark:text-sky-400"
                                    : c.type === "Bullet"
                                      ? "text-amber-500 dark:text-amber-400"
                                      : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {c.type}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border-r border-[var(--border-color)] whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0 rounded-full text-[13px] font-normal ${
                                c.status === "Online"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-500 dark:text-red-400"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${c.status === "Online" ? "bg-emerald-500" : "bg-red-400"}`}
                              />
                              {c.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              onClick={() =>
                                openMapModal(c, (page - 1) * rowsPerPage + idx)
                              }
                              title={`View ${c.name} on map`}
                              className="p-1.5 rounded-lg hover:bg-[var(--primary-color)]/10 text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                            >
                              <FaMapMarkerAlt size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginated.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <FaMapMarkerAlt
                                size={28}
                                className="text-[var(--text-muted)]/40"
                              />
                              <p className="text-[14px] font-medium text-[var(--text-muted)]">
                                No cameras found
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
              </div>

              {/* PAGINATION */}
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
                    </span>
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

export default Reports;
