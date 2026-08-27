import { useState, useEffect } from "react";
import { Users, Camera, Wifi, WifiOff, Bell } from "lucide-react";
import TopCard from "../../components/dashboard/TopCard";
import BottomStats from "../../components/dashboard/BottomStats";
import TotalCameraGraph from "../../components/dashboard/TotalCameraGraph";
import CameraReport from "../../components/dashboard/CameraReport";
import LiveMapOverview from "../../components/dashboard/LiveMapOverview";
import dashboardService from "../../api/dashboardService";
import systemService from "../../api/systemService";
import cameraService from "../../api/cameraService";

// Map the backend /dashboard/summary payload into the five KPI cards TopCard renders.
function buildStatsFromSummary(summary) {
  if (!summary) return [];
  const { users, cameras: cams, online, offline, alerts } = summary;
  return [
    {
      title: "Total Users",
      value: users?.total ?? 0,
      color: "#8b5cf6",
      icon: Users,
      change: `${users?.active ?? 0} active`,
      showProgress: false,
      showDot: false,
      cardType: "Total Users",
    },
    {
      title: "Total Cameras",
      value: cams?.total ?? 0,
      color: "#3b82f6",
      icon: Camera,
      change: `Across ${cams?.stations ?? 0} stations`,
      showProgress: false,
      showDot: false,
      cardType: "Total Cameras",
    },
    {
      title: "Online Cameras",
      value: online?.count ?? 0,
      color: "#10b981",
      icon: Wifi,
      change: `${online?.uptime_pct ?? 0}% uptime`,
      showProgress: false,
      progressPercent: online?.uptime_pct ?? 0,
      showDot: false,
      cardType: "Online Cameras",
    },
    {
      title: "Offline Cameras",
      value: offline?.count ?? 0,
      color: "#ef4444",
      icon: WifiOff,
      change: `Needs attention`,
      showProgress: false,
      showDot: true,
      cardType: "Offline Cameras",
    },
    {
      title: "Alerts",
      value: alerts?.total ?? 0,
      color: "#f59e0b",
      icon: Bell,
      change: `${alerts?.critical ?? 0} critical`,
      showProgress: false,
      showDot: true,
      cardType: "Alerts",
    },
  ];
}

// Map the backend /dashboard/camera-stats payload (array of
// { station_name, total, working, non_working }) into the two shapes the
// dashboard bar charts consume.
function buildCameraChartData(stationStats) {
  return stationStats.map((s) => ({
    district: s.station_name,
    alerts: s.total ?? 0,
  }));
}

function buildWorkingStatusData(stationStats) {
  return stationStats.map((s) => ({
    district: s.station_name,
    working: s.working ?? 0,
    nonWorking: s.non_working ?? 0,
  }));
}

const Dashboard = () => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [stats, setStats] = useState([]);
  const [health, setHealth] = useState(null);
  const [stationStats, setStationStats] = useState([]);
  const [cameras, setCameras] = useState([]);

  // Pull live KPI summary from the backend (once on mount).
  useEffect(() => {
    let cancelled = false;

    dashboardService
      .getSummary()
      .then((summary) => {
        if (!cancelled) setStats(buildStatsFromSummary(summary));
      })
      .catch((err) => console.error("Dashboard summary failed", err));

    // Per-station camera counts drive the two bar charts.
    dashboardService
      .getCameraStats()
      .then((list) => {
        if (!cancelled) setStationStats(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error("Dashboard camera-stats failed", err));

    // Fetch real cameras for the map
    cameraService
      .list()
      .then((list) => {
        if (!cancelled) setCameras(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error("Dashboard camera list failed", err));

    return () => {
      cancelled = true;
    };
  }, []);

  // Poll system health every 5 seconds for real-time bottom stats.
  useEffect(() => {
    let cancelled = false;
    let timer;

    function fetchHealth() {
      systemService
        .getHealth()
        .then((h) => {
          if (!cancelled) setHealth(h);
        })
        .catch((err) => console.error("System health failed", err));
    }

    fetchHealth();
    timer = setInterval(fetchHealth, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const dashboardData = { stats };

  // Live per-station data straight from the backend. When the DB is empty the
  // backend returns [], and the charts render empty (no mock fallback).
  const cameraChartData = buildCameraChartData(stationStats);
  const workingStatusData = buildWorkingStatusData(stationStats);

  // Safety net: if user exits fullscreen via ESC key, force resize
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event("resize"));
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col p-2 sm:p-3 lg:p-4 bg-[var(--bg-color)] text-[var(--text-dark)] overflow-auto xl:overflow-hidden">
      {/* STATS - Full Width */}
      <div className="shrink-0 mb-3 sm:mb-4 lg:mb-5 dash-section-enter">
        <TopCard dashboardData={dashboardData} className="text-2xl" />
      </div>

      {/* MAIN CONTENT - Charts */}
      <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5 md:flex-1 md:min-h-0 mb-3 sm:mb-4 lg:mb-5">
        <div className="h-[300px] sm:h-[340px] md:h-auto md:min-h-0 chart-card-enter chart-card-enter-delay-1">
          <TotalCameraGraph
            data={cameraChartData}
            selectedDistrict={selectedDistrict}
            onDistrictClick={setSelectedDistrict}
          />
        </div>
        <div className="h-[300px] sm:h-[340px] md:h-auto md:min-h-0 chart-card-enter chart-card-enter-delay-2">
          <CameraReport
            data={workingStatusData}
            selectedDistrict={selectedDistrict}
            onDistrictClick={setSelectedDistrict}
          />
        </div>
        <div className="h-[300px] sm:h-[340px] md:h-auto md:min-h-0 chart-card-enter chart-card-enter-delay-3">
          <LiveMapOverview
            cameras={cameras}
            selectedDistrict={selectedDistrict}
            onDistrictClick={setSelectedDistrict}
          />
        </div>
      </div>

      {/* BOTTOM STATS */}
      <div className="shrink-0 dash-section-enter dash-section-enter-delay-3">
        <BottomStats health={health} />
      </div>
    </div>
  );
};

export default Dashboard;
