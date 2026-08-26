import WebRTCPlayer from "./WebRTCPlayer";
import { usePlayback } from "../../context/PlaybackContext";
import { useMemo } from "react";
import { FaVideo } from "react-icons/fa";

function PlaybackGrid() {
  const {
    selectedCameras, setFullscreenCamera, registerVideoRef, unregisterVideoRef,
    videoZoom, streamUrl, playbackLoading, isPlaying, muted,
  } = usePlayback();

  const cameras = useMemo(() => {
    if (selectedCameras.length > 0 && streamUrl) {
      return [{
        id: `cam-${selectedCameras[0]}`,
        name: selectedCameras[0],
        url: streamUrl,
      }];
    }
    return [];
  }, [selectedCameras, streamUrl]);

  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <FaVideo size={28} className="text-gray-300 dark:text-gray-600" />
        </div>
        {playbackLoading ? (
          <>
            <p className="text-sm font-medium">Connecting…</p>
            <p className="text-xs mt-1">Registering the recording stream</p>
          </>
        ) : selectedCameras.length > 0 ? (
          <>
            <p className="text-sm font-medium">Ready to play</p>
            <p className="text-xs mt-1">Pick a date and click "Search Recording"</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">No Camera Selected</p>
            <p className="text-xs mt-1">Select a camera from the sidebar to view playback</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 grid-rows-1 gap-0 h-full">
      {cameras.map((cam) => (
        <div
          key={cam.id}
          onDoubleClick={() => setFullscreenCamera(cam)}
          className="relative bg-black overflow-hidden cursor-pointer"
        >
          <div className="absolute top-2 left-2 text-xs bg-black/60 px-2 py-1 rounded text-white z-10">
            {cam.name}
          </div>

          <WebRTCPlayer
            url={cam.url}
            zoom={videoZoom}
            paused={!isPlaying}
            muted={muted}
            cameraId={cam.id}
            registerVideoRef={registerVideoRef}
            unregisterVideoRef={unregisterVideoRef}
          />
        </div>
      ))}
    </div>
  );
}

export default PlaybackGrid;
