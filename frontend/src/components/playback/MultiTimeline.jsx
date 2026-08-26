import { useRef, useState, useCallback, useEffect } from "react";
import { usePlayback } from "../../Context/PlaybackContext";

function MultiTimeline() {
  const {
    recordings,
    currentTime,
    seekTo,
    zoomLevel,
    zoomLevels,
    TOTAL_SECONDS,
    seekPlayback,
    streamUrl,
  } = usePlayback();

  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  // Last scrubbed second - committed to the backend on drag release (avoids a
  // stale closure and avoids re-registering the NVR stream on every mouse-move).
  const lastSeekSecRef = useRef(null);

  const currentZoom = zoomLevels[zoomLevel];
  const visibleSeconds = currentZoom.hours * 3600;
  const viewStart = Math.max(0, currentTime - visibleSeconds / 2);
  const viewEnd = Math.min(TOTAL_SECONDS, viewStart + visibleSeconds);
  const adjustedStart = Math.max(0, viewEnd - visibleSeconds);

  const getTimeLabels = useCallback(() => {
    const labels = [];
    const step = visibleSeconds / 12;
    for (let i = 0; i <= 12; i++) {
      const timeSec = adjustedStart + i * step;
      const h = Math.floor(timeSec / 3600);
      const m = Math.floor((timeSec % 3600) / 60);
      labels.push({
        time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        percent: (i / 12) * 100,
      });
    }
    return labels;
  }, [adjustedStart, visibleSeconds]);

  const timeLabels = getTimeLabels();

  // Progress percentage of currentTime within the visible window
  const progressPercent = Math.max(
    0,
    Math.min(100, ((currentTime - adjustedStart) / visibleSeconds) * 100),
  );

  const handleTimelineClick = useCallback(
    (e) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const newTime = adjustedStart + percent * visibleSeconds;
      const clamped = Math.max(0, Math.min(TOTAL_SECONDS, newTime));
      lastSeekSecRef.current = clamped;
      seekTo(clamped);
    },
    [adjustedStart, visibleSeconds, seekTo, TOTAL_SECONDS],
  );

  const handleMouseDown = useCallback(
    (e) => {
      setIsDragging(true);
      handleTimelineClick(e);
    },
    [handleTimelineClick],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleTimelineClick(e);
    },
    [isDragging, handleTimelineClick],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Commit the scrubbed position to the backend (re-register the recording
    // stream from that time). Only when a real stream is active.
    if (streamUrl && lastSeekSecRef.current != null) {
      seekPlayback(lastSeekSecRef.current);
      lastSeekSecRef.current = null;
    }
  }, [streamUrl, seekPlayback]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="bg-[var(--card-bg)] border-t border-[var(--border-color)] px-4 pt-2 pb-3 select-none">
      {/* TIME SCALE */}
      <div className="flex mb-1.5">
        <div className="relative flex-1 h-4">
          {timeLabels.map((label, i) => {
            const isFirst = i === 0;
            const isLast = i === timeLabels.length - 1;

            let labelClass =
              "absolute top-0 text-[13px] text-[var(--text-dark)]  tabular-nums";
            if (isFirst) {
              labelClass += " left-0 -translate-x-0";
            } else if (isLast) {
              labelClass += " right-0 translate-x-0";
            } else {
              labelClass += " -translate-x-1/2";
            }

            return (
              <div key={i}>
                <span
                  className={labelClass}
                  style={
                    !isFirst && !isLast
                      ? { left: `${label.percent}%` }
                      : undefined
                  }
                >
                  {label.time}
                </span>
                <div
                  className="absolute top-3.5 bottom-0 w-px bg-[var(--border-color)]"
                  style={{ left: `${label.percent}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* SINGLE TIMELINE */}
      <div className="px-3">
        <div
          ref={timelineRef}
          className="relative h-7 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-visible cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          {/* Unplayed */}
          <div className="absolute inset-0 bg-emerald-200/80 dark:bg-emerald-900/40 rounded-lg" />

          {/* Played */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-emerald-500 dark:bg-emerald-400 rounded-l-lg"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-white z-20"
            style={{ left: `${progressPercent}%` }}
          >
            {/* Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiTimeline;
