import { useState, useCallback, useRef, useEffect } from "react";
import CameraSidebar from "../components/livestream/CameraSidebar";
import StreamingHeader from "../components/livestream/StreamingHeader";
import CameraTile from "../components/livestream/CameraTile";
import EventPanel from "../components/livestream/EventPanel";
import { useLiveStreaming } from "../Context/LiveStreamingContext";
import { useGridFullscreen } from "../Context/GridFullscreenContext";

export default function LiveStreaming() {
  const {
    cameraStreams,
    displayedCams,
    mutedMap,
    grid,
    gridCols,
    gridRows,
    setGridCols,
    setGridRows,
    toggleCamera,
    toggleGroup,
    openGroups,
    toggleAudio,
    placeCameraAtIndex,
    cameraGroups,
    cameraMeta,
    selectedTiles,
    toggleTileSelect,
    lockedTiles,
    toggleLockTile,
    tileStatuses,
    showEventPanel,
  } = useLiveStreaming();

  const { isGridFullscreen, toggleGridFullscreen, exitGridFullscreen } = useGridFullscreen();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const desktopGridRef = useRef({ cols: gridCols, rows: gridRows });
  const [mobileGrid, setMobileGrid] = useState(2);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        if (mobile) {
          // Switching to mobile: save desktop grid, apply mobile grid choice
          desktopGridRef.current = { cols: gridCols, rows: gridRows };
          setGridCols(mobileGrid);
          setGridRows(mobileGrid);
        } else {
          // Switching to desktop: restore original grid
          setGridCols(desktopGridRef.current.cols);
          setGridRows(desktopGridRef.current.rows);
        }
        setIsMobile(mobile);
        if (mobile) setShowSidebar(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, gridCols, gridRows, setGridCols, setGridRows, mobileGrid]);

  // Mobile grid change handler
  const handleMobileGridChange = useCallback((size) => {
    setMobileGrid(size);
    setGridCols(size);
    setGridRows(size);
  }, [setGridCols, setGridRows]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && isGridFullscreen) {
        exitGridFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [isGridFullscreen, exitGridFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if in input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      // Mute all: M key
      if (e.key === "m" || e.key === "M") {
        displayedCams.forEach((cam) => {
          if (!mutedMap[cam]) toggleAudio(cam);
        });
      }
      // Unmute all: Shift+M
      if (e.key === "M" && e.shiftKey) {
        displayedCams.forEach((cam) => {
          if (mutedMap[cam]) toggleAudio(cam);
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayedCams, mutedMap, toggleAudio]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [activePTZCamera, setActivePTZCamera] = useState(null);

  const gridContainerRef = useRef(null);

  const handlePTZ = useCallback((cam) => {
    setActivePTZCamera((prev) => (prev === cam ? null : cam));
  }, []);

  const handleToggleGridFullScreen = useCallback(() => {
    if (!isGridFullscreen) {
      toggleGridFullscreen();
      if (gridContainerRef.current) {
        try {
          if (gridContainerRef.current.requestFullscreen) gridContainerRef.current.requestFullscreen();
          else if (gridContainerRef.current.webkitRequestFullscreen) gridContainerRef.current.webkitRequestFullscreen();
        } catch {}
      }
    } else {
      toggleGridFullscreen();
      try {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch {}
    }
  }, [isGridFullscreen, toggleGridFullscreen]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleCellDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  }, []);

  const handleCellDragLeave = useCallback(() => {
    setDragOverIdx(null);
  }, []);

  const handleCellDrop = useCallback(
    (e, idx) => {
      e.preventDefault();
      setDragOverIdx(null);
      const raw = e.dataTransfer.getData("text/plain");
      if (raw.startsWith("camera:")) {
        placeCameraAtIndex(raw.replace("camera:", ""), idx);
      }
    },
    [placeCameraAtIndex],
  );

  // Event click handler - focus camera
  const handleEventCameraClick = useCallback((camName) => {
    // Find or add camera to displayed list
    const idx = displayedCams.indexOf(camName);
    if (idx === -1) {
      // Camera not in grid, could navigate or add
    }
  }, [displayedCams]);

  return (
    <div className="h-full w-full flex bg-[var(--bg-color)] text-[var(--text-dark)] overflow-hidden relative">
      {/* Sidebar - hidden in grid fullscreen */}
      {!isGridFullscreen && (
        <CameraSidebar
          isMobile={isMobile}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          cameraGroups={cameraGroups}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
          toggleCamera={toggleCamera}
          selectedCams={displayedCams}
          activePTZCamera={activePTZCamera}
          onClosePTZ={() => setActivePTZCamera(null)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - hidden in grid fullscreen */}
        {!isGridFullscreen && (
          <StreamingHeader
            isMobile={isMobile}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            onToggleFullScreen={handleToggleGridFullScreen}
            isGridFullscreen={isGridFullscreen}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onMobileGridChange={handleMobileGridChange}
            mobileGrid={mobileGrid}
          />
        )}

        {/* Grid Fullscreen Exit Button */}
        {isGridFullscreen && (
          <button
            onClick={() => {
              try {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
              } catch {}
            }}
            className="fixed top-4 right-4 z-50 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors focus:outline-none"
            title="Exit Fullscreen (ESC)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Main Grid + Event Panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div
            ref={gridContainerRef}
            className={`flex-1 bg-[var(--bg-color)] relative ${isMobile ? "overflow-hidden" : ""}`}
          >
            {isMobile ? (
              /* Mobile: 1x1 or 2x2 grid */
              <div className="h-full w-full">
                <div
                  className="h-full w-full grid"
                  style={{
                    gridTemplateColumns: `repeat(${mobileGrid}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${mobileGrid}, minmax(0, 1fr))`,
                  }}
                >
                  {[...Array(mobileGrid * mobileGrid)].map((_, i) => {
                    const cam = displayedCams[i];
                    const isOver = dragOverIdx === i;
                    return (
                      <div
                        key={`grid-cell-${i}`}
                        data-grid-index={i}
                        className={`relative min-h-0 min-w-0 transition-all duration-200
                          ${isOver ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-[var(--bg-color)]" : ""}
                          ${!cam && isOver ? "bg-blue-950/30" : ""}
                        `}
                        onDragOver={(e) => handleCellDragOver(e, i)}
                        onDragLeave={handleCellDragLeave}
                        onDrop={(e) => handleCellDrop(e, i)}
                      >
                        <CameraTile
                          key={`${cam || `empty-${i}`}-${refreshKey}`}
                          cam={cam}
                          streamUrl={cam ? cameraStreams[cam] : null}
                          muted={cam ? !!mutedMap[cam] : true}
                          onToggleAudio={toggleAudio}
                          onPTZ={handlePTZ}
                          isGridFullscreen={isGridFullscreen}
                          gridIndex={i}
                          isSelected={selectedTiles.has(i)}
                          isLocked={!!lockedTiles[i]}
                          tileStatus={cam ? tileStatuses[cam] : null}
                          cameraMeta={cameraMeta}
                          onSelect={toggleTileSelect}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Desktop: Full grid */
              <div
                className="grid h-full w-full"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
                }}
              >
                {[...Array(gridCols * gridRows)].map((_, i) => {
                  const cam = displayedCams[i];
                  const isOver = dragOverIdx === i;
                  return (
                    <div
                      key={`grid-cell-${i}`}
                      data-grid-index={i}
                      className={`relative min-h-0 min-w-0 transition-all duration-200
                        ${isOver ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-[var(--bg-color)]" : ""}
                        ${!cam && isOver ? "bg-blue-950/30" : ""}
                      `}
                      onDragOver={(e) => handleCellDragOver(e, i)}
                      onDragLeave={handleCellDragLeave}
                      onDrop={(e) => handleCellDrop(e, i)}
                    >
                      <CameraTile
                        key={`${cam || `empty-${i}`}-${refreshKey}`}
                        cam={cam}
                        streamUrl={cam ? cameraStreams[cam] : null}
                        muted={cam ? !!mutedMap[cam] : true}
                        onToggleAudio={toggleAudio}
                        onPTZ={handlePTZ}
                        isGridFullscreen={isGridFullscreen}
                        gridIndex={i}
                        isSelected={selectedTiles.has(i)}
                        isLocked={!!lockedTiles[i]}
                        tileStatus={cam ? tileStatuses[cam] : null}
                        cameraMeta={cameraMeta}
                        onSelect={toggleTileSelect}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Event Panel */}
          <EventPanel onClickCamera={handleEventCameraClick} />
        </div>
      </div>

    </div>
  );
}
