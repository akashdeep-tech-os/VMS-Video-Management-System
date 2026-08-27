import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import CameraTable from "../../components/cameras/CameraTable";
import CameraHeader from "../../components/cameras/CameraHeader";
import cameraService from "../../api/cameraService";
import AddCameraModal from "../../components/cameras/AddCameraModal";
import CameraDetailsDrawer from "../../components/cameras/CameraDetailsDrawer";
import { AnimatePresence } from "framer-motion";
import { useLiveStreaming } from "../../context/LiveStreamingContext";

// Map a backend CameraResponse (snake_case) into the row shape the table renders.
function mapCamera(cam) {
  return {
    id: cam.id,
    name: cam.name,
    ip: cam.camera_ip || cam.nvr_ip || cam.ip_address || "—",
    location: cam.station_name || cam.zone || cam.nvr_name || "—",
    group: cam.station_name || cam.zone || cam.nvr_name || "Ungrouped",
    subGroup: cam.site_name || cam.nvr_name || "—",
    // Table filters on "online"/"offline"; derive from health/active flags.
    status: cam.active === false ? "offline" : cam.healthy || cam.stream_state === "registered" ? "online" : "offline",
    cameraType: cam.camera_type || "—",
    visible: cam.active !== false,
  };
}

function Addcamera({ onBack }) {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [cameras, setCameras] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [activeDetailCamera, setActiveDetailCamera] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);

  // Counter to force re-read from localStorage when data changes
  const [deptVersion, setDeptVersion] = useState(() =>
    localStorage.getItem("vms_departments_version") || "0"
  );

  const { setIsPageBlurred } = useOutletContext() || {};

  // The Live Monitoring / Playback sidebars are fed by a provider that wraps
  // the whole app and loads its tree once. Registering or deleting devices
  // here must tell it to re-pull, or those tabs stay stale until a reload.
  const { refreshCameras } = useLiveStreaming();

  // Re-read from localStorage whenever deptVersion changes
  const departments = useMemo(() => {
    const saved = localStorage.getItem("vms_departments");
    return saved ? JSON.parse(saved) : [];
  }, [deptVersion]);

  const currentDepartment = useMemo(() => {
    const saved = localStorage.getItem("vms_settings_selected_dept");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, [deptVersion]);

  // Get the latest department data (with fresh groups) from departments array
  const activeDepartment = useMemo(() => {
    if (!currentDepartment) return null;
    return departments.find((d) => d.id === currentDepartment.id) || currentDepartment;
  }, [departments, currentDepartment]);

  const groups = useMemo(() => {
    if (activeDepartment) {
      return activeDepartment.groups || [];
    }
    const allGroups = [...new Set(cameras.map((cam) => cam.group).filter(Boolean))];
    return allGroups;
  }, [activeDepartment, cameras]);

  // Listen for localStorage changes from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "vms_departments" || e.key === "vms_settings_selected_dept") {
        setDeptVersion(String(Date.now()));
      }
    };

    // Also poll for changes (for same-tab updates)
    const interval = setInterval(() => {
      const current = localStorage.getItem("vms_departments_version") || "0";
      setDeptVersion((prev) => {
        if (prev !== current) return current;
        return prev;
      });
    }, 500);

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (setIsPageBlurred) {
      setIsPageBlurred(showModal);
    }
    return () => setIsPageBlurred?.(false);
  }, [showModal, setIsPageBlurred]);

  const loadCameras = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const list = await cameraService.list();
      setCameras(Array.isArray(list) ? list.map(mapCamera) : []);
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to load cameras", err);
      setCameras([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  const handleRefresh = () => {
    setDeptVersion(String(Date.now()));
    loadCameras();
  };

  const toggleVisibility = (id) => {
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id === id ? { ...cam, visible: !cam.visible } : cam,
      ),
    );
  };

  const handleDelete = async (id) => {
    try {
      await cameraService.remove(id);
    } catch (err) {
      console.error("Failed to delete camera", err);
      alert("Failed to delete camera: " + (err.message || "Unknown error"));
      return;
    }
    setCameras((prev) => prev.filter((cam) => cam.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    if (activeDetailCamera?.id === id) setActiveDetailCamera(null);
    refreshCameras?.();
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedIds.map((id) => cameraService.remove(id)),
    );
    const deleted = selectedIds.filter((_, i) => results[i].status === "fulfilled");
    setCameras((prev) => prev.filter((cam) => !deleted.includes(cam.id)));
    if (deleted.includes(activeDetailCamera?.id)) setActiveDetailCamera(null);
    setSelectedIds([]);
    refreshCameras?.();
    if (deleted.length < selectedIds.length) alert("Failed to delete some cameras.");
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (ids) => {
    setSelectedIds(selectedIds.length === ids.length ? [] : ids);
  };

  const handleAddCamera = (newCamera) => {
    // Backend adds (NVR discovery / ONVIF) call onSave() with no arg — just
    // refetch the real list. A passed object (legacy/local) is prepended.
    if (newCamera) {
      setCameras((prev) => [newCamera, ...prev]);
    } else {
      loadCameras();
    }
    // Discovery can register many channels at once — pull the sidebar tree too.
    refreshCameras?.();
  };

  const handleEditCamera = (updatedCamera) => {
    setCameras((prev) =>
      prev.map((cam) => (cam.id === updatedCamera.id ? updatedCamera : cam)),
    );
    setEditingCamera(null);
  };

  const openEditModal = (camera) => {
    setEditingCamera(camera);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCamera(null);
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchStatus = status === "all" || cam.status === status;
    const matchGroup = group === "all" || cam.group === group;
    const matchSearch =
      cam.name.toLowerCase().includes(search.toLowerCase()) ||
      (cam.location &&
        cam.location.toLowerCase().includes(search.toLowerCase())) ||
      cam.ip.includes(search);
    return matchStatus && matchGroup && matchSearch;
  });

  const detailedCameraData = cameras.find(
    (c) => c.id === activeDetailCamera?.id,
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center min-h-[3rem] h-auto md:h-12 py-2.5 md:py-0 px-4 border-b border-[var(--border-color)] bg-[var(--card-bg)] flex-shrink-0 gap-2 sm:gap-0">
        <CameraHeader
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          group={group}
          setGroup={setGroup}
          groups={groups}
          selectedIds={selectedIds}
          handleBulkDelete={handleBulkDelete}
          onAddClick={() => setShowModal(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          departmentName={activeDepartment?.name || ""}
          groupLabel={activeDepartment?.groupName || "Group"}
          onBack={onBack}
          cameraCount={cameras.length}
        />
      </div>

      <div className="flex-1 min-h-0 h-0 flex flex-col p-3 overflow-hidden">
        <div
          className={`flex flex-col transition-opacity duration-200 ${isRefreshing ? "opacity-40 pointer-events-none" : ""}`}
        >
          <CameraTable
            cameras={filteredCameras}
            toggleVisibility={toggleVisibility}
            handleDelete={handleDelete}
            onEdit={openEditModal}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            onRowDetailsClick={(cam) => setActiveDetailCamera(cam)}
            activeDetailCamera={activeDetailCamera}
          />
        </div>

        <AnimatePresence>
          {detailedCameraData && (
            <CameraDetailsDrawer
              camera={detailedCameraData}
              onClose={() => setActiveDetailCamera(null)}
            />
          )}
        </AnimatePresence>
      </div>

      <AddCameraModal
        isOpen={showModal}
        onClose={closeModal}
        onSave={editingCamera ? handleEditCamera : handleAddCamera}
        editingCamera={editingCamera}
        currentDepartment={activeDepartment}
      />
    </div>
  );
}

export default Addcamera;
