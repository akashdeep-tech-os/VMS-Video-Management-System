/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { loadAccessibleCameras, RIGHT_PLAYBACK } from "../api/accessibleCameras";
import playbackService from "../api/playbackService";

const PlaybackContext = createContext(null);

const TOTAL_SECONDS = 86400; // 24 hours

// "hh:mm" (12-hour, as the sidebar stores it) + "AM"/"PM" -> "HH:mm:ss".
// Empty/blank input -> fallback (default "00:00:00").
function to24h(hhmm, period, fallback = "00:00:00") {
  if (!hhmm || !hhmm.includes(":")) return fallback;
  let [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

// second-of-day (0..86399) -> "HH:mm:ss".
function secondsToHms(sec) {
  const s = Math.max(0, Math.min(TOTAL_SECONDS - 1, Math.floor(sec)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// "HH:mm:ss" -> second-of-day.
function hmsToSeconds(hms) {
  const [h, m, s] = (hms || "00:00:00").split(":").map((n) => parseInt(n, 10) || 0);
  return h * 3600 + m * 60 + s;
}

// Date object -> "yyyy-MM-dd" (local, not UTC - matches the calendar the user picked).
function toYmd(date) {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

const ZOOM_LEVELS = [
  { label: "24 Hours", hours: 24 },
  { label: "12 Hours", hours: 12 },
  { label: "6 Hours", hours: 6 },
  { label: "1 Hour", hours: 1 },
  { label: "30 Minutes", hours: 0.5 },
  { label: "10 Minutes", hours: 10 / 60 },
];

const PLAYBACK_SPEEDS = [1, 2, 4, 8, 16];
const REWIND_SPEEDS = [-1, -2, -4, -8];

export function PlaybackProvider({ children }) {
  // Camera tree the user may play back (PLAYBACK_VIEW right), loaded from the
  // backend per user-site-right mapping. Empty until the fetch resolves.
  // Flat list of camera names (replaces the old cameraGroups tree)
  const [cameraList, setCameraList] = useState([]);
  const [cameraMeta, setCameraMeta] = useState({});

  // Camera selection
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [searchDate, setSearchDate] = useState(null);
  const [searchStartTime, setSearchStartTime] = useState("");
  const [searchEndTime, setSearchEndTime] = useState("");
  const [searchStartPeriod, setSearchStartPeriod] = useState("AM");
  const [searchEndPeriod, setSearchEndPeriod] = useState("PM");
  const [hasSearched, setHasSearched] = useState(false);
  // Recording segments overlay - no backend segment API yet, so this stays
  // empty (the timeline renders a plain 24h scrubber).
  const [recordings] = useState([]);

  // Live backend playback stream (from the playback service via MediaMTX).
  const [streamUrl, setStreamUrl] = useState(null);   // HLS url the grid plays
  const [activePath, setActivePath] = useState(null); // MediaMTX path (for seek/stop)
  const [playbackDate, setPlaybackDate] = useState(null); // "yyyy-MM-dd" being played
  const [playbackLoading, setPlaybackLoading] = useState(false);
  // Latest cameraId/path/date read inside effects/callbacks without re-subscribing.
  const activePathRef = useRef(null);
  const playbackCtxRef = useRef({ cameraId: null, date: null });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isRewinding, setIsRewinding] = useState(false);
  const [rewindSpeed, setRewindSpeed] = useState(-1);

  // Audio
  const [muted, setMuted] = useState(true);

  // Grid
  const [grid, setGrid] = useState(1);

  // Timeline zoom
  const [zoomLevel, setZoomLevel] = useState(0); // index into ZOOM_LEVELS

  // Clip
  const [clipStart, setClipStart] = useState(null);
  const [clipEnd, setClipEnd] = useState(null);
  const [showClipModal, setShowClipModal] = useState(false);

  // Download
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Fullscreen
  const [fullscreenCamera, setFullscreenCamera] = useState(null);

  // Video zoom (magnify the video feed)
  const [videoZoom, setVideoZoom] = useState(1);

  // NVR connection flag - hides fast forward/rewind when true
  const [isNvrConnected] = useState(false);

  // Error/status
  const [statusMessage, setStatusMessage] = useState(null);

  // Load the Playback camera tree for the logged-in user: resolve the
  // PLAYBACK_VIEW right's id from the rights catalog, then fetch the
  // accessible-cameras tree scoped by user-site-right mapping. On failure /
  // unauthenticated we leave the tree empty (sidebar shows "no cameras").
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tree = await loadAccessibleCameras(RIGHT_PLAYBACK);
        if (cancelled || !tree) return;
        setCameraList(tree.cameras || []);
        setCameraMeta(tree.meta);
      } catch (err) {
        console.error("Failed to load playback cameras:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Playback timer ref
  const timerRef = useRef(null);

  // Video refs for frame stepping
  const videoRefsMap = useRef({});

  const registerVideoRef = useCallback((cameraId, ref) => {
    videoRefsMap.current[cameraId] = ref;
  }, []);

  const unregisterVideoRef = useCallback((cameraId) => {
    delete videoRefsMap.current[cameraId];
  }, []);

  // Format time helper
  const formatTime = useCallback((sec) => {
    const h = Math.floor(Math.abs(sec) / 3600);
    const m = Math.floor((Math.abs(sec) % 3600) / 60);
    const s = Math.floor(Math.abs(sec) % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  // Transient status/error toast.
  const flash = useCallback((msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  // Start recorded playback for the selected camera + date via the playback
  // service. Resolves the camera's backend id, asks the service to register a
  // MediaMTX path, and plays it as HLS. Called by the sidebar "Search Recording"
  // button (kept the old name `searchRecordings` too, as an alias).
  const startPlayback = useCallback(async (dateOverride) => {
    const dateToUse = dateOverride || searchDate;
    const camName = selectedCameras[0];
    if (!camName) { flash("Please select a camera."); return; }
    if (!dateToUse) { flash("Please select a date."); return; }
    const cameraId = cameraMeta[camName]?.id;
    if (cameraId == null) { flash("Selected camera has no backend id."); return; }

    const ymd = toYmd(dateToUse);
    const time = to24h(searchStartTime, searchStartPeriod, "00:00:00");

    setPlaybackLoading(true);
    try {
      // Switching camera/date: drop the previously-registered path first.
      if (activePathRef.current) {
        await playbackService.stop(activePathRef.current);
      }
      const resp = await playbackService.start({ cameraId, date: ymd, time });
      const path = resp.mediaMtxPath;
      setActivePath(path);
      activePathRef.current = path;
      setStreamUrl(playbackService.webrtcUrlFromPath(path));
      setPlaybackDate(ymd);
      playbackCtxRef.current = { cameraId, date: ymd };
      setCurrentTime(hmsToSeconds(resp.startTime || time));
      setHasSearched(true);
      setGrid(1);
      // The iframe autoplays on mount, so reflect that in the toolbar state.
      setIsPlaying(true);
      flash(`Playing "${camName}" from ${resp.startTime || time}.`);
    } catch (err) {
      console.error("startPlayback failed:", err);
      setStreamUrl(null);
      setActivePath(null);
      activePathRef.current = null;
      flash(err.message || "Failed to start playback.");
    } finally {
      setPlaybackLoading(false);
    }
  }, [selectedCameras, cameraMeta, searchDate, searchStartTime, searchStartPeriod, flash]);

  // Backwards-compatible alias (the sidebar button imports `searchRecordings`).
  const searchRecordings = startPlayback;

  // Seek: re-register the SAME camera/date from a new second-of-day and re-point
  // the player. Called on timeline drag RELEASE (not during drag).
  const seekPlayback = useCallback(async (second) => {
    const { cameraId, date } = playbackCtxRef.current;
    if (cameraId == null || !date) return;
    const time = secondsToHms(second);
    setPlaybackLoading(true);
    try {
      const resp = await playbackService.seek({ cameraId, date, time });
      const path = resp.mediaMtxPath;
      setActivePath(path);
      activePathRef.current = path;
      setStreamUrl(playbackService.webrtcUrlFromPath(path));
      setCurrentTime(hmsToSeconds(resp.startTime || time));
      // A seek re-registers and re-mounts the iframe, which autoplays.
      setIsPlaying(true);
    } catch (err) {
      console.error("seekPlayback failed:", err);
      flash(err.message || "Seek failed.");
    } finally {
      setPlaybackLoading(false);
    }
  }, [flash]);

  // Stop playback: de-register the MediaMTX path (frees the NVR session) and
  // reset the local player.
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setIsRewinding(false);
    setPlaybackSpeed(1);
    Object.values(videoRefsMap.current).forEach((ref) => {
      if (ref?.current) {
        try { ref.current.pause(); ref.current.currentTime = 0; ref.current.playbackRate = 1; } catch { /* ignore */ }
      }
    });
    setCurrentTime(0);
    if (activePathRef.current) {
      playbackService.stop(activePathRef.current);
    }
    setStreamUrl(null);
    setActivePath(null);
    activePathRef.current = null;
  }, []);

  // Download the recorded window [start .. end] as MP4.
  const downloadRecording = useCallback(async () => {
    const camName = selectedCameras[0];
    const cameraId = cameraMeta[camName]?.id;
    const dateToUse = playbackDate || (searchDate ? toYmd(searchDate) : null);
    if (cameraId == null || !dateToUse) { flash("Select a camera and date first."); return; }
    const startTime = to24h(searchStartTime, searchStartPeriod, "00:00:00");
    const endTime = to24h(searchEndTime, searchEndPeriod, "23:59:59");
    flash("Preparing download…");
    try {
      await playbackService.download(cameraId, { date: dateToUse, startTime, endTime });
      flash("Download started.");
    } catch (err) {
      console.error("download failed:", err);
      flash(err.message || "Download failed.");
    }
  }, [selectedCameras, cameraMeta, playbackDate, searchDate, searchStartTime, searchStartPeriod, searchEndTime, searchEndPeriod, flash]);

  // De-register the active MediaMTX path when the Playback page unmounts.
  useEffect(() => {
    return () => {
      if (activePathRef.current) {
        playbackService.stop(activePathRef.current);
        activePathRef.current = null;
      }
    };
  }, []);

  // Playback controls
  // Helper to control all video elements
  const controlAllVideos = useCallback((action) => {
    Object.values(videoRefsMap.current).forEach((ref) => {
      if (ref && ref.current) {
        const video = ref.current;
        try {
          if (action === "play") video.play().catch(() => {});
          else if (action === "pause") video.pause();
          else if (action === "stop") { video.pause(); video.currentTime = 0; }
        } catch (e) { /* ignore */ }
      }
    });
  }, []);

  const setAllPlaybackRate = useCallback((rate) => {
    Object.values(videoRefsMap.current).forEach((ref) => {
      if (ref && ref.current) {
        try { ref.current.playbackRate = Math.abs(rate); } catch (e) { /* ignore */ }
      }
    });
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    setIsRewinding(false);
    setPlaybackSpeed(1);
    controlAllVideos("play");
    setAllPlaybackRate(1);
  }, [controlAllVideos, setAllPlaybackRate]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    setIsRewinding(false);
    controlAllVideos("pause");
  }, [controlAllVideos]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsRewinding(false);
    setPlaybackSpeed(1);
    // Reset all videos to beginning and pause
    Object.values(videoRefsMap.current).forEach((ref) => {
      if (ref?.current) {
        try {
          ref.current.pause();
          ref.current.currentTime = 0;
          ref.current.playbackRate = 1;
        } catch (e) { /* ignore */ }
      }
    });
    setCurrentTime(0);
  }, []);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setIsRewinding(false);
    controlAllVideos("pause");
    setCurrentTime((t) => Math.min(TOTAL_SECONDS, t + 1));
    Object.values(videoRefsMap.current).forEach((ref) => {
      if (ref && ref.current) {
        try { ref.current.currentTime += 1 / 30; } catch (e) { /* ignore */ }
      }
    });
  }, [controlAllVideos]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setIsRewinding(false);
    controlAllVideos("pause");
    setCurrentTime((t) => Math.max(0, t - 1));
    Object.values(videoRefsMap.current).forEach((ref) => {
      if (ref && ref.current) {
        try { ref.current.currentTime -= 1 / 30; } catch (e) { /* ignore */ }
      }
    });
  }, [controlAllVideos]);

  const fastForward = useCallback(() => {
    setIsRewinding(false);
    setPlaybackSpeed((prev) => {
      const idx = PLAYBACK_SPEEDS.indexOf(prev);
      const nextSpeed = idx < PLAYBACK_SPEEDS.length - 1 ? PLAYBACK_SPEEDS[idx + 1] : PLAYBACK_SPEEDS[0];
      setAllPlaybackRate(nextSpeed);
      return nextSpeed;
    });
    setIsPlaying(true);
    controlAllVideos("play");
  }, [controlAllVideos, setAllPlaybackRate]);

  const rewind = useCallback(() => {
    setIsPlaying(false);
    setIsRewinding((prev) => {
      const newRewinding = !prev || playbackSpeed > 0;
      if (newRewinding) {
        setRewindSpeed((prevSpeed) => {
          const idx = REWIND_SPEEDS.indexOf(prevSpeed);
          const nextSpeed = idx < REWIND_SPEEDS.length - 1 ? REWIND_SPEEDS[idx + 1] : REWIND_SPEEDS[0];
          setAllPlaybackRate(Math.abs(nextSpeed));
          return nextSpeed;
        });
      }
      return newRewinding;
    });
  }, [playbackSpeed, setAllPlaybackRate]);

  const seekTo = useCallback((time) => {
    const clampedTime = Math.max(0, Math.min(TOTAL_SECONDS, time));
    setCurrentTime(clampedTime);
    Object.values(videoRefsMap.current).forEach((ref) => {
      if (ref && ref.current) {
        try { ref.current.currentTime = clampedTime; } catch (e) { /* ignore */ }
      }
    });
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const newMuted = !prev;
      Object.values(videoRefsMap.current).forEach((ref) => {
        if (ref && ref.current) {
          ref.current.muted = newMuted;
        }
      });
      return newMuted;
    });
  }, []);

  // Timeline zoom
  const zoomIn = useCallback(() => {
    setZoomLevel((z) => Math.min(z + 1, ZOOM_LEVELS.length - 1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((z) => Math.max(z - 1, 0));
  }, []);

  // Clip controls
  const setClipIn = useCallback(() => {
    setClipStart(currentTime);
    setClipEnd(null);
  }, [currentTime]);

  const setClipOut = useCallback(() => {
    if (clipStart !== null) {
      setClipEnd(currentTime);
    }
  }, [clipStart, currentTime]);

  const clearClip = useCallback(() => {
    setClipStart(null);
    setClipEnd(null);
  }, []);

  // Playback timer - keeps the timeline (currentTime) in sync with the stream.
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const hasVideoRef = () => {
      const refs = Object.values(videoRefsMap.current);
      return refs.length > 0 && refs[0]?.current;
    };

    // With a reachable <video> we mirror its real currentTime.
    const pollVideoTime = () => {
      const refs = Object.values(videoRefsMap.current);
      if (refs.length > 0 && refs[0]?.current) {
        const video = refs[0].current;
        if (!video.paused) {
          setCurrentTime(Math.floor(video.currentTime));
        }
      }
    };

    // Cross-origin iframe (WebRTC): no reachable <video>, so we can't poll it.
    // MediaMTX re-streams the recording in real time (1x), so advance the
    // timeline by the wall-clock elapsed since the last tick. A seek resets the
    // base by setting currentTime directly, and the functional update below
    // continues from that new value.
    const advanceByWallClock = (() => {
      let last = Date.now();
      return () => {
        const now = Date.now();
        const delta = (now - last) / 1000;
        last = now;
        setCurrentTime((t) => Math.min(TOTAL_SECONDS, t + delta));
      };
    })();

    // Don't advance the timeline while a stream is still (re)registering /
    // connecting - only once it has actually loaded.
    if (isPlaying && !isRewinding && !playbackLoading) {
      if (hasVideoRef()) {
        // Set playback rate on all videos
        Object.values(videoRefsMap.current).forEach((ref) => {
          if (ref?.current) {
            try { ref.current.playbackRate = playbackSpeed; } catch (e) { /* ignore */ }
          }
        });
        timerRef.current = setInterval(pollVideoTime, 250);
      } else {
        timerRef.current = setInterval(advanceByWallClock, 250);
      }
    } else if (isRewinding && !playbackLoading) {
      timerRef.current = setInterval(pollVideoTime, 250);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, isRewinding, playbackSpeed, streamUrl, playbackLoading]);

  const value = useMemo(() => ({
    // Camera list (flat array of camera names)
    cameraList,
    cameraMeta,

    // Camera/search
    selectedCameras,
    setSelectedCameras,
    searchDate,
    setSearchDate,
    searchStartTime,
    setSearchStartTime,
    searchEndTime,
    setSearchEndTime,
    searchStartPeriod,
    setSearchStartPeriod,
    searchEndPeriod,
    setSearchEndPeriod,
    hasSearched,
    recordings,
    searchRecordings,

    // Backend playback stream
    streamUrl,
    playbackLoading,
    activePath,
    startPlayback,
    seekPlayback,
    stopPlayback,
    downloadRecording,

    // Playback
    isPlaying,
    currentTime,
    setCurrentTime,
    playbackSpeed,
    isRewinding,
    rewindSpeed,
    play,
    pause,
    stop,
    stepForward,
    stepBackward,
    fastForward,
    rewind,
    seekTo,
    muted,
    toggleMute,

    // Grid
    grid,
    setGrid,

    // Timeline zoom
    zoomLevel,
    zoomIn,
    zoomOut,
    zoomLevels: ZOOM_LEVELS,

    // Clip
    clipStart,
    clipEnd,
    setClipIn,
    setClipOut,
    clearClip,
    showClipModal,
    setShowClipModal,

    // Download
    showDownloadModal,
    setShowDownloadModal,

    // Fullscreen
    fullscreenCamera,
    setFullscreenCamera,

    // Video zoom
    videoZoom,
    setVideoZoom,

    // NVR
    isNvrConnected,

    // Status
    statusMessage,

    // Video refs
    registerVideoRef,
    unregisterVideoRef,

    // Helpers
    formatTime,
    TOTAL_SECONDS,
    PLAYBACK_SPEEDS,
    REWIND_SPEEDS,
  }), [
    cameraList, cameraMeta,
    selectedCameras, searchDate, searchStartTime, searchEndTime,
    searchStartPeriod, searchEndPeriod, hasSearched, recordings,
    streamUrl, playbackLoading, activePath,
    startPlayback, seekPlayback, stopPlayback, downloadRecording,
    isPlaying, currentTime, playbackSpeed, isRewinding, rewindSpeed,
    muted, grid, zoomLevel, clipStart, clipEnd,
    showClipModal, showDownloadModal, fullscreenCamera, statusMessage,
    searchRecordings, play, pause, stop, stepForward, stepBackward,
    fastForward, rewind, seekTo, toggleMute, zoomIn, zoomOut,
    setClipIn, setClipOut, clearClip, registerVideoRef, unregisterVideoRef,
    formatTime, videoZoom, isNvrConnected,
  ]);

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used within PlaybackProvider");
  return ctx;
}
