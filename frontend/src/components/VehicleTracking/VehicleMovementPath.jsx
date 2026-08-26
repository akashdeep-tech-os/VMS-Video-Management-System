import { useState, useRef, useEffect, useMemo } from "react";
import MapGL, { Marker, NavigationControl, Popup, Source, Layer } from "react-map-gl/maplibre";
import { MdClose } from "react-icons/md";
import { FaClock, FaRoad, FaStopwatch, FaTachometerAlt, FaLocationArrow } from "react-icons/fa";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = {
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

const movementData = {
  vehicleNumber: "DL01AB1234",
  route: [
    { id: 1, time: "06:10:15 AM", label: "Gate 1 - Entry", sub: "Sector 10 PS", lat: 28.52, lng: 77.15, type: "start" },
    { id: 2, time: "06:20:42 AM", label: "Road 1", sub: "Sector 10 PS", lat: 28.525, lng: 77.158, type: "waypoint" },
    { id: 3, time: "06:28:11 AM", label: "Parking Area", sub: "Sector 9 PS", lat: 28.53, lng: 77.165, type: "waypoint" },
    { id: 4, time: "06:31:25 PM", label: "Gate 1 - Entry", sub: "Sector 9 PS", lat: 28.535, lng: 77.17, type: "end" },
  ],
  stats: {
    totalStops: 4,
    totalDistance: "18.7 km",
    totalTime: "21m 10s",
    avgSpeed: "52 km/h",
    maxSpeed: "87 km/h",
  },
};

function VehicleMovementPath({ vehicleNumber, onClose }) {
  const mapRef = useRef();
  const [selectedPoint, setSelectedPoint] = useState(null);
  const data = movementData;

  useEffect(() => {
    if (mapRef.current && data.route.length > 0) {
      const lats = data.route.map((p) => p.lat);
      const lngs = data.route.map((p) => p.lng);
      const bounds = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      setTimeout(() => {
        mapRef.current?.fitBounds(bounds, { padding: 60, duration: 1500 });
      }, 500);
    }
  }, [vehicleNumber]);

  const routeGeoJSON = useMemo(() => {
    if (!data.route.length) return null;
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: data.route.map((p) => [p.lng, p.lat]),
      },
    };
  }, [data.route]);

  const statItems = [
    { icon: <FaStopwatch className="text-blue-500" size={14} />, label: "Total Stops", value: data.stats.totalStops },
    { icon: <FaRoad className="text-purple-500" size={14} />, label: "Total Distance", value: data.stats.totalDistance },
    { icon: <FaClock className="text-orange-500" size={14} />, label: "Total Time", value: data.stats.totalTime },
    { icon: <FaTachometerAlt className="text-emerald-500" size={14} />, label: "Avg. Speed", value: data.stats.avgSpeed },
    { icon: <FaTachometerAlt className="text-red-500" size={14} />, label: "Max. Speed", value: data.stats.maxSpeed },
  ];

  return (
    <div className="h-full flex flex-col bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 md:px-4 py-2 md:py-2.5 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs md:text-sm font-bold text-[var(--text-dark)]">Vehicle Movement Path</h3>
          {vehicleNumber && (
            <span className="text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">
              {vehicleNumber}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
        >
          <MdClose size={16} />
        </button>
      </div>

      {/* Map - takes all remaining space */}
      <div className="flex-1 min-h-0 relative">
        <MapGL
          ref={mapRef}
          reuseMaps
          mapStyle={MAP_STYLE}
          initialViewState={{ longitude: 77.16, latitude: 28.527, zoom: 13 }}
          className="absolute-fill"
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          {routeGeoJSON && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  "line-color": "#7c3aed",
                  "line-width": 3,
                  "line-dasharray": [2, 1],
                }}
              />
            </Source>
          )}

          {data.route.map((point) => (
            <Marker
              key={point.id}
              longitude={point.lng}
              latitude={point.lat}
              anchor="bottom"
            >
              <div
                onClick={() => setSelectedPoint(selectedPoint?.id === point.id ? null : point)}
                className="cursor-pointer flex flex-col items-center group"
              >
                <div className="relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg border-2 border-white ${
                      point.type === "start"
                        ? "bg-green-500"
                        : point.type === "end"
                          ? "bg-red-500"
                          : "bg-orange-500"
                    }`}
                  >
                    {point.id}
                  </div>
                  {point.type === "end" && (
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                  )}
                </div>
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-[var(--border-color)] px-2.5 py-1.5 min-w-[140px] opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <p className="text-[10px] font-bold text-[var(--text-dark)] whitespace-nowrap">{point.time}</p>
                  <p className="text-[9px] text-[var(--primary-color)] font-semibold whitespace-nowrap">{point.label}</p>
                  <p className="text-[9px] text-[var(--text-muted)] whitespace-nowrap">{point.sub}</p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 mt-1 text-[9px] font-semibold text-[var(--primary-color)] hover:underline"
                  >
                    <FaLocationArrow size={8} />
                    Get Directions
                  </a>
                </div>
              </div>
            </Marker>
          ))}

          {selectedPoint && (
            <Popup
              anchor="bottom"
              longitude={selectedPoint.lng}
              latitude={selectedPoint.lat}
              onClose={() => setSelectedPoint(null)}
              closeButton={false}
              offset={30}
              className="z-50"
            >
              <div className="min-w-[160px]">
                <p className="text-[10px] font-bold text-[var(--text-dark)]">{selectedPoint.time}</p>
                <p className="text-[11px] font-semibold text-[var(--primary-color)]">{selectedPoint.label}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{selectedPoint.sub}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-[var(--primary-color)] hover:underline"
                >
                  <FaLocationArrow size={9} />
                  Get Directions
                </a>
              </div>
            </Popup>
          )}
        </MapGL>
      </div>

      {/* Stats Bar */}
      <div className="px-2 md:px-3 py-2 border-t border-[var(--border-color)] grid grid-cols-3 md:grid-cols-5 gap-1 md:gap-2 flex-shrink-0 bg-[var(--card-bg)]">
        {statItems.map((stat, i) => (
          <div key={i} className="flex items-center gap-1 md:gap-1.5">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-[var(--hover-bg)] flex items-center justify-center flex-shrink-0">
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[7px] md:text-[8px] text-[var(--text-muted)] uppercase tracking-wider truncate">{stat.label}</p>
              <p className="text-[9px] md:text-[11px] font-bold text-[var(--text-dark)] truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VehicleMovementPath;
