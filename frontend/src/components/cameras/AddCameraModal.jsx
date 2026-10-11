import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import { FiHardDrive, FiClock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import nvrService from "../../api/nvrService";
import cameraService from "../../api/cameraService";

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

function AddCameraModal({
  isOpen,
  onClose,
  onSave,
  editingCamera,
}) {
  const [form, setForm] = useState({
    name: "",
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const brandRef = useRef(null);
  const brandBtnRef = useRef(null);
  const [brandDropdownPos, setBrandDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const brandOptions = [
    { value: "axis", label: "Axis" },
    { value: "bosch", label: "Bosch" },
    { value: "consistent", label: "Consistent" },
    { value: "cpplus", label: "CP Plus" },
    { value: "dahua", label: "Dahua" },
    { value: "evision", label: "e-Vision" },
    { value: "godrej", label: "Godrej" },
    { value: "hawkvision", label: "Hawkvision" },
    { value: "hifocus", label: "Hi-focus" },
    { value: "hikvision", label: "Hikvision" },
    { value: "matrix", label: "Matrix" },
    { value: "prama", label: "Prama" },
    { value: "sparsh", label: "Sparsh" },
    { value: "tplink", label: "TP Link" },
    { value: "trueview", label: "TrueView" },
    { value: "tvs", label: "TVS" },
    { value: "zebronics", label: "Zebronics" },
  ];

  const isEditMode = !!editingCamera;

  const isNvr = form.cameraNvrType === "nvr";

  // NvrRegistrationRequest body (snake_case) for the id-less discover endpoint.
  // `name` and `brand_name` are distinct on purpose: channel labels are built
  // from the Device Name, while the brand only selects an RTSP path template.
  // Collapsing them is what produced labels like "cpplus - CH1" for every
  // CP Plus recorder on the account.
  const buildNvrBody = () => ({
    name: form.name,
    brand_name: form.brand || undefined,
    ip_address: form.ip,
    rtsp_port: form.rtspPort ? Number(form.rtspPort) : undefined,
    onvif_port: form.httpPort ? Number(form.httpPort) : undefined,
    username: form.username || undefined,
    plain_password: form.password || undefined,
    no_of_channels: form.noOfChannels ? Number(form.noOfChannels) : undefined,
    is_nvr: isNvr,
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
        setBrandOpen(false);
      }
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
    if (brandOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [brandOpen]);

  useEffect(() => {
    if (!brandOpen) return;
    const reposition = () => {
      if (brandBtnRef.current) {
        const rect = brandBtnRef.current.getBoundingClientRect();
        setBrandDropdownPos({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [brandOpen]);

  useEffect(() => {
    // Only (re)initialise while the modal is actually open.
    if (!isOpen) return;
    if (editingCamera) {
      setForm({
        name: editingCamera.name || "",
        cameraNvrType: editingCamera.cameraNvrType || "",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingCamera?.id]);

  const handleReset = () => {
    setForm({
      name: "",
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
    setSubmitError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitError(null);
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

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let createdCamera;
      if (isNvr) {
        // NVR: one row per channel, labelled "<Device Name>-Ch-<N>".
        await nvrService.discoverForConnection(buildNvrBody(), {
          method: "AUTO",
          maxChannels: form.noOfChannels ? Number(form.noOfChannels) : 16,
          rewriteRtspPort: true,
          brand: form.brand || undefined,
        });
      } else if (form.connectionType === "RTSP") {
        // A bare RTSP URL already carries host, port, path and credentials, so
        // it goes to the endpoint that parses it. Routing it through NVR
        // discovery used to register a recorder with a blank ip_address.
        createdCamera = await cameraService.createRtsp({
          name: form.name,
          rtsp_url: form.rtsp,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
        });
      } else {
        // ONVIF: use the real camera registration endpoint
        createdCamera = await cameraService.create({
          name: form.name,
          ip_address: form.ip,
          onvif_port: form.httpPort ? Number(form.httpPort) : 80,
          rtsp_port: form.rtspPort ? Number(form.rtspPort) : 554,
          username: form.username || "",
          password: form.password || "",
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
        });
      }
      onSave(createdCamera); // parent refetches from the backend
      handleReset();
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const modal = createPortal(
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
                  {isEditMode ? `Edit Device` : `Add Device`}
                </h2>
                <p className="text-[var(--text-muted)] text-[10px] mt-0.5">
                  {isEditMode
                    ? "Update device configuration"
                    : "Configure device and network parameters"}
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

                {/* Row 2: Brand */}
                <div className={rowClass}>
                  <label className={labelClass}>Brand</label>
                  <div className={fieldClass}>
                    <div className={selectWrapperClass} ref={brandRef}>
                      <button
                        type="button"
                        ref={brandBtnRef}
                        onClick={() => {
                          if (!brandOpen && brandBtnRef.current) {
                            const rect =
                              brandBtnRef.current.getBoundingClientRect();
                            setBrandDropdownPos({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width,
                            });
                          }
                          setBrandOpen(!brandOpen);
                        }}
                        className={`${selectClass} text-left flex items-center justify-between`}
                      >
                        <span
                          className={
                            !form.brand ? "text-[var(--text-muted)]" : ""
                          }
                        >
                          {form.brand
                            ? brandOptions.find((b) => b.value === form.brand)
                                ?.label
                            : "Select Brand..."}
                        </span>
                        <IoChevronDown
                          size={14}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-70"
                        />
                      </button>
                    </div>
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
                    <div className="flex-1 grid grid-cols-[1fr_70px_70px] gap-2 items-center">
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

                {/* Channels field - shown for NVR devices */}
                {isNvr && (
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
                    </div>
                  </div>
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

              {/* ERROR MESSAGE */}
              {submitError && (
                <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-xs">
                  {submitError}
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="flex justify-end items-center gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-all text-xs font-semibold border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
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

  const brandDropdown = brandOpen
    ? createPortal(
        <div
          ref={brandRef}
          className="fixed z-[10000] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg overflow-y-auto"
          style={{
            top: brandDropdownPos.top,
            left: brandDropdownPos.left,
            width: brandDropdownPos.width,
            maxHeight: "200px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setForm((prev) => ({ ...prev, brand: "" }));
              setBrandOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--primary-color)]/10 hover:text-[var(--primary-color)] transition-colors ${
              !form.brand
                ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] font-semibold"
                : "text-[var(--text-muted)]"
            }`}
          >
            Select Brand...
          </button>
          {brandOptions.map((brand) => (
            <button
              key={brand.value}
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, brand: brand.value }));
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
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {modal}
      {brandDropdown}
    </>
  );
}

export default AddCameraModal;
