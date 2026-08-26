import { useEffect, useMemo } from "react";
import { FaVolumeUp, FaVolumeMute, FaTimes } from "react-icons/fa";
import VideoPlayer from "./VideoPlayer";

const getFakeDetections = () => [
  { id: 1, label: "Person", x: 10, y: 15, w: 35, h: 45 },
  { id: 2, label: "Vehicle", x: 55, y: 30, w: 30, h: 40 },
];

function ZoomModal({ cam, streamUrl, onClose, muted, onToggleAudio, showAI }) {
  const detections = useMemo(() => {
    return showAI && cam ? getFakeDetections() : [];
  }, [showAI, cam]);

  useEffect(() => {
    if (!cam) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, cam]);

  if (!cam) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full sm:w-[95vw] sm:h-[95vh] bg-black sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-auto">
            <h2 className="text-white font-semibold text-sm sm:text-base tracking-wide">
              {cam}
            </h2>
            <span className="text-red-500 text-[10px] sm:text-xs font-bold animate-pulse flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,1)]"></span>
              LIVE
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-3 sm:p-2.5 rounded-full bg-black/60 backdrop-blur-md hover:bg-red-600 text-white transition-colors pointer-events-auto border border-white/10"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="flex-1 relative w-full h-full bg-[#0a0a0a]">
          {streamUrl ? (
            <VideoPlayer
              url={streamUrl}
              muted={muted}
              objectFit="object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm tracking-widest uppercase">
              No Stream URL
            </div>
          )}

          {detections.map((d) => (
            <div
              key={d.id}
              className="absolute z-10 border-[1.5px] border-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.4)] pointer-events-none"
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: `${d.w}%`,
                height: `${d.h}%`,
              }}
            >
              <span className="absolute -top-[22px] left-[-1.5px] bg-black/70 border-[1.5px] border-b-0 border-lime-400 px-1.5 py-[1px] rounded-t text-lime-300 font-semibold tracking-wider text-[10px] sm:text-xs backdrop-blur-sm">
                {d.label}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none flex items-end">
          <button
            onClick={() => onToggleAudio(cam)}
            className="p-3 sm:p-3 rounded-xl bg-black/60 backdrop-blur-md hover:bg-blue-600 text-white transition-colors pointer-events-auto border border-white/10"
          >
            {muted ? <FaVolumeMute size={22} /> : <FaVolumeUp size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ZoomModal;
