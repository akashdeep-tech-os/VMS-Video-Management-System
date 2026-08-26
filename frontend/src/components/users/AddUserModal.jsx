import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { FiUser, FiMail, FiLock, FiShield, FiGrid } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const BASE_RIGHTS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "liveMonitoring", label: "Live Monitoring" },
  { id: "playback", label: "Playback" },
  { id: "reports", label: "Reports" },
  { id: "anprDashboard", label: "ANPR Dashboard" },
  { id: "vehicleTracking", label: "Vehicle Tracking" },
  { id: "blacklistVehicles", label: "Blacklist Vehicles" },
  { id: "anprReports", label: "ANPR Reports" },
  { id: "faceRecognition", label: "Face Recognition" },
  { id: "peopleCounting", label: "People Counting" },
  { id: "lineCrossing", label: "Line Crossing" },
  { id: "objectDetection", label: "Object Detection" },
  { id: "ptzController", label: "PTZ Controller" },
  { id: "settings", label: "Settings" },
];

function AddUserModal({ isOpen, onClose, onSave, roles = [], initialData }) {
  const buildForm = (data) => ({
    firstName: data?.first_name || data?.firstName || "",
    lastName: data?.last_name || data?.lastName || "",
    username: data?.username || "",
    email: data?.email || "",
    password: "",
    // Backend user carries `role_name`; older shapes used `role`.
    role: data?.role_name || data?.role || "",
    baseRights: data?.baseRights || Object.fromEntries(BASE_RIGHTS.map((r) => [r.id, true])),
    channelRights: data?.channelRights || Object.fromEntries(BASE_RIGHTS.map((ct) => [ct.id, true])),
  });

  const [form, setForm] = useState(() => buildForm(initialData));

  useEffect(() => {
    setForm(buildForm(initialData));
  }, [initialData]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleBaseRight = (id) => {
    setForm((prev) => {
      const newBaseRights = { ...prev.baseRights, [id]: !prev.baseRights[id] };
      const allSelected = BASE_RIGHTS.every((r) => newBaseRights[r.id]);
      newBaseRights.selectAll = allSelected;

      // Auto-update channel rights based on base rights
      const newChannelRights = { ...prev.channelRights };
      if (!newBaseRights[id]) {
        newChannelRights[id] = false;
      }

      return { ...prev, baseRights: newBaseRights, channelRights: newChannelRights };
    });
  };

  const toggleBaseRightsSelectAll = () => {
    setForm((prev) => {
      const allSelected = BASE_RIGHTS.every((r) => prev.baseRights[r.id]);
      const newBaseRights = {};
      BASE_RIGHTS.forEach((r) => {
        newBaseRights[r.id] = !allSelected;
      });

      const newChannelRights = {};
      BASE_RIGHTS.forEach((ct) => {
        newChannelRights[ct.id] = !allSelected;
      });

      return { ...prev, baseRights: newBaseRights, channelRights: newChannelRights };
    });
  };

  const toggleChannelRight = (id) => {
    setForm((prev) => ({
      ...prev,
      channelRights: { ...prev.channelRights, [id]: !prev.channelRights[id] },
    }));
  };

  const allBaseSelected = BASE_RIGHTS.every((r) => form.baseRights[r.id]);

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.username || !form.email) return;
    const payload = { ...form };
    if (initialData && !payload.password) {
      delete payload.password;
    }
    onSave(payload);
    onClose();
  };

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
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-lg bg-[var(--card-bg)] text-[var(--text-dark)] rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center px-8 py-6 bg-[var(--header-bg)] border-b border-[var(--border-color)] opacity-95">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-dark)]">
                  {initialData ? "Edit User" : "Add New User"}
                </h2>
                <p className="text-[var(--text-muted)] text-xs mt-1">
                  {initialData
                    ? "Update user information"
                    : "Create a new user account"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                <IoClose size={22} />
              </button>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <FiUser className="text-[var(--primary-color)]" /> First Name
                  </label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all placeholder:text-[var(--text-muted)] text-sm text-[var(--text-dark)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <FiUser className="text-[var(--primary-color)]" /> Last Name
                  </label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all placeholder:text-[var(--text-muted)] text-sm text-[var(--text-dark)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <FiUser className="text-[var(--primary-color)]" /> Username
                  </label>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all placeholder:text-[var(--text-muted)] text-sm text-[var(--text-dark)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <FiLock className="text-[var(--text-muted)]" />{" "}
                    {initialData
                      ? "New Password (leave blank to keep)"
                      : "Password"}
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={initialData ? "••••••••" : "Enter password"}
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all text-sm text-[var(--text-dark)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <FiMail className="text-[var(--text-muted)]" /> Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all text-sm text-[var(--text-dark)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <FiShield className="text-[var(--warning-color)]" /> Role
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all text-sm text-[var(--text-dark)] cursor-pointer"
                  >
                    <option
                      value=""
                      className="bg-[var(--card-bg)] text-[var(--text-muted)]"
                    >
                      Select a role...
                    </option>
                    {roles.map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                        className="bg-[var(--card-bg)] text-[var(--text-dark)]"
                      >
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Base Rights */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <FiGrid className="text-[var(--primary-color)]" /> Base Rights
                  </label>
                  <button
                    type="button"
                    onClick={toggleBaseRightsSelectAll}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      allBaseSelected
                        ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    {allBaseSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {BASE_RIGHTS.map((right) => {
                    const checked = form.baseRights[right.id];
                    return (
                      <label
                        key={right.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-[11px] ${
                          checked
                            ? "bg-[var(--primary-color)]/5 border-[var(--primary-color)]/20 text-[var(--text-dark)]"
                            : "bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-muted)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBaseRight(right.id)}
                          className="w-3.5 h-3.5 accent-[var(--primary-color)] rounded cursor-pointer"
                        />
                        <span className="truncate">{right.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Channel Rights */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <FiGrid className="text-[var(--primary-color)]" /> Channel Rights
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {BASE_RIGHTS.map((right) => {
                    const checked = form.channelRights[right.id];
                    const disabled = !form.baseRights[right.id];
                    return (
                      <label
                        key={right.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-[11px] ${
                          disabled
                            ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                            : checked
                              ? "bg-[var(--primary-color)]/5 border-[var(--primary-color)]/20 text-[var(--text-dark)]"
                              : "bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-muted)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleChannelRight(right.id)}
                          className="w-3.5 h-3.5 accent-[var(--primary-color)] rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="truncate">{right.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-all text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-8 py-2.5 bg-[var(--primary-color)] hover:opacity-90 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
                >
                  {initialData ? "Save Changes" : "Add User"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default AddUserModal;
