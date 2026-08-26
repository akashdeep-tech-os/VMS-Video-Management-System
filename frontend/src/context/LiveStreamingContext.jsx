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
import { CameraData } from "../config/cameraData";
import userService, { currentUserId } from "../api/userService";
import cameraService from "../api/cameraService";

// The right whose accessible-camera tree backs the Live Monitoring sidebar.
const LIVE_MONITORING_RIGHT = "LIVE_MONITORING";

const LiveStreamingContext = createContext(null);

/**
 * Turn the backend's WHEP signalling URL into MediaMTX's ready-made player
 * page, by dropping the trailing "/whep".
 *
 *   http://host:8889/edge01-nvr3-ch5-cam42/whep  ->  http://host:8889/edge01-nvr3-ch5-cam42
 *
 * The bare "/whep" endpoint is the raw signalling API, not something a browser
 * can render. The player page negotiates WHEP, handles ICE and decodes HEVC
 * correctly — which a hand-rolled RTCPeerConnection did NOT (same reason
 * playbackService.webrtcUrlFromPath exists for recordings). Returns null when
 * there is no WebRTC URL, so callers can fall through to HLS.
 */
function webrtcPlayerUrl(whepUrl) {
  if (!whepUrl) return null;
  return whepUrl.replace(/\/whep\/?$/, "");
}

const STORAGE_KEY = "vms_live_streaming";
const LAYOUTS_KEY = "vms_layout_presets";
const EVENTS_KEY = "vms_recent_events";

function buildTreeFromCameraData() {
  const groupMap = {};
  CameraData.forEach((cam) => {
    if (!groupMap[cam.group]) {
      groupMap[cam.group] = {};
    }
    if (!groupMap[cam.group][cam.subGroup]) {
      groupMap[cam.group][cam.subGroup] = [];
    }
    groupMap[cam.group][cam.subGroup].push(cam.name);
  });
  return Object.entries(groupMap).map(([groupName, sites]) => ({
    name: groupName,
    sites: Object.entries(sites).map(([siteName, cameras]) => ({
      name: siteName,
      cameras,
    })),
  }));
}

const defaultCameraGroups = buildTreeFromCameraData();

const availableStreams = [
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  "https://test-streams.mux.dev/bbb-360p.m3u8",
  "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
];

function buildCameraStreams() {
  const allCameraNames = CameraData.map((cam) => cam.name);
  const streams = {};
  allCameraNames.forEach((name, idx) => {
    streams[name] = availableStreams[idx % availableStreams.length];
  });
  return streams;
}

// Mock fallbacks used until (or if) the backend accessible-cameras tree loads.
const defaultCameraStreams = buildCameraStreams();

// Build a lookup map for camera metadata
function buildCameraMeta() {
  const meta = {};
  CameraData.forEach((cam) => {
    meta[cam.name] = {
      id: cam.id,
      ip: cam.ip,
      location: cam.location,
      group: cam.group,
      subGroup: cam.subGroup,
      status: cam.status,
      cameraType: cam.cameraType,
    };
  });
  return meta;
}

const defaultCameraMeta = buildCameraMeta();

// Transform the backend AccessibleCamerasResponse (Station -> Site -> Camera,
// snake_case) into the sidebar tree plus the name-keyed stream/meta lookups the
// rest of the context works with. Real streams aren't part of this payload, so
// each camera is assigned a demo HLS URL (round-robin) to keep playback usable.
function transformAccessible(resp) {
  const stations = resp?.stations || [];
  const groups = [];
  const meta = {};
  const streams = {};
  let streamIdx = 0;

  stations.forEach((st) => {
    const sites = (st.sites || []).map((site) => {
      const cameras = (site.cameras || []).map((cam) => {
        const name = cam.name;
        meta[name] = {
          id: cam.camera_id,
          location: site.site_name,
          group: st.station_name,
          subGroup: site.site_name,
          status: cam.online ? "online" : "offline",
          cameraType: cam.camera_type,
        };
        streams[name] = availableStreams[streamIdx % availableStreams.length];
        streamIdx += 1;
        return name;
      });
      return { name: site.site_name, cameras };
    });
    groups.push({ name: st.station_name, sites });
  });

  return { groups, meta, streams };
}

// Generate mock events
function generateMockEvents() {
  const eventTypes = [
    {
      type: "motion",
      label: "Motion Detected",
      severity: "info",
      icon: "motion",
    },
    {
      type: "face_match",
      label: "Face Match Found",
      severity: "warning",
      icon: "face",
    },
    {
      type: "intrusion",
      label: "Intrusion Alert",
      severity: "critical",
      icon: "intrusion",
    },
    {
      type: "camera_offline",
      label: "Camera Offline",
      severity: "critical",
      icon: "offline",
    },
    {
      type: "line_cross",
      label: "Line Crossing",
      severity: "warning",
      icon: "line",
    },
    {
      type: "object_left",
      label: "Object Left Behind",
      severity: "info",
      icon: "object",
    },
  ];
  const camNames = CameraData.map((c) => c.name);
  const events = [];

  for (let i = 0; i < 20; i++) {
    const evt = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const cam = camNames[Math.floor(Math.random() * camNames.length)];
    events.push({
      id: `evt-${Date.now()}-${i}`,
      ...evt,
      camera: cam,
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      read: i > 5,
    });
  }
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

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
    return raw ? JSON.parse(raw) : generateMockEvents();
  } catch {
    return generateMockEvents();
  }
}

export function LiveStreamingProvider({ children }) {
  const saved = loadPersisted();

  const validCameraNames = useMemo(
    () => new Set(CameraData.map((c) => c.name)),
    [],
  );

  const [cameraGroups, setCameraGroups] = useState(
    saved?.cameraGroups?.[0]?.sites ? saved.cameraGroups : defaultCameraGroups,
  );
  // Name-keyed stream/meta lookups. Seeded with mock data, then replaced by the
  // backend accessible-cameras tree once it loads (see effect below).
  // `baseStreams` is the demo/fallback URL per camera; real per-camera playback
  // URLs are fetched on demand into `streamInfo` (see the stream-loading effect).
  const [baseStreams, setBaseStreams] = useState(defaultCameraStreams);
  const [cameraMeta, setCameraMeta] = useState(defaultCameraMeta);
  const [streamInfo, setStreamInfo] = useState({});
  // Camera names whose stream has been requested, to avoid duplicate fetches.
  const requestedStreamsRef = useRef(new Set());
  const [selectedCams, setSelectedCams] = useState(
    (saved?.selectedCams ?? []).filter((cam) => validCameraNames.has(cam)),
  );
  const [mutedMap, setMutedMap] = useState(saved?.mutedMap ?? {});
  const [grid, setGrid] = useState(saved?.grid ?? 4);
  const [gridCols, setGridCols] = useState(saved?.gridCols ?? saved?.grid ?? 4);
  const [gridRows, setGridRows] = useState(saved?.gridRows ?? saved?.grid ?? 4);
  const [openGroups, setOpenGroups] = useState(saved?.openGroups ?? {});
  const [autoShiftEnabled, setAutoShiftEnabled] = useState(
    saved?.autoShiftEnabled ?? false,
  );
  const [autoShiftInterval, setAutoShiftInterval] = useState(
    saved?.autoShiftInterval ?? 300,
  );
  const [shiftPage, setShiftPage] = useState(0);
  const [streamType, setStreamType] = useState("sub");

  // Load the Live Monitoring camera tree for the logged-in user from the
  // backend: resolve the LIVE_MONITORING right's id from the rights catalog,
  // then GET /users/{id}/accessible-cameras?right_id=. On any failure (offline,
  // unauthenticated) we keep the mock tree already in state.
  // Exposed on the context as refreshCameras() so screens that CHANGE the
  // camera set can pull the tree again. Registering or deleting a device
  // happens on a different route, but this provider wraps the whole app and
  // never unmounts - so without an explicit refresh the sidebar kept showing
  // the set that existed at page load until a manual browser reload.
  // Bumping this token re-runs the fetch below. Implemented as a token rather
  // than a memoized async callback so the effect keeps its original shape
  // (an async callback here trips the React Compiler's memoization check).
  const [cameraReloadToken, setCameraReloadToken] = useState(0);
  const refreshCameras = () => setCameraReloadToken((n) => n + 1);

  useEffect(() => {
    const userId = currentUserId();
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const rights = await userService.getRights();
        const right = (rights || []).find(
          (r) => r.rights_name === LIVE_MONITORING_RIGHT,
        );
        if (!right) return;
        const resp = await userService.getAccessibleCameras(userId, right.id);
        if (cancelled) return;
        const { groups, meta, streams } = transformAccessible(resp);
        setCameraGroups(groups);
        setCameraMeta(meta);
        setBaseStreams(streams);
        // New tree -> drop any stream URLs resolved against the old one.
        setStreamInfo({});
        requestedStreamsRef.current = new Set();
      } catch (err) {
        console.error("Failed to load accessible cameras:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cameraReloadToken]);

  // === NEW ENTERPRISE STATE ===
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [lockedTiles, setLockedTiles] = useState(saved?.lockedTiles ?? {});
  const [savedLayouts, setSavedLayouts] = useState(loadLayouts);
  const [events, setEvents] = useState(loadEvents);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");
  const [tileStatuses, setTileStatuses] = useState({});
  const [contextMenu, setContextMenu] = useState(null);

  const gridCapacity = gridCols * gridRows;
  const totalPages = Math.max(1, Math.ceil(selectedCams.length / gridCapacity));

  useEffect(() => {
    setShiftPage(0);
  }, [selectedCams.length, gridCols, gridRows]);

  // Compute displayed cameras
  const displayedCams = useMemo(() => {
    if (selectedCams.length === 0) return [];
    if (!autoShiftEnabled) {
      return selectedCams.slice(0, gridCapacity);
    }
    const page = shiftPage % totalPages;
    const start = page * gridCapacity;
    return selectedCams.slice(start, start + gridCapacity);
  }, [selectedCams, gridCapacity, autoShiftEnabled, shiftPage, totalPages]);

  // Resolve the URL to play per camera, honoring the Main/Sub toggle.
  //
  // WEBRTC IS PREFERRED, HLS IS THE FALLBACK. The fleet is H.265 + G711, and
  // MediaMTX's HLS muxer handles that combination poorly: it cannot carry G711
  // audio at all, and HEVC-in-HLS is only reliable in Safari. WebRTC plays both
  // cleanly on Chrome 136+/Safari with hardware HEVC decode, at sub-second
  // latency instead of HLS's seconds. HLS is kept as the fallback for clients
  // that can't do WebRTC-HEVC (e.g. Edge) and for any camera whose webrtc_url
  // the backend didn't return.
  const cameraStreams = useMemo(() => {
    const resolved = { ...baseStreams };
    Object.entries(streamInfo).forEach(([name, info]) => {
      if (!info) return;
      const [primary, secondary] =
        streamType === "sub"
          ? [info.sub_webrtc_url, info.webrtc_url]
          : [info.webrtc_url, info.sub_webrtc_url];
      const hls =
        streamType === "sub"
          ? info.sub_hls_url || info.hls_url
          : info.hls_url || info.sub_hls_url;
      const url = webrtcPlayerUrl(primary) || webrtcPlayerUrl(secondary) || hls;
      if (url) resolved[name] = url;
    });
    return resolved;
  }, [baseStreams, streamInfo, streamType]);

  // Fetch the real stream for each currently-displayed camera (once), keyed by
  // the camera's backend id from GET /cameras/{id}/stream.
  useEffect(() => {
    displayedCams.forEach((name) => {
      if (!name || requestedStreamsRef.current.has(name)) return;
      const id = cameraMeta[name]?.id;
      if (id == null) return;
      requestedStreamsRef.current.add(name);
      cameraService
        .getStream(id)
        .then((info) => {
          setStreamInfo((prev) => ({ ...prev, [name]: info }));
        })
        .catch((err) => {
          // Keep the fallback URL; allow a later retry for this camera.
          requestedStreamsRef.current.delete(name);
          console.error(`Failed to load stream for camera ${id}:`, err);
        });
    });
  }, [displayedCams, cameraMeta]);

  // Auto-shift timer — only shifts when the user is on the Live page
  useEffect(() => {
    if (!autoShiftEnabled || selectedCams.length <= gridCapacity) return;
    const timer = setInterval(() => {
      if (!window.location.pathname.startsWith("/live")) return;
      setShiftPage((prev) => (prev + 1) % totalPages);
    }, autoShiftInterval * 1000);
    return () => clearInterval(timer);
  }, [
    autoShiftEnabled,
    autoShiftInterval,
    selectedCams.length,
    gridCapacity,
    totalPages,
  ]);

  // Simulate camera status changes — only when on the Live page
  useEffect(() => {
    const interval = setInterval(() => {
      if (!window.location.pathname.startsWith("/live")) return;
      setTileStatuses((prev) => {
        const next = { ...prev };
        CameraData.forEach((cam) => {
          if (!next[cam.name]) {
            next[cam.name] = {
              status: cam.status === "online" ? "online" : "offline",
              fps:
                cam.status === "online"
                  ? Math.floor(Math.random() * 5 + 25)
                  : 0,
              bitrate:
                cam.status === "online"
                  ? Math.floor(Math.random() * 2000 + 1000)
                  : 0,
              latency:
                cam.status === "online"
                  ? Math.floor(Math.random() * 80 + 20)
                  : 0,
              buffering: Math.random() < 0.02,
            };
          } else {
            const cur = next[cam.name];
            if (cur.status === "online") {
              next[cam.name] = {
                ...cur,
                fps: Math.max(
                  20,
                  Math.min(30, cur.fps + Math.floor(Math.random() * 3 - 1)),
                ),
                bitrate: Math.max(
                  800,
                  Math.min(
                    3500,
                    cur.bitrate + Math.floor(Math.random() * 200 - 100),
                  ),
                ),
                latency: Math.max(
                  15,
                  Math.min(
                    120,
                    cur.latency + Math.floor(Math.random() * 10 - 5),
                  ),
                ),
                buffering: Math.random() < 0.01,
              };
            }
          }
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate random events periodically — only when on the Live page
  useEffect(() => {
    const eventTypes = [
      {
        type: "motion",
        label: "Motion Detected",
        severity: "info",
        icon: "motion",
      },
      {
        type: "face_match",
        label: "Face Match Found",
        severity: "warning",
        icon: "face",
      },
      {
        type: "intrusion",
        label: "Intrusion Alert",
        severity: "critical",
        icon: "intrusion",
      },
      {
        type: "line_cross",
        label: "Line Crossing",
        severity: "warning",
        icon: "line",
      },
    ];
    const interval = setInterval(() => {
      if (!window.location.pathname.startsWith("/live")) return;
      if (Math.random() < 0.3) {
        const evt = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const cam =
          displayedCams[Math.floor(Math.random() * displayedCams.length)];
        if (cam) {
          const newEvent = {
            id: `evt-${Date.now()}`,
            ...evt,
            camera: cam,
            timestamp: Date.now(),
            read: false,
          };
          setEvents((prev) => [newEvent, ...prev].slice(0, 100));
        }
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [displayedCams]);

  // Persist state
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cameraGroups,
        selectedCams,
        mutedMap,
        grid,
        gridCols,
        gridRows,
        openGroups,
        autoShiftEnabled,
        autoShiftInterval,
        lockedTiles,
      }),
    );
  }, [
    cameraGroups,
    selectedCams,
    mutedMap,
    grid,
    openGroups,
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

  const toggleGroup = useCallback((key) => {
    setOpenGroups((p) => ({ ...p, [key]: !p[key] }));
  }, []);

  const toggleAudio = useCallback((cam) => {
    setMutedMap((p) => ({ ...p, [cam]: !p[cam] }));
  }, []);

  const reorderCamera = useCallback((groupName, fromIdx, toIdx) => {
    setCameraGroups((prev) =>
      prev.map((g) => {
        if (g.name !== groupName) return g;
        const allCams = g.sites.flatMap((s) => s.cameras);
        const [moved] = allCams.splice(fromIdx, 1);
        allCams.splice(toIdx, 0, moved);
        let i = 0;
        return {
          ...g,
          sites: g.sites.map((s) => {
            const count = s.cameras.length;
            const cams = allCams.slice(i, i + count);
            i += count;
            return { ...s, cameras: cams };
          }),
        };
      }),
    );
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

  const selectAllInGroup = useCallback(
    (groupName) => {
      const group = cameraGroups.find((g) => g.name === groupName);
      if (!group) return;
      const allCams = group.sites.flatMap((s) => s.cameras);
      setSelectedCams((prev) => {
        const result = [...prev];
        for (const cam of allCams) {
          if (!result.includes(cam)) result.push(cam);
        }
        return result;
      });
    },
    [cameraGroups],
  );

  const selectAll = useCallback(() => {
    const allCams = cameraGroups.flatMap((g) =>
      g.sites.flatMap((s) => s.cameras),
    );
    setSelectedCams(allCams);
  }, [cameraGroups]);

  const clearAll = useCallback(() => {
    setSelectedCams([]);
    setMutedMap({});
    setShiftPage(0);
    setSelectedTiles(new Set());
  }, []);

  // === NEW ENTERPRISE METHODS ===

  const toggleTileSelect = useCallback((gridIndex, multiSelect = false) => {
    setSelectedTiles((prev) => {
      const next = new Set(multiSelect ? prev : []);
      if (next.has(gridIndex)) {
        next.delete(gridIndex);
      } else {
        next.add(gridIndex);
      }
      return next;
    });
  }, []);

  const clearTileSelection = useCallback(() => {
    setSelectedTiles(new Set());
  }, []);

  const toggleLockTile = useCallback(
    (gridIndex) => {
      setLockedTiles((prev) => {
        const next = { ...prev };
        if (next[gridIndex]) {
          delete next[gridIndex];
        } else {
          next[gridIndex] = displayedCams[gridIndex] || null;
        }
        return next;
      });
    },
    [displayedCams],
  );

  const saveLayout = useCallback(
    (name) => {
      const layout = {
        id: `layout-${Date.now()}`,
        name,
        timestamp: Date.now(),
        grid,
        gridCols,
        gridRows,
        cameras: [...displayedCams],
        lockedTiles: { ...lockedTiles },
      };
      setSavedLayouts((prev) => [...prev, layout]);
      return layout;
    },
    [grid, gridCols, gridRows, displayedCams, lockedTiles],
  );

  const loadLayout = useCallback(
    (layoutId) => {
      const layout = savedLayouts.find((l) => l.id === layoutId);
      if (!layout) return;
      setGrid(layout.grid);
      setGridCols(layout.gridCols || layout.grid);
      setGridRows(layout.gridRows || layout.grid);
      setSelectedCams(layout.cameras);
      setLockedTiles(layout.lockedTiles || {});
    },
    [savedLayouts],
  );

  const deleteLayout = useCallback((layoutId) => {
    setSavedLayouts((prev) => prev.filter((l) => l.id !== layoutId));
  }, []);

  const dismissEvent = useCallback((eventId) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, read: true } : e)),
    );
  }, []);

  const clearAllEvents = useCallback(() => {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
  }, []);

  const unreadEventCount = useMemo(
    () => events.filter((e) => !e.read).length,
    [events],
  );

  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return events;
    if (eventFilter === "unread") return events.filter((e) => !e.read);
    return events.filter((e) => e.severity === eventFilter);
  }, [events, eventFilter]);

  const openContextMenu = useCallback((x, y, camName, gridIndex) => {
    setContextMenu({ x, y, cam: camName, gridIndex });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <LiveStreamingContext.Provider
      value={{
        cameraGroups,
        cameraStreams,
        cameraMeta,
        // Re-pull the accessible-camera tree; call after registering or
        // deleting devices so the sidebar reflects them without a reload.
        refreshCameras,
        selectedCams,
        displayedCams,
        mutedMap,
        grid,
        gridCols,
        gridRows,
        gridCapacity,
        totalPages,
        showingCount: displayedCams.length,
        totalCount: selectedCams.length,
        shiftPage,
        openGroups,
        autoShiftEnabled,
        autoShiftInterval,
        setGrid,
        setGridCols,
        setGridRows,
        toggleCamera,
        toggleGroup,
        toggleAudio,
        reorderCamera,
        placeCameraAtIndex,
        selectAllInGroup,
        selectAll,
        clearAll,
        setSelectedCams,
        setAutoShiftEnabled,
        setAutoShiftInterval,
        streamType,
        setStreamType,
        // Enterprise
        selectedTiles,
        toggleTileSelect,
        clearTileSelection,
        lockedTiles,
        toggleLockTile,
        savedLayouts,
        saveLayout,
        loadLayout,
        deleteLayout,
        events,
        filteredEvents,
        eventFilter,
        setEventFilter,
        unreadEventCount,
        showEventPanel,
        setShowEventPanel,
        showMiniMap,
        setShowMiniMap,
        dismissEvent,
        clearAllEvents,
        tileStatuses,
        contextMenu,
        openContextMenu,
        closeContextMenu,
      }}
    >
      {children}
    </LiveStreamingContext.Provider>
  );
}

export function useLiveStreaming() {
  const ctx = useContext(LiveStreamingContext);
  if (!ctx)
    throw new Error(
      "useLiveStreaming must be used within LiveStreamingProvider",
    );
  return ctx;
}
