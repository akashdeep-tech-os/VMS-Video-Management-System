/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import userService, { currentUserId } from "../api/userService";
import cameraService from "../api/cameraService";

// The right whose accessible-camera tree backs the Live Monitoring sidebar.
const LIVE_MONITORING_RIGHT = "LIVE_MONITORING";

const LiveStreamingContext = createContext(null);

/**
 * Turn the backend's WHEP signalling URL into MediaMTX's ready-made player
 * page, by dropping the trailing "/whep".
 */
function webrtcPlayerUrl(whepUrl) {
  if (!whepUrl) return null;
  return whepUrl.replace(/\/whep\/?$/, "");
}

const STORAGE_KEY = "vms_live_streaming";
const LAYOUTS_KEY = "vms_layout_presets";
const EVENTS_KEY = "vms_recent_events";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadLayouts() {
  try {
    const raw = localStorage.getItem(LAYOUTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function LiveStreamingProvider({ children }) {
  const saved = loadPersisted();

  // Flat list of camera names (replaces the old cameraGroups tree)
  const [cameraList, setCameraList] = useState(saved?.cameraList ?? []);
  // Name-keyed stream/meta lookups. Empty by default, populated from the
  // backend accessible-cameras tree (see effect below).
  const [baseStreams, setBaseStreams] = useState({});
  const [cameraMeta, setCameraMeta] = useState({});
  const [streamInfo, setStreamInfo] = useState({});
  // Camera names whose stream has been requested, to avoid duplicate fetches.
  const requestedStreamsRef = useRef(new Set());
  const [selectedCams, setSelectedCams] = useState(saved?.selectedCams ?? []);
  const [mutedMap, setMutedMap] = useState(saved?.mutedMap ?? {});
  const [grid, setGrid] = useState(saved?.grid ?? 4);
  const [gridCols, setGridCols] = useState(saved?.gridCols ?? saved?.grid ?? 4);
  const [gridRows, setGridRows] = useState(saved?.gridRows ?? saved?.grid ?? 4);
  const [autoShiftEnabled, setAutoShiftEnabled] = useState(
    saved?.autoShiftEnabled ?? false,
  );
  const [autoShiftInterval, setAutoShiftInterval] = useState(
    saved?.autoShiftInterval ?? 300,
  );
  const [shiftPage, setShiftPage] = useState(0);
  const [streamType, setStreamType] = useState("sub");

  // Load the Live Monitoring camera tree for the logged-in user from the
  // backend. On any failure (offline, unauthenticated) we keep empty state.
  const [cameraReloadToken, setCameraReloadToken] = useState(0);
  const refreshCameras = () => setCameraReloadToken((n) => n + 1);

  useEffect(() => {
    const userId = currentUserId();
    let cancelled = false;
    (async () => {
      try {
        let cameras, meta;
        try {
          if (userId) {
            const rights = await userService.getRights();
            const right = (rights || []).find(
              (r) => r.rights_name === LIVE_MONITORING_RIGHT,
            );
            if (right) {
              const resp = await userService.getAccessibleCameras(userId, right.id);
              const result = treeToFlat(resp);
              cameras = result.cameras;
              meta = result.meta;
            }
          }
        } catch {
          // Accessible cameras endpoint not available, fall through to tree
        }

        // Fallback: fetch from /cameras/tree
        if (!cameras || cameras.length === 0) {
          const treeResp = await cameraService.tree();
          const result = treeToFlat(treeResp);
          cameras = result.cameras;
          meta = result.meta;
        }

        if (cancelled) return;
        setCameraList(cameras);
        setCameraMeta(meta);
        // New tree -> drop any stream URLs resolved against the old one.
        setStreamInfo({});
        requestedStreamsRef.current = new Set();
      } catch (err) {
        console.error("Failed to load camera tree:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cameraReloadToken]);

  // Fetch stream info for displayed cameras (WebRTC URL from the real backend)
  const [displayedCams, setDisplayedCams] = useState([]);

  // Reset shift page when selection changes
  useEffect(() => {
    setShiftPage(0);
  }, [selectedCams]);

  // Update displayed cameras based on selected cameras, grid size, and shift page
  useEffect(() => {
    const pageSize = grid * gridRows;
    const start = shiftPage * pageSize;
    const fromSelected = selectedCams.slice(start, start + pageSize);
    if (fromSelected.length > 0) {
      setDisplayedCams(fromSelected);
    } else if (selectedCams.length === 0) {
      setDisplayedCams([]);
    }
  }, [selectedCams, shiftPage, grid, gridRows]);

  // Clear stream cache when streamType changes so URLs are re-fetched
  useEffect(() => {
    requestedStreamsRef.current = new Set();
    setStreamInfo({});
  }, [streamType]);

  useEffect(() => {
    const toFetch = displayedCams.filter(
      (name) => !requestedStreamsRef.current.has(name),
    );
    if (toFetch.length === 0) return;

    toFetch.forEach((name) => {
      requestedStreamsRef.current.add(name);
      const meta = cameraMeta[name];
      if (!meta?.id) return;

      cameraService
        .get(meta.id)
        .then((cam) => {
          // Use sub_webrtc_url for sub stream, webrtc_url for main stream
          const rawUrl = streamType === "sub" ? cam?.sub_webrtc_url : cam?.webrtc_url;
          const playerUrl = webrtcPlayerUrl(rawUrl);
          setStreamInfo((prev) => ({
            ...prev,
            [name]: {
              webrtcUrl: playerUrl || rawUrl || null,
              hlsUrl: null,
            },
          }));
        })
        .catch(() => {});
    });
  }, [displayedCams, cameraMeta, streamType]);

  // Derive a camera-name -> stream-URL lookup from streamInfo
  const cameraStreams = useMemo(() => {
    const map = {};
    for (const [name, info] of Object.entries(streamInfo)) {
      map[name] = info?.webrtcUrl || info?.hlsUrl || null;
    }
    return map;
  }, [streamInfo]);

  // Tile status tracking for displayed cameras
  const [tileStatuses, setTileStatuses] = useState({});

  // All camera names from the flat list
  const allCameraNames = cameraList;

  // Layout
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(displayedCams.length / (grid * gridRows))),
    [displayedCams.length, grid, gridRows],
  );

  // Events state
  const [events, setEvents] = useState(() => loadEvents());
  const [savedLayouts, setSavedLayouts] = useState(() => loadLayouts());
  const [lockedTiles, setLockedTiles] = useState(saved?.lockedTiles ?? {});
  const [selectedTiles, setSelectedTiles] = useState(() => new Set());
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Auto-shift effect
  useEffect(() => {
    if (!autoShiftEnabled || totalPages <= 1) return;
    const timer = setInterval(() => {
      setShiftPage((p) => (p + 1) % totalPages);
    }, autoShiftInterval * 1000);
    return () => clearInterval(timer);
  }, [autoShiftEnabled, autoShiftInterval, totalPages]);

  // Computed counts for header
  const showingCount = displayedCams.length;
  const totalCount = allCameraNames.length;

  // Unread event count
  const unreadEventCount = useMemo(
    () => events.filter((e) => !e.read).length,
    [events],
  );

  // Event actions
  const dismissEvent = useCallback((eventId) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, read: true } : e)),
    );
  }, []);

  const clearAllEvents = useCallback(() => {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
  }, []);

  // Filtered events (always show all for now, filter state is UI-only)
  const [eventFilter, setEventFilter] = useState("all");
  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return events;
    if (eventFilter === "unread") return events.filter((e) => !e.read);
    return events.filter((e) => e.severity === eventFilter);
  }, [events, eventFilter]);

  // Tile selection
  const clearTileSelection = useCallback(() => {
    setSelectedTiles(new Set());
  }, []);

  // Tile lock toggle
  const toggleLockTile = useCallback((idx) => {
    setLockedTiles((prev) => {
      const next = { ...prev };
      if (next[idx]) delete next[idx];
      else next[idx] = true;
      return next;
    });
  }, []);

  // Layout actions
  const saveLayout = useCallback(
    (name) => {
      const layout = {
        id: Date.now().toString(),
        name,
        grid: gridCols * gridRows,
        cameras: [...selectedCams],
      };
      setSavedLayouts((prev) => [...prev, layout]);
    },
    [gridCols, gridRows, selectedCams],
  );

  const loadLayout = useCallback(
    (layoutId) => {
      const layout = savedLayouts.find((l) => l.id === layoutId);
      if (!layout) return;
      const cols = Math.ceil(Math.sqrt(layout.cameras.length));
      setGridCols(cols);
      setGridRows(Math.ceil(layout.cameras.length / cols));
      setSelectedCams(layout.cameras);
    },
    [savedLayouts, setGridCols, setGridRows, setSelectedCams],
  );

  const deleteLayout = useCallback((layoutId) => {
    setSavedLayouts((prev) => prev.filter((l) => l.id !== layoutId));
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cameraList,
        selectedCams,
        mutedMap,
        grid,
        gridCols,
        gridRows,
        autoShiftEnabled,
        autoShiftInterval,
        lockedTiles,
      }),
    );
  }, [
    cameraList,
    selectedCams,
    mutedMap,
    grid,
    autoShiftEnabled,
    autoShiftInterval,
    lockedTiles,
  ]);

  // Persist layouts
  useEffect(() => {
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(savedLayouts));
  }, [savedLayouts]);

  // Persist events
  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, 100)));
  }, [events]);

  const toggleCamera = useCallback((cam) => {
    setSelectedCams((prev) => {
      if (prev.includes(cam)) return prev.filter((c) => c !== cam);
      return [...prev, cam];
    });
  }, []);

  const toggleAudio = useCallback((cam) => {
    setMutedMap((p) => ({ ...p, [cam]: !p[cam] }));
  }, []);

  const placeCameraAtIndex = useCallback((camName, gridIndex) => {
    setSelectedCams((prev) => {
      const idx = prev.indexOf(camName);
      if (idx === gridIndex) return prev;
      const next = prev.filter((c) => c !== camName);
      next.splice(gridIndex, 0, camName);
      return next;
    });
  }, []);

  const selectAllCameras = useCallback(() => {
    setSelectedCams((prev) => [...new Set([...prev, ...cameraList])]);
  }, [cameraList]);

  const deselectAllCameras = useCallback(() => {
    setSelectedCams([]);
  }, []);

  const clearAllCameras = useCallback(() => {
    setSelectedCams([]);
  }, []);

  const toggleTileSelect = useCallback((idx) => {
    setSelectedTiles((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      cameraList,
      setCameraList,
      baseStreams,
      cameraMeta,
      cameraStreams,
      streamInfo,
      streamType,
      setStreamType,
      selectedCams,
      setSelectedCams,
      mutedMap,
      grid,
      setGrid,
      gridCols,
      setGridCols,
      gridRows,
      setGridRows,
      toggleCamera,
      toggleAudio,
      placeCameraAtIndex,
      selectAllCameras,
      deselectAllCameras,
      clearAllCameras,
      displayedCams,
      tileStatuses,
      autoShiftEnabled,
      setAutoShiftEnabled,
      autoShiftInterval,
      setAutoShiftInterval,
      shiftPage,
      setShiftPage,
      totalPages,
      events,
      setEvents,
      savedLayouts,
      setSavedLayouts,
      lockedTiles,
      setLockedTiles,
      refreshCameras,
      allCameraNames,
      selectedTiles,
      toggleTileSelect,
      showEventPanel,
      setShowEventPanel,
      showMiniMap,
      setShowMiniMap,
      unreadEventCount,
      dismissEvent,
      clearAllEvents,
      eventFilter,
      setEventFilter,
      filteredEvents,
      clearTileSelection,
      toggleLockTile,
      showingCount,
      totalCount,
      saveLayout,
      loadLayout,
      deleteLayout,
    }),
    [
      cameraList,
      baseStreams,
      cameraMeta,
      cameraStreams,
      streamInfo,
      streamType,
      selectedCams,
      mutedMap,
      grid,
      gridCols,
      gridRows,
      toggleCamera,
      toggleAudio,
      placeCameraAtIndex,
      selectAllCameras,
      deselectAllCameras,
      clearAllCameras,
      displayedCams,
      tileStatuses,
      autoShiftEnabled,
      autoShiftInterval,
      shiftPage,
      totalPages,
      events,
      savedLayouts,
      lockedTiles,
      allCameraNames,
      selectedTiles,
      toggleTileSelect,
      showEventPanel,
      showMiniMap,
      unreadEventCount,
      dismissEvent,
      clearAllEvents,
      eventFilter,
      filteredEvents,
      clearTileSelection,
      toggleLockTile,
      showingCount,
      totalCount,
      saveLayout,
      loadLayout,
      deleteLayout,
    ],
  );

  return (
    <LiveStreamingContext.Provider value={value}>
      {children}
    </LiveStreamingContext.Provider>
  );
}

export function useLiveStreaming() {
  const ctx = useContext(LiveStreamingContext);
  if (!ctx) throw new Error("useLiveStreaming must be used within LiveStreamingProvider");
  return ctx;
}

// Convert backend response (flat list or station tree) to flat { cameras, meta }
function treeToFlat(resp) {
  const cameras = [];
  const meta = {};

  if (Array.isArray(resp)) {
    resp.forEach((cam) => {
      cameras.push(cam.name);
      meta[cam.name] = {
        id: cam.camera_id,
        status: cam.online ? "online" : "offline",
        cameraType: cam.camera_type,
      };
    });
    return { cameras, meta };
  }

  const stations = resp?.stations || [];
  stations.forEach((st) => {
    (st.sites || []).forEach((site) => {
      (site.cameras || []).forEach((cam) => {
        cameras.push(cam.name);
        meta[cam.name] = {
          id: cam.camera_id,
          status: cam.online ? "online" : "offline",
          cameraType: cam.camera_type,
        };
      });
    });
  });

  return { cameras, meta };
}
