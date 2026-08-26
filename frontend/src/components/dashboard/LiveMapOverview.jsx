import { useState, useRef, useMemo, useEffect } from "react";
import MapGL, { Marker, Popup } from "react-map-gl/maplibre";
import { ZoomIn, ZoomOut, Search, Navigation, Crosshair } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { cameras } from "./mockData";

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

// Deterministic spread of cameras within each district
const districtCenters = {
  Muradka: { lat: 28.681, lng: 77.152 },
  Nangloi: { lat: 28.618, lng: 77.05 },
  "Nihal Vihar": { lat: 28.632, lng: 77.063 },
  "Sultan Puri": { lat: 28.67, lng: 77.123 },
  "Paschim Vihar East": { lat: 28.652, lng: 77.103 },
  "Paschim Vihar West": { lat: 28.65, lng: 77.09 },
  "Rani Bagh": { lat: 28.682, lng: 77.131 },
  Mangolpuri: { lat: 28.691, lng: 77.11 },
  Ranhola: { lat: 28.64, lng: 77.078 },
  Mundka: { lat: 28.68, lng: 77.07 },
  "Raj Park": { lat: 28.638, lng: 77.141 },
};

// Seeded pseudo-random for consistent placement per camera
function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// Build individual camera markers from the central cameras array
const cameraSites = cameras.map((cam, idx) => {
  const center = districtCenters[cam.district] || { lat: 28.65, lng: 77.1 };
  const r1 = seededRandom(idx + 1);
  const r2 = seededRandom(idx + 1000);
  return {
    id: cam.id,
    name: cam.name,
    ip: cam.ip,
    type: cam.type,
    district: cam.district,
    location: cam.location,
    status: cam.status === "Online" ? "online" : "offline",
    lat: center.lat + (r1 - 0.5) * 0.025,
    lng: center.lng + (r2 - 0.5) * 0.025,
  };
});

const statusColors = {
  online: "#22C55E",
  offline: "#EF4444",
};

function LiveMapOverview({ selectedDistrict, onDistrictClick }) {
  const mapRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [popupInfo, setPopupInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const locationFetchedRef = useRef(false);
  const prevSelectedRef = useRef(null);

  const departmentConfig = useMemo(() => {
    const saved = localStorage.getItem("vms_departments");
    const departments = saved ? JSON.parse(saved) : [];
    return departments.length > 0
      ? {
          departmentName: departments[0].name,
          groupName: departments[0].groupName,
        }
      : null;
  }, []);

  const groupLabel = departmentConfig?.groupName || "Group";

  const groups = useMemo(
    () => [...new Set(cameras.map((c) => c.district))],
    [],
  );

  const filteredSites = useMemo(() => {
    return cameraSites.filter((site) => {
      const matchesDistrict =
        !selectedDistrict || site.district === selectedDistrict;
      const matchesSearch =
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.ip.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" ||
        site.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesGroup =
        groupFilter === "All" || site.district === groupFilter;
      return matchesDistrict && matchesSearch && matchesStatus && matchesGroup;
    });
  }, [searchQuery, statusFilter, groupFilter, selectedDistrict]);

  const statusCounts = {
    online: filteredSites.filter((s) => s.status === "online").length,
    offline: filteredSites.filter((s) => s.status === "offline").length,
  };

  // Fly to selected district — fit all its cameras
  useEffect(() => {
    if (!mapRef.current || !selectedDistrict) return;
    if (prevSelectedRef.current === selectedDistrict) return;
    prevSelectedRef.current = selectedDistrict;

    const districtSites = cameraSites.filter(
      (s) => s.district === selectedDistrict,
    );
    if (districtSites.length === 0) return;

    const lngs = districtSites.map((s) => s.lng);
    const lats = districtSites.map((s) => s.lat);
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    setTimeout(() => {
      mapRef.current?.fitBounds(bounds, {
        padding: 80,
        maxZoom: 14,
        duration: 1000,
      });
    }, 200);
  }, [selectedDistrict]);

  useEffect(() => {
    if (!selectedDistrict) {
      prevSelectedRef.current = null;
    }
  }, [selectedDistrict]);

  // Fit the map to all visible sites
  useEffect(() => {
    if (!mapRef.current || filteredSites.length === 0) return;
    const lngs = filteredSites.map((s) => s.lng);
    const lats = filteredSites.map((s) => s.lat);
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    const t = setTimeout(() => {
      mapRef.current?.fitBounds(bounds, {
        padding: 60,
        maxZoom: 13,
        duration: 800,
      });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };
        setUserLocation(loc);
        setLocationError(null);
        if (!locationFetchedRef.current && mapRef.current) {
          locationFetchedRef.current = true;
          setTimeout(() => {
            mapRef.current?.flyTo({
              center: [loc.lng, loc.lat],
              zoom: 14,
              duration: 1500,
            });
          }, 500);
        }
      },
      (err) => {
        if (err.code === 1) {
          setLocationError(
            "Location access denied. Please allow location in browser settings.",
          );
        } else if (err.code === 2) {
          setLocationError("Location unavailable. Retrying...");
          setTimeout(requestLocation, 2000);
        } else {
          setLocationError(
            "Location request timed out. Click the crosshair to retry.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const flyToUserLocation = () => {
    if (!userLocation || !mapRef.current) {
      requestLocation();
      return;
    }
    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 1200,
    });
  };

  const handleZoom = (delta) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + delta, duration: 300 });
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg hover:shadow-[var(--primary-color)]/5 transition-all duration-300 p-3 sm:p-4 h-full flex flex-col cursor-pointer hover:border-[var(--primary-color)]/40 glass-lift card-glow-hover">
      {/* Title */}
      <div className="relative mb-3 shrink-0 flex items-center justify-between">
        <h4 className="text-[13px] uppercase sm:text-[13px] font-semibold text-[var(--text-dark)]">
          Map Overview
        </h4>
        <div className="flex items-center gap-3">
          {statusFilter !== "Offline" && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[12px] font-medium text-[var(--text-dark)]">
                Online
              </span>
              <span className="text-[12px] font-bold text-[var(--success)]">
                {statusCounts.online}
              </span>
            </div>
          )}
          {statusFilter !== "Online" && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[12px] font-medium text-[var(--text-dark)]">
                Offline
              </span>
              <span className="text-[12px] font-bold text-[var(--danger)]">
                {statusCounts.offline}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Row - single row */}
      <div className="flex items-center gap-2 mb-2 sm:mb-3 shrink-0">
        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Search Camera / NVR name or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-0 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] cursor-pointer outline-none shrink-0"
        >
          <option value="All">Status</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </select>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="text-xs px-0 sm:px-0 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-dark)] cursor-pointer outline-none shrink-0"
        >
          <option value="All">All {groupLabel}</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        <style>{`
          @keyframes radar-pulse {
            0%   { transform: scale(0.35); opacity: 0.6; }
            70%  { opacity: 0.15; }
            100% { transform: scale(1); opacity: 0; }
          }
          @keyframes blue-pulse {
            0%   { transform: scale(0.5); opacity: 0.8; }
            70%  { opacity: 0.2; }
            100% { transform: scale(2.2); opacity: 0; }
          }
        `}</style>
        <MapGL
          ref={mapRef}
          reuseMaps
          mapStyle={OSM_STYLE}
          initialViewState={{ longitude: 77.21, latitude: 28.6, zoom: 9 }}
          className="map-full"
          attributionControl={{ compact: true }}
        >
          {filteredSites.map((site) => {
            const color = statusColors[site.status];
            return (
              <Marker
                key={site.id}
                longitude={site.lng}
                latitude={site.lat}
                anchor="center"
              >
                <div
                  className="relative flex items-center justify-center cursor-pointer group"
                  style={{ width: 26, height: 26 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupInfo(site);
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: color,
                      animation: "radar-pulse 1.8s ease-out infinite",
                    }}
                  />
                  <span
                    className="absolute inset-0 rounded-full border-2 transition-transform group-hover:scale-110"
                    style={{ borderColor: color }}
                  />
                  <span
                    className="rounded-full border border-black/60"
                    style={{ width: 10, height: 10, backgroundColor: color }}
                  />
                </div>
              </Marker>
            );
          })}

          {popupInfo && (
            <Popup
              anchor="bottom"
              longitude={popupInfo.lng}
              latitude={popupInfo.lat}
              offset={18}
              closeButton={false}
              onClose={() => setPopupInfo(null)}
            >
              <div className="px-1 py-0.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColors[popupInfo.status] }}
                  />
                  <span className="text-xs font-bold text-[var(--text-dark)]">
                    {popupInfo.name}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {popupInfo.district} · {popupInfo.type} · {popupInfo.ip}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {popupInfo.location} · {popupInfo.status}
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${popupInfo.lat},${popupInfo.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-[var(--primary-color)] hover:underline"
                >
                  <Navigation size={11} />
                  Get Directions
                </a>
              </div>
            </Popup>
          )}

          {gpsActive && userLocation && (
            <Marker
              longitude={userLocation.lng}
              latitude={userLocation.lat}
              anchor="center"
            >
              <div
                className="relative flex items-center justify-center"
                style={{ width: 28, height: 28 }}
              >
                <span
                  className="absolute rounded-full bg-blue-500/30"
                  style={{
                    width: 28,
                    height: 28,
                    animation: "blue-pulse 2s ease-out infinite",
                  }}
                />
                <span
                  className="rounded-full bg-blue-500 border-2 border-white shadow-md"
                  style={{ width: 16, height: 16 }}
                />
              </div>
            </Marker>
          )}
        </MapGL>

        {locationError && (
          <div className="absolute top-3 left-3 bg-[var(--card-bg)] border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[10px] font-medium px-3 py-1.5 rounded-lg shadow-sm z-10 flex items-center gap-1.5 max-w-[220px]">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {locationError}
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => {
              if (gpsActive) {
                setGpsActive(false);
                setUserLocation(null);
                setLocationError(null);
                locationFetchedRef.current = false;
              } else {
                setGpsActive(true);
                requestLocation();
              }
            }}
            className={`w-9 h-9 sm:w-8 sm:h-8 bg-[var(--card-bg)] border rounded-lg flex items-center justify-center shadow-sm transition-colors ${
              gpsActive
                ? "border-blue-400 bg-blue-50 hover:bg-blue-100"
                : "border-[var(--border-color)] hover:bg-[var(--hover-bg)]"
            }`}
            title={gpsActive ? "Deactivate GPS" : "Activate GPS"}
          >
            <Crosshair
              size={15}
              className={
                gpsActive ? "text-blue-500" : "text-[var(--text-muted)]"
              }
            />
          </button>
          <button
            onClick={() => handleZoom(1)}
            className="w-9 h-9 sm:w-8 sm:h-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg flex items-center justify-center shadow-sm hover:bg-[var(--hover-bg)] transition-colors"
          >
            <ZoomIn size={15} className="text-[var(--text-dark)]" />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            className="w-9 h-9 sm:w-8 sm:h-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg flex items-center justify-center shadow-sm hover:bg-[var(--hover-bg)] transition-colors"
          >
            <ZoomOut size={15} className="text-[var(--text-dark)]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveMapOverview;
