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

// Transform the backend AccessibleCamerasResponse (Station -> Site -> Camera,
// snake_case) into the sidebar tree plus the name-keyed stream/meta lookups.
function transformAccessible(resp) {
  const stations = resp?.stations || [];
  const groups = [];
  const meta = {};

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
        return name;
      });
      return { name: site.site_name, cameras };
    });
    groups.push({ name: st.station_name, sites });
  });

  return { groups, meta };
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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function LiveStreamingProvider({ children }) {
  const saved = loadPersisted();

  const [cameraGroups, setCameraGroups] = useState(
    saved?.cameraGroups?.[0]?.sites ? saved.cameraGroups : [],
  );
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
  // backend. On any failure (offline, unauthenticated) we keep empty state.
  const [cameraReloadToken, setCameraReloadToken] = useState(0);
  const refreshCameras = () => setCameraReloadToken((n) => n + 1);

  useEffect(() => {
    const userId = currentUserId();
    let cancelled = false;
    (async () => {
      try {
        // Try the permissions-based accessible cameras endpoint first
        let groups, meta;
        try {
          if (userId) {
            const rights = await userService.getRights();
            const right = (rights || []).find(
              (r) => r.rights_name === LIVE_MONITORING_RIGHT,
            );
            if (right) {
              const resp = await userService.getAccessibleCameras(userId, right.id);
              const result = transformAccessible(resp);
              groups = result.groups;
              meta = result.meta;
            }
          }
        } catch {
          // Accessible cameras endpoint not available, fall through to tree
        }

        // Fallback: fetch the flat camera tree from /cameras/tree
        if (!groups || groups.length === 0) {
          const treeResp = await cameraService.tree();
          const stations = treeResp?.stations || [];
          groups = [];
          meta = {};
          stations.forEach((st) => {
            const sites = (st.sites || []).map((site) => {
              const cameras = (site.cameras || []).map((cam) => {
                meta[cam.name] = {
                  id: cam.camera_id,
                  group: st.station_name,
                  subGroup: site.site_name,
                  status: cam.online ? "online" : "offline",
                  cameraType: cam.camera_type,
                };
                return cam.name;
              });
              return { name: site.site_name, cameras };
            });
            groups.push({ name: st.station_name, sites });
          });
        }

        if (cancelled) return;
        setCameraGroups(groups);
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
  useEffect(() => {
    setDisplayedCams((prev) => {
      const fromSelected = selectedCams.slice(0, grid * gridRows);
      return fromSelected.length > 0 ? fromSelected : prev;
    });
  }, [selectedCams, grid, gridRows]);

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
          const webrtcUrl = cam?.webrtc_url;
          const playerUrl = webrtcPlayerUrl(webrtcUrl);
          setStreamInfo((prev) => ({
            ...prev,
            [name]: {
              webrtcUrl: playerUrl || webrtcUrl || null,
              hlsUrl: null,
            },
          }));
        })
        .catch(() => {});
    });
  }, [displayedCams, cameraMeta]);

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

  // Compute all camera names from the tree
  const allCameraNames = useMemo(() => {
    const names = [];
    cameraGroups.forEach((g) => {
      g.sites?.forEach((s) => {
        s.cameras?.forEach((c) => names.push(c));
      });
    });
    return names;
  }, [cameraGroups]);

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
        const merged = [...new Set([...prev, ...allCams])];
        return merged;
      });
    },
    [cameraGroups],
  );

  const deselectAllInGroup = useCallback(
    (groupName) => {
      const group = cameraGroups.find((g) => g.name === groupName);
      if (!group) return;
      const allCams = new Set(group.sites.flatMap((s) => s.cameras));
      setSelectedCams((prev) => prev.filter((c) => !allCams.has(c)));
    },
    [cameraGroups],
  );

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
      cameraGroups,
      setCameraGroups,
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
      openGroups,
      toggleGroup,
      toggleCamera,
      toggleAudio,
      reorderCamera,
      placeCameraAtIndex,
      selectAllInGroup,
      deselectAllInGroup,
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
      cameraGroups,
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
      openGroups,
      toggleGroup,
      toggleCamera,
      toggleAudio,
      reorderCamera,
      placeCameraAtIndex,
      selectAllInGroup,
      deselectAllInGroup,
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
