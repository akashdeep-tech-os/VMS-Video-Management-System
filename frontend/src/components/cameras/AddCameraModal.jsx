import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import { FiZap, FiHardDrive, FiClock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import nvrService from "../../api/nvrService";
import { siteService } from "../../api/orgService";

/** How long a SUCCESSFUL Test banner stays up before dismissing itself.
 *  Failures are never auto-dismissed - see the timer effect. */
const TEST_RESULT_TIMEOUT_MS = 10000;

/** Small inline spinner for buttons. */
function Spinner({ size = 11 }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

function AddCameraModal({ isOpen, onClose, onSave, editingCamera, currentDepartment }) {
  const [form, setForm] = useState({
    name: "",
    department: "",
    group: "",
    subGroup: "",
    cameraNvrType: "",
    connectionType: "ONVIF",
    brand: "",
    ip: "",
    httpPort: "",
    rtspPort: "",
    rtsp: "",
    username: "",
    password: "",
    latitude: "",
    longitude: "",
    noOfChannels: "",
    recordingMode: "local",
    storagePath: "",
  });

  const [testStatus, setTestStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const brandRef = useRef(null);

  const brandOptions = [
    { value: "cpplus", label: "CP PLUS" },
    { value: "hifocus", label: "Hi-focus" },
    { value: "hawkvision", label: "Hawkvision" },
    { value: "hikvision", label: "Hikvision" },
    { value: "prama", label: "Prama" },
    { value: "sparsh", label: "Sparsh" },
    { value: "consistent", label: "Consistent" },
    { value: "matrix", label: "Matrix" },
    { value: "tvs", label: "TVS" },
    { value: "godrej", label: "Godrej" },
    { value: "trueview", label: "TrueView" },
    { value: "tplink", label: "TPLink" },
    { value: "zebronics", label: "Zebronics" },
    { value: "bosch", label: "Bosch" },
    { value: "axis", label: "Axis" },
  ];

  const isEditMode = !!editingCamera;

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem("vms_departments");
    return saved ? JSON.parse(saved) : [];
  });

  // Re-read departments from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("vms_departments");
      if (saved) {
        try {
          setDepartments(JSON.parse(saved));
        } catch {}
      }
    }
  }, [isOpen]);

  // Find selected department - always look up latest from departments array
  const selectedDept = useMemo(() => {
    const deptId = currentDepartment?.id || (form.department ? Number(form.department) : null);
    if (!deptId) return currentDepartment || null;
    return departments.find((d) => d.id === deptId) || currentDepartment || null;
  }, [departments, form.department, currentDepartment]);

  // Derive groups from selectedDept
  const groups = useMemo(() => {
    return selectedDept?.groups || [];
  }, [selectedDept]);

  // Sites fetched from the BACKEND for the selected station, keyed by station
  // id. The localStorage mirror below is only populated as a side effect of
  // drilling into a station in Settings, so on a fresh browser (or for sites
  // created by anyone else) it is empty and the dropdown looked broken.
  // GET /sites is the source of truth; the cache is just the fallback.
  const [sitesByStation, setSitesByStation] = useState({});

  const subGroups = useMemo(() => {
    if (!form.group || !selectedDept) return [];
    const stationId = groups.find((g) => g.name === form.group)?.id;
    const fetched = stationId != null ? sitesByStation[stationId] : null;
    if (fetched) return fetched;
    // Fallback: the locally-cached hierarchy (used until the fetch lands, and
    // if the request fails).
    const latestDept = departments.find((d) => d.id === selectedDept.id);
    const deptGroups = latestDept?.groups || selectedDept?.groups || [];
    const matchedGroup = deptGroups.find((g) => g.name === form.group);
    return matchedGroup?.subGroups || [];
  }, [form.group, selectedDept, departments, groups, sitesByStation]);

  const [isAddingSite, setIsAddingSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");

  // Any discovery call in flight (test preview OR real registration). Both hit
  // the same slow, sequential endpoint, so both lock the actions.
  const busy = isSubmitting || testStatus === "testing";

  const isNvr = form.cameraNvrType === "nvr";
  // For NVR, Add Device is gated behind a successful preview Test.
  const [nvrPreviewOk, setNvrPreviewOk] = useState(false);
  useEffect(() => {
    setNvrPreviewOk(false);
  }, [
    form.ip,
    form.username,
    form.password,
    form.cameraNvrType,
    form.connectionType,
    form.group,
    form.subGroup,
  ]);

  const selectedStation = useMemo(
    () => groups.find((g) => g.name === form.group) || null,
    [groups, form.group],
  );
  const selectedSite = useMemo(
    () => subGroups.find((sg) => sg.name === form.subGroup) || null,
    [subGroups, form.subGroup],
  );

  // Load the selected station's sites from the backend. Runs whenever the
  // station changes while the modal is open; results are cached per station id
  // so re-picking a station doesn't refetch.
  useEffect(() => {
    const stationId = selectedStation?.id;
    if (!isOpen || stationId == null || sitesByStation[stationId]) return;
    let cancelled = false;
    siteService
      .list({ station_id: stationId })
      .then((list) => {
        if (cancelled) return;
        const sites = (Array.isArray(list) ? list : []).map((s) => ({
          id: s.id,
          name: s.name,
          createdAt: s.created_at,
        }));
        setSitesByStation((prev) => ({ ...prev, [stationId]: sites }));
      })
      .catch((err) => {
        // Non-fatal: the localStorage fallback still supplies whatever is cached.
        console.error("Failed to load sites for station", stationId, err);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedStation?.id, sitesByStation]);

  // NvrRegistrationRequest body (snake_case) for the id-less discover endpoint.
  const buildNvrBody = () => ({
    brand_name: form.brand || form.name || "NVR",
    ip_address: form.ip,
    rtsp_port: form.rtspPort ? Number(form.rtspPort) : undefined,
    onvif_port: form.httpPort ? Number(form.httpPort) : undefined,
    username: form.username || undefined,
    plain_password: form.password || undefined,
    // Device channel CAPACITY. Stored on the NVR row so every future scan is
    // bounded automatically, without the operator re-entering it.
    no_of_channels: form.noOfChannels ? Number(form.noOfChannels) : undefined,
    department_id: selectedDept?.id,
    station_id: selectedStation?.id,
    site_id: selectedSite?.id,
  });

  // Test button -> preview dry-run. Add Device -> real run.
  //
  // METHOD differs on purpose:
  //  - Test uses ONVIF, so the result answers one question cleanly: does this
  //    device speak ONVIF? AUTO would silently fall back to RTSP probing and
  //    report success, hiding the fact that ONVIF is unavailable.
  //  - Add Device uses AUTO, which is what you actually want when registering:
  //    ONVIF when possible, bounded RTSP probing when not.
  //
  // maxChannels bounds the scan. It matters most for AUTO's RTSP fallback,
  // which REFUSES to run unbounded (sweeping past a device's real capacity can
  // register wrap-around alias channels). Operator-supplied count wins; 16 is
  // the default for the common case.
  const discoveryOpts = (preview) => ({
    preview,
    method: preview ? "ONVIF" : "AUTO",
    maxChannels: form.noOfChannels ? Number(form.noOfChannels) : 16,
    zone: form.subGroup || form.group,
    stationId: selectedStation?.id,
    siteId: selectedSite?.id,
    rewriteRtspPort: true,
    // Vendor hint for AUTO's RTSP fallback: reorders the URL-convention loop
    // so the right one is tried first (and is the only way to reach the
    // Hawkvision convention). Collected by the Brand picker that appears when
    // the ONVIF test fails - exactly when the fallback is what will run.
    brand: form.brand || undefined,
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (brandRef.current && !brandRef.current.contains(e.target)) {
        setBrandOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-dismiss SUCCESS only. A FAILURE stays until the operator dismisses it
  // (the x) or runs another test: its message is the diagnostic they need to
  // act on - which port was tried, whether the device wants HTTPS, whether to
  // fall back to RTSP - and it sits right next to the Brand/Channels fields
  // that appear on failure. Timing that out mid-read would be hostile.
  //
  // Either way this clears only `testResult` (the banner), never `testStatus`,
  // which drives the Test button label and reveals those fallback fields.
  useEffect(() => {
    if (!testResult || !testResult.reachable) return;
    const timer = setTimeout(() => setTestResult(null), TEST_RESULT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [testResult]);

  useEffect(() => {
    // Only (re)initialise while the modal is actually open.
    if (!isOpen) return;
    if (editingCamera) {
      setForm({
        name: editingCamera.name || "",
        department: editingCamera.department || (currentDepartment?.id ? String(currentDepartment.id) : ""),
        group: editingCamera.group || "",
        subGroup: editingCamera.subGroup || "",
        cameraNvrType: editingCamera.cameraNvrType || "",
        // ONBRAND was removed as a resolving method; anything stored with it
        // (or with an unrecognised value) reads back as ONVIF so the select
        // never sits on an option that no longer exists.
        connectionType:
          editingCamera.connectionType === "RTSP" ? "RTSP" : "ONVIF",
        ip: editingCamera.ip || "",
        httpPort: editingCamera.httpPort || "",
        rtspPort: editingCamera.rtspPort || "",
        rtsp: editingCamera.rtsp || "",
        username: editingCamera.username || "",
        password: editingCamera.password || "",
        latitude: editingCamera.latitude || "",
        longitude: editingCamera.longitude || "",
        recordingMode: editingCamera.recordingMode || "local",
        storagePath: editingCamera.storagePath || "",
      });
    } else {
      handleReset();
    }
    setTestStatus("idle");
    setTestResult(null);
    // DEPEND ON IDS, NOT OBJECT IDENTITY. The parent re-reads departments from
    // localStorage on a 500ms timer, so `currentDepartment` is a fresh
    // JSON.parse'd object on every tick where the version key changed. With the
    // object in the deps, ANY such tick re-ran this effect and (in add mode)
    // called handleReset() - which wiped a half-filled form ~500ms after
    // creating a site inline, since that write bumps the version key.
    // The ids are stable primitives, so the effect now fires only when the
    // modal opens or the actual target changes.
    //
    // isOpen is here so reopening for another ADD starts blank (both ids stay
    // null/undefined between adds, which would otherwise not re-trigger).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingCamera?.id, currentDepartment?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };
    if (name === "department") {
      updates.group = "";
      updates.subGroup = "";
    }
    if (name === "group") {
      updates.subGroup = "";
    }
    // An NVR is discovered channel-by-channel via ONVIF; a single pasted RTSP
    // URL cannot describe a multi-channel device. Selecting NVR while RTSP is
    // active would otherwise leave an unreachable combination selected, so
    // fall back to ONVIF.
    if (name === "cameraNvrType" && value === "nvr" && form.connectionType === "RTSP") {
      updates.connectionType = "ONVIF";
    }
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    setForm({
      name: "",
      department: currentDepartment?.id ? String(currentDepartment.id) : "",
      group: "",
      subGroup: "",
      cameraNvrType: "",
      connectionType: "ONVIF",
      ip: "",
      httpPort: "",
      rtspPort: "",
      rtsp: "",
      username: "",
      password: "",
      latitude: "",
      longitude: "",
      noOfChannels: "",
      recordingMode: "local",
      storagePath: "",
    });
    setTestStatus("idle");
    setTestResult(null);
  };

  const handleSubmit = async () => {
    if (!form.name) return;

    // Edit stays local (backend camera edit is a separate concern).
    if (isEditMode) {
      onSave({ ...editingCamera, ...form });
      onClose();
      return;
    }

    if (form.connectionType === "RTSP" && !form.rtsp) return;
    if (form.connectionType !== "RTSP" && !form.ip) return;

    // Tracked separately from testStatus: sharing it made the TEST button flip
    // to "Testing..." while an ADD was running, which read as the wrong action
    // being in flight.
    setIsSubmitting(true);
    try {
      // Real run: registers-or-finds the device and creates its channels.
      // preview=false, method=AUTO, rewrite_rtsp_port=true.
      await nvrService.discoverForConnection(buildNvrBody(), discoveryOpts(false));
      onSave(); // parent refetches from the backend
      // Clear before closing so the next Add opens blank even if the modal is
      // reopened with identical props (the open-effect also resets, this makes
      // it immediate and independent of prop identity).
      handleReset();
      setNvrPreviewOk(false);
      setIsAddingSite(false);
      setNewSiteName("");
      onClose();
    } catch (err) {
      setTestStatus("disconnected");
      setTestResult({ reachable: false, message: err.message || "Failed to add device" });
      alert("Failed to add device: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!form.ip) return;
    setTestStatus("testing");
    setTestResult(null);
    try {
      // Preview (dry run) discovery: preview=true, method=ONVIF, rewrite_rtsp_port=true.
      const res = await nvrService.discoverForConnection(buildNvrBody(), discoveryOpts(true));
      const found =
        res?.channels_probed ?? res?.registered ?? (res?.cameras?.length || 0);
      setTestResult({
        reachable: true,
        protocol: res?.method,
        message: `Reachable — ${found} channel(s) found. Click Add Device to register them.`,
      });
      setTestStatus("connected");
      setNvrPreviewOk(true);
    } catch (err) {
      setTestResult({ reachable: false, message: err.message });
      setTestStatus("disconnected");
      setNvrPreviewOk(false);
    }
  };

  const handleAddNewSite = useCallback(async () => {
    if (!newSiteName.trim() || !selectedDept || !form.group) return;
    const groupObj = groups.find((g) => g.name === form.group);
    if (!groupObj) return;

    // Create it on the BACKEND first. This used to mint a local
    // `id: Date.now()` and write only to localStorage, so the site never
    // existed server-side - and worse, that fake id was then sent as
    // `site_id` in buildNvrBody(), which the backend rejects as a 404.
    // The real id from the response is what gets stored and submitted.
    let created;
    try {
      created = await siteService.create({
        name: newSiteName.trim(),
        station_id: groupObj.id,
      });
    } catch (err) {
      alert("Failed to create site: " + (err.message || "Unknown error"));
      return;
    }

    const newSubGroup = {
      id: created.id,
      name: created.name,
      createdAt: created.created_at || new Date().toISOString(),
    };

    // Add it to the fetched list too, so the dropdown shows it right away
    // without a refetch (the localStorage mirror below is the fallback path).
    setSitesByStation((prev) => ({
      ...prev,
      [groupObj.id]: [...(prev[groupObj.id] || []), newSubGroup],
    }));
    const updated = departments.map((d) => {
      if (d.id !== selectedDept.id) return d;
      return {
        ...d,
        groups: (d.groups || []).map((g) => {
          if (g.id !== groupObj.id) return g;
          return { ...g, subGroups: [...(g.subGroups || []), newSubGroup] };
        }),
      };
    });
    localStorage.setItem("vms_departments", JSON.stringify(updated));
    localStorage.setItem("vms_departments_version", String(Date.now()));
    // Also update the selected department in localStorage
    const updatedDept = updated.find((d) => d.id === selectedDept.id);
    if (updatedDept) {
      localStorage.setItem("vms_settings_selected_dept", JSON.stringify(updatedDept));
    }
    setDepartments(updated);
    setForm((prev) => ({ ...prev, subGroup: created.name }));
    setNewSiteName("");
    setIsAddingSite(false);
  }, [newSiteName, selectedDept, form.group, groups, departments]);

  const inputClass =
    "w-full px-3.5 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:border-[var(--primary-color)] outline-none transition-all text-[13px] text-[var(--text-dark)] placeholder:text-[var(--text-muted)]";

  const selectClass = `${inputClass} cursor-pointer appearance-none pr-8`;
  const selectWrapperClass = "relative flex-1";
  const selectIconClass =
    "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-70";

  const rowClass = "flex items-center gap-3 min-h-[36px]";
  const labelClass =
    "text-[11px] font-semibold text-[var(--text-dark)] w-24 shrink-0 text-left";
  const fieldClass = "flex-1";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-[540px] bg-[var(--card-bg)] text-[var(--text-dark)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden transition-colors duration-200"
          >
            {/* HEADER */}
            <div className="flex justify-between place-items-start px-6 py-3 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-[var(--text-dark)]">
                  {isEditMode
                    ? `Edit Device — ${selectedDept?.name || "Device"}`
                    : `Add Device — ${selectedDept?.name || "Device"}`}
                </h2>
                <p className="text-[var(--text-muted)] text-[10px] mt-0.5">
                  {isEditMode ? "Update device configuration" : "Configure device and network parameters"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                <IoClose size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="px-6 py-3 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                {/* Row 1: Device Name (full width) */}
                <div className={rowClass}>
                  <label className={labelClass}>
                    Device Name <span className="text-red-500">*</span>
                  </label>
                  <div className={fieldClass}>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="E.g. Main Lobby Camera"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Row 2: Group + Site (two fields) */}
                <div className={rowClass}>
                    <label className={labelClass}>
                      {selectedDept?.groupName || "Group"}
                    </label>
                    <div className="flex gap-2 flex-1">
                      <div className={selectWrapperClass}>
                        <select
                          name="group"
                          value={form.group}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">
                            Select {selectedDept?.groupName || "Group"}...
                          </option>
                          {groups.map((item) => (
                            <option key={item.id} value={item.name}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <IoChevronDown size={14} className={selectIconClass} />
                      </div>
                      {form.group && (
                        <>
                          {isAddingSite ? (
                            <div className="flex gap-1 flex-1">
                              <input
                                type="text"
                                value={newSiteName}
                                onChange={(e) => setNewSiteName(e.target.value)}
                                placeholder="Type site name..."
                                className={`${inputClass} flex-1 text-xs`}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && newSiteName.trim()) {
                                    handleAddNewSite();
                                  } else if (e.key === "Escape") {
                                    setIsAddingSite(false);
                                    setNewSiteName("");
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleAddNewSite}
                                className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:opacity-90"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingSite(false);
                                  setNewSiteName("");
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className={selectWrapperClass}>
                              <select
                                name="subGroup"
                                value={form.subGroup}
                                onChange={(e) => {
                                  if (e.target.value === "__add_new__") {
                                    setIsAddingSite(true);
                                  } else {
                                    handleChange(e);
                                  }
                                }}
                                className={selectClass}
                              >
                                <option value="">Select Site...</option>
                                {subGroups.map((sg) => (
                                  <option key={sg.id} value={sg.name}>
                                    {sg.name}
                                  </option>
                                ))}
                                <option
                                  value="__add_new__"
                                  className="font-bold text-emerald-600"
                                >
                                  + Add New
                                </option>
                              </select>
                              <IoChevronDown
                                size={14}
                                className={selectIconClass}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                {/* Row 3: Device Type + Connection (two fields) */}
                <div className={rowClass}>
                  <label className={labelClass}>Device</label>
                  <div className="flex gap-2 flex-1">
                    <div className={selectWrapperClass}>
                      <select
                        name="cameraNvrType"
                        value={form.cameraNvrType}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">Select Type...</option>
                        <option value="bullet">Bullet Camera</option>
                        <option value="dome">Dome Camera</option>
                        <option value="ptz">PTZ Camera</option>
                        <option value="nvr">NVR</option>
                      </select>
                      <IoChevronDown size={14} className={selectIconClass} />
                    </div>
                    <div className={selectWrapperClass}>
                      <select
                        name="connectionType"
                        value={form.connectionType}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="ONVIF">ONVIF</option>
                        {/* RTSP describes ONE stream, so it cannot express a
                            multi-channel NVR - hidden when NVR is selected. */}
                        {!isNvr && <option value="RTSP">RTSP</option>}
                      </select>
                      <IoChevronDown size={14} className={selectIconClass} />
                    </div>
                  </div>
                </div>

                {/* Row 5: Device IP + HTTP Port + RTSP Port + Test */}
                {form.connectionType === "ONVIF" && (
                  <div className={rowClass}>
                    <label className={labelClass}>Network</label>
                    <div className="flex-1 grid grid-cols-[1fr_56px_56px] gap-2 items-center">
                      <input
                        name="ip"
                        value={form.ip}
                        onChange={handleChange}
                        placeholder="Device IP"
                        className={inputClass}
                      />
                      <input
                        name="httpPort"
                        value={form.httpPort}
                        onChange={handleChange}
                        placeholder="HTTP"
                        className={`${inputClass} text-center`}
                      />
                      <input
                        name="rtspPort"
                        value={form.rtspPort}
                        onChange={handleChange}
                        placeholder="RTSP"
                        className={`${inputClass} text-center`}
                      />
                    </div>
                  </div>
                )}

                {/* Row 5b: RTSP URL - only when RTSP is selected */}
                {form.connectionType === "RTSP" && (
                  <div className={rowClass}>
                    <label className={labelClass}>Stream</label>
                    <div className={fieldClass}>
                      <input
                        name="rtsp"
                        value={form.rtsp || ""}
                        onChange={handleChange}
                        placeholder="rtsp://admin:password@ip:554/stream"
                        className={`${inputClass} font-mono text-xs`}
                      />
                    </div>
                  </div>
                )}

                {/* ONVIF-FAILED FALLBACK DETAILS.
                    A failed test means registration will fall back to RTSP
                    probing, which needs two things ONVIF would have supplied:
                      - Brand: the fallback guesses per-vendor URL conventions,
                        so naming the vendor lets it try the right one FIRST
                        instead of walking candidates blindly.
                      - Channels: the fallback REFUSES to run unbounded, because
                        sweeping past a device's real capacity can register
                        wrap-around alias channels (one camera answering on both
                        ch1 and ch9 of an 8-channel unit). Read it off the
                        device-info page. */}
                {testStatus === "disconnected" && (
                  <>
                    <div className={rowClass}>
                      <label className={labelClass}>Brand</label>
                      <div className={fieldClass}>
                        <div className={selectWrapperClass} ref={brandRef}>
                          <button
                            type="button"
                            onClick={() => setBrandOpen(!brandOpen)}
                            className={`${selectClass} text-left flex items-center justify-between`}
                          >
                            <span>
                              {form.brand
                                ? brandOptions.find((b) => b.value === form.brand)?.label
                                : "Select Brand..."}
                            </span>
                            <IoChevronDown size={14} className="shrink-0 ml-1 opacity-70" />
                          </button>
                          {brandOpen && (
                            <div className="vms-dropdown absolute z-50 mt-1 w-full max-h-[180px] overflow-y-auto">
                              {brandOptions.map((brand) => (
                                <button
                                  key={brand.value}
                                  type="button"
                                  onClick={() => {
                                    setForm({ ...form, brand: brand.value });
                                    setBrandOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--primary-color)]/10 hover:text-[var(--primary-color)] transition-colors ${
                                    form.brand === brand.value
                                      ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold"
                                      : "text-[var(--text-dark)]"
                                  }`}
                                >
                                  {brand.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={rowClass}>
                      <label className={labelClass}>Channels</label>
                      <div className={fieldClass}>
                        <input
                          type="number"
                          min="1"
                          max="128"
                          name="noOfChannels"
                          value={form.noOfChannels}
                          onChange={handleChange}
                          placeholder="Number of channels (e.g. 16)"
                          className={inputClass}
                        />
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">
                          ONVIF didn’t answer. Give the device’s brand and channel
                          count so it can be scanned over RTSP instead.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Row 6: Username + Password.
                    Hidden for RTSP — that URL already carries its own
                    credentials (rtsp://user:pass@host/...). */}
                {form.connectionType !== "RTSP" && (
                  <div className={rowClass}>
                    <label className={labelClass}>Authentication</label>
                    <div className="flex gap-2 flex-1">
                      <input
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Username"
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className={`${inputClass} flex-1`}
                      />
                    </div>
                  </div>
                )}

                {/* Row 7: Latitude + Longitude */}
                <div className={rowClass}>
                  <label className={labelClass}>Coordinates</label>
                  <div className="flex gap-2 flex-1">
                    <input
                      name="latitude"
                      value={form.latitude}
                      onChange={handleChange}
                      placeholder="Latitude"
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      name="longitude"
                      value={form.longitude}
                      onChange={handleChange}
                      placeholder="Longitude"
                      className={`${inputClass} flex-1`}
                    />
                  </div>
                </div>

                {/* Row 8: Recording Mode */}
                <div className={rowClass}>
                  <label className={labelClass}>Recording</label>
                  <div className="flex gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, recordingMode: "ondemand" })
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        form.recordingMode === "ondemand"
                          ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)]"
                          : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      <FiHardDrive size={12} />
                      On-Demand
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, recordingMode: "local" })
                      }
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        form.recordingMode === "local"
                          ? "border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)]"
                          : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      <FiClock size={12} />
                      Local
                    </button>
                  </div>
                </div>

                {/* Storage Path */}
                {form.recordingMode === "local" && (
                  <div className={rowClass}>
                    <label className={labelClass}>Storage</label>
                    <div className={fieldClass}>
                      <input
                        name="storagePath"
                        value={form.storagePath}
                        onChange={handleChange}
                        placeholder="/recordings/camera-name"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* DISCOVERY IN FLIGHT — indeterminate, because the duration is
                  genuinely unknown up front: probing is SEQUENTIAL and paced
                  (~1s between channels, to stay under NVR anti-brute-force
                  lockout), so a 16-channel scan runs 20s+ and ONVIF adds its
                  own round-trips. A percentage would be a lie; the elapsed
                  hint sets expectations instead. */}
              {busy && (
                <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-dark)]">
                    <Spinner size={12} />
                    {isSubmitting
                      ? "Registering device and its channels…"
                      : "Probing device…"}
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--border-color)]">
                    <div className="h-full w-1/3 rounded-full bg-[var(--primary-color)] animate-[vms-indeterminate_1.2s_ease-in-out_infinite]" />
                  </div>
                  <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                    Channels are probed one at a time — this can take a while on
                    a multi-channel NVR. Please don’t close this window.
                  </p>
                </div>
              )}

              {/* TEST RESULT — pinned at the BOTTOM, just above the actions,
                  instead of inline in the middle of the form (where it shoved
                  every field below it down the moment a test finished).
                  Auto-dismisses; see the timer effect. Long ONVIF diagnostics
                  can run to several lines, so it scrolls rather than growing
                  the modal, and can be closed early. */}
              {testResult && (
                <div
                  className={`mt-3 rounded-lg px-3 py-2 text-[11px] border relative ${
                    testResult.reachable
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setTestResult(null)}
                    className="absolute top-1.5 right-1.5 opacity-50 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss"
                  >
                    <IoClose size={13} />
                  </button>
                  <div className="font-semibold mb-0.5 pr-5">
                    {testResult.reachable ? "Device Reachable" : "Device Unreachable"}
                  </div>
                  <div className="text-[10px] opacity-80 max-h-[72px] overflow-y-auto pr-1">
                    {testResult.message}
                  </div>
                  {testResult.reachable && (
                    <div className="flex gap-3 mt-1 text-[10px] opacity-70">
                      {testResult.protocol && (
                        <span>Protocol: {testResult.protocol}</span>
                      )}
                      {testResult.channelCount != null && (
                        <span>Channels: {testResult.channelCount}</span>
                      )}
                      {testResult.videoCodec && (
                        <span>Codec: {testResult.videoCodec}</span>
                      )}
                      {testResult.onvifPort && (
                        <span>ONVIF Port: {testResult.onvifPort}</span>
                      )}
                    </div>
                  )}
                  {testResult.credentialsRejected && (
                    <div className="mt-1 font-semibold text-red-600">
                      Credentials rejected — check username and password.
                    </div>
                  )}
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="flex justify-between items-center gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                {/* Test — bottom-left. Only meaningful when an IP is present,
                    and hidden entirely for RTSP: there is no device to probe,
                    just a stream URL that either plays or doesn't. The empty
                    span keeps the footer's justify-between layout intact. */}
                {form.connectionType === "RTSP" ? (
                  <span />
                ) : (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={!form.ip || busy || isEditMode}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                    testStatus === "connected"
                      ? "bg-emerald-500 text-white hover:opacity-90"
                      : testStatus === "disconnected"
                        ? "bg-red-500 text-white hover:opacity-90"
                        : testStatus === "testing"
                          ? "bg-yellow-500 text-white cursor-wait animate-pulse"
                          : "bg-emerald-500 text-white hover:opacity-90"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {testStatus === "testing" ? <Spinner size={11} /> : <FiZap size={11} />}
                  {testStatus === "testing"
                    ? "Testing..."
                    : testStatus === "connected"
                      ? "Connected"
                      : testStatus === "disconnected"
                        ? "Failed"
                        : "Test"}
                </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={busy}
                    className="px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-all text-xs font-semibold border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    // Disabled while ANY discovery is in flight - a second
                    // submit would start a parallel scan of the same device,
                    // which is exactly the burst pattern the paced prober
                    // exists to avoid.
                    disabled={busy}
                    className="px-5 py-2 bg-[var(--primary-color)] hover:opacity-90 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isSubmitting && <Spinner size={11} />}
                    {isEditMode
                      ? "Update Device"
                      : isSubmitting
                        ? "Adding…"
                        : "Add Device"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default AddCameraModal;
