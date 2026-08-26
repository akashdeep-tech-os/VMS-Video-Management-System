import { useRef, useEffect } from "react";
import MapGL, { Marker, Popup } from "react-map-gl/maplibre";
import { X, Navigation, MapPin } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

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

function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getCameraPosition(camera, index = 0) {
  const center = districtCenters[camera.district] || { lat: 28.65, lng: 77.1 };
  const r1 = seededRandom(index + 1);
  const r2 = seededRandom(index + 1000);
  return {
    lat: center.lat + (r1 - 0.5) * 0.025,
    lng: center.lng + (r2 - 0.5) * 0.025,
  };
}

function MapModal({ isOpen, onClose, camera, index = 0 }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (isOpen && mapRef.current && camera) {
      const pos = getCameraPosition(camera, index);
      setTimeout(() => {
        mapRef.current?.flyTo({
          center: [pos.lng, pos.lat],
          zoom: 15,
          duration: 1000,
        });
      }, 300);
    }
  }, [isOpen, camera, index]);

  if (!isOpen || !camera) return null;

  const pos = getCameraPosition(camera, index);
  const isOnline = camera.status === "Online";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] w-[90vw] max-w-[800px] h-[70vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="">
              <MapPin className="text-[var(--primary-color)]" size={22} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[var(--text-dark)]">
                {camera.name}
              </h3>
              <p className="text-[14px] text-[var(--text-muted)]">
                {camera.district} · {camera.location} · {camera.ip}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[14px] font-semibold border ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-400"}`}
              />
              {camera.status}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          <MapGL
            ref={mapRef}
            reuseMaps
            mapStyle={OSM_STYLE}
            initialViewState={{
              longitude: pos.lng,
              latitude: pos.lat,
              zoom: 15,
            }}
            className="map-full"
            attributionControl={{ compact: true }}
          >
            <Marker longitude={pos.lng} latitude={pos.lat} anchor="center">
              <div className="relative flex items-center justify-center cursor-pointer">
                <span
                  className={`absolute w-8 h-8 rounded-full animate-ping ${isOnline ? "glow-online" : "glow-danger"}`}
                />
                <span
                  className={`relative w-4 h-4 rounded-full border-2 border-white shadow-lg ${isOnline ? "glow-online-dot" : "glow-danger-dot"}`}
                />
              </div>
            </Marker>

            <Popup
              anchor="bottom"
              longitude={pos.lng}
              latitude={pos.lat}
              offset={20}
              closeButton={false}
            >
              <div className="px-2 py-1">
                <div className="text-[14px] font-bold text-[var(--text-dark)]">
                  {camera.name}
                </div>
                <div className="text-[14px] text-[var(--text-muted)]">
                  {camera.type} · {camera.district}
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${pos.lat},${pos.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-[14px] font-semibold text-[var(--primary-color)] hover:underline"
                >
                  <Navigation size={14} />
                  Get Directions
                </a>
              </div>
            </Popup>
          </MapGL>
        </div>
      </div>
    </div>
  );
}

export default MapModal;
