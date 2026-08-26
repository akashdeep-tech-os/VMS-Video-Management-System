import { useState, useMemo, useEffect, useRef } from "react";
import { FaSyncAlt, FaUsers, FaArrowLeft } from "react-icons/fa";
import { FiTrash2, FiSearch, FiEye, FiEyeOff } from "react-icons/fi";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import userService from "../../api/userService";

// Map the modal's role labels to the backend role enum (SUPER_ADMIN|ADMIN|USER).
function toBackendRole(role) {
  const r = (role || "").toUpperCase();
  if (r.includes("SUPER")) return "SUPER_ADMIN";
  if (r === "ADMIN") return "ADMIN";
  return "USER"; // User / Operator / Viewer all map to USER
}

// Map a backend user into the row shape this table renders.
function toUserRow(u, deptName) {
  const name =
    [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
  return {
    id: u.id,
    name,
    username: u.username,
    email: "",
    status: u.active === false ? "Inactive" : "Active",
    role:
      u.role_name === "ADMIN"
        ? "Admin"
        : u.role_name === "SUPER_ADMIN"
          ? "Super Admin"
          : "User",
    department: deptName || "N/A",
    baseRights: {},
  };
}

// Backend rights_name (from GET /users/{id}/rights) -> this UI's right id.
const RIGHT_NAME_TO_ID = {
  DASHBOARD: "dashboard",
  LIVE_MONITORING: "liveMonitoring",
  PLAYBACK: "playback",
  REPORTS: "reports",
  ANPR_DASHBOARD: "anprDashboard",
  VEHICLE_TRACKING: "vehicleTracking",
  BLACKLIST_VEHICLES: "blacklistVehicles",
  ANPR_REPORTS: "anprReports",
  FACE_RECOGNITION: "faceRecognition",
  PEOPLE_COUNTING: "peopleCounting",
  LINE_CROSSING: "lineCrossing",
  OBJECT_DETECTION: "objectDetection",
  PTZ_CONTROLLER: "ptzController",
  SETTINGS: "settings",
};

const baseRightsList = [
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

const inputClass =
  "w-full px-2.5 py-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:border-[var(--primary-color)] outline-none transition-all text-xs text-[var(--text-dark)] placeholder-[var(--text-muted)]";

function UserSettings({ department, onUpdateDepartment, onBack }) {
  // Build channels tree from department groups/subgroups
  const channelsTree = useMemo(() => {
    if (!department?.groups) return [];
    return department.groups.map((group) => ({
      id: `group-${group.id}`,
      label: group.name,
      children: (group.subGroups || []).map((sub) => ({
        id: `sub-${sub.id}`,
        label: sub.name,
        children: [],
      })),
    }));
  }, [department?.groups]);

  // Users for this department, loaded from the backend (the list endpoint has
  // no department filter, so we fetch and scope by department_id client-side).
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const list = await userService.getUsers();
      const scoped = (Array.isArray(list) ? list : []).filter(
        (u) => u.department_id === department?.id,
      );
      setUsers(scoped.map((u) => toUserRow(u, department?.name)));
    } catch (err) {
      console.error("Failed to load users", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    setSearch("");
    setSelectedIds([]);
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department?.id]);

  // Rights the LOGGED-IN user can delegate (from GET /users/{myId}/rights).
  // null = not yet loaded/unknown -> fall back to the full list.
  const [allowedRightIds, setAllowedRightIds] = useState(null);
  // UI right id (e.g. "dashboard") -> backend numeric right id (e.g. 9).
  const [rightIdByUiId, setRightIdByUiId] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await userService.getMe();
        const groups = await userService.getUserRights(me.id);
        const ids = new Set();
        const numeric = {};
        (Array.isArray(groups) ? groups : []).forEach((grp) => {
          (grp.rights || []).forEach((r) => {
            const id = RIGHT_NAME_TO_ID[r.rights_name];
            if (id) {
              ids.add(id);
              numeric[id] = r.id;
            }
          });
        });
        if (!cancelled) {
          setAllowedRightIds(ids);
          setRightIdByUiId(numeric);
        }
      } catch (err) {
        console.error("Failed to load current user's rights", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build the backend site_rights payload from the modal's Base Rights +
  // per-right Channel (site) selections: [{ site_id, right_ids: [...] }].
  const buildSiteRights = () => {
    const perSite = {}; // siteId -> Set(numeric right id)
    Object.entries(rightIdByUiId).forEach(([uiId, numericRight]) => {
      if (!baseRights[uiId]) return; // right not granted
      const sel = channelSelections[uiId] || {};
      Object.entries(sel).forEach(([nodeId, checked]) => {
        if (!checked || !nodeId.startsWith("sub-")) return; // leaf sites only
        const siteId = Number(nodeId.slice(4));
        if (!Number.isFinite(siteId)) return;
        (perSite[siteId] = perSite[siteId] || new Set()).add(numericRight);
      });
    });
    return Object.entries(perSite).map(([siteId, rights]) => ({
      site_id: Number(siteId),
      right_ids: [...rights],
    }));
  };

  // The user's home station, derived from the granted sites' parent station.
  // A user belongs to a single station, so this is set only when unambiguous.
  const deriveStationId = (siteRights) => {
    const siteToStation = {};
    channelsTree.forEach((station) => {
      const stationId = Number(String(station.id).replace("group-", ""));
      (station.children || []).forEach((site) => {
        const siteId = Number(String(site.id).replace("sub-", ""));
        siteToStation[siteId] = stationId;
      });
    });
    const stationIds = new Set(
      siteRights
        .map((g) => siteToStation[g.site_id])
        .filter((s) => Number.isFinite(s)),
    );
    return stationIds.size === 1 ? [...stationIds][0] : null;
  };

  // The base rights actually shown — constrained to what the admin holds.
  const visibleRights = useMemo(
    () =>
      allowedRightIds
        ? baseRightsList.filter((r) => allowedRightIds.has(r.id))
        : baseRightsList,
    [allowedRightIds],
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "Operator",
  });
  const [baseRights, setBaseRights] = useState({
    selectAll: true,
    ...Object.fromEntries(baseRightsList.map((r) => [r.id, true])),
  });
  const [channelRights, setChannelRights] = useState("dashboard");
  const [expandedNodes, setExpandedNodes] = useState(() => {
    const expanded = {};
    channelsTree.forEach((loc) => {
      expanded[loc.id] = true;
      loc.children.forEach((block) => {
        expanded[block.id] = true;
      });
    });
    return expanded;
  });

  const buildDefaultSelections = () => {
    const selections = {};
    const initSelections = (nodes) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          selections[node.id] = true;
          initSelections(node.children);
        } else {
          selections[node.id] = true;
        }
      });
    };
    initSelections(channelsTree);
    return selections;
  };

  const [channelSelections, setChannelSelections] = useState(() => {
    const allSelections = {};
    baseRightsList.forEach((ct) => {
      allSelections[ct.id] = buildDefaultSelections();
    });
    return allSelections;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [selectedCopyRights, setSelectedCopyRights] = useState([]);
  const copyMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (copyMenuRef.current && !copyMenuRef.current.contains(e.target)) {
        setShowCopyMenu(false);
        setSelectedCopyRights([]);
      }
    };
    if (showCopyMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCopyMenu]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || u.status.toLowerCase() === statusFilter;
      const matchRole =
        roleFilter === "all" || u.role.toLowerCase() === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setSelectedIds([]);
    setIsRefreshing(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newUser.username.trim()) {
      newErrors.username = "User Name is required.";
    }
    if (!newUser.password) {
      newErrors.password = "Password is required.";
    } else if (newUser.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (newUser.password !== newUser.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (!newUser.role) {
      newErrors.role = "Role is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBaseRightsChange = (id, checked) => {
    if (id === "selectAll") {
      const newRights = { selectAll: checked };
      visibleRights.forEach((r) => {
        newRights[r.id] = checked;
      });
      setBaseRights(newRights);
      if (!checked) {
        setChannelRights(null);
      } else if (!newRights[channelRights]) {
        const first = visibleRights[0];
        if (first) setChannelRights(first.id);
      }
    } else {
      const newRights = { ...baseRights, [id]: checked };
      newRights.selectAll = visibleRights.every((r) => newRights[r.id]);
      setBaseRights(newRights);
      if (!checked && channelRights === id) {
        const firstChecked = visibleRights.find((r) => newRights[r.id]);
        setChannelRights(firstChecked ? firstChecked.id : null);
      }
    }
  };

  const handleChannelSelectionChange = (id, checked) => {
    if (!channelRights) return;
    const currentSelections = {
      ...channelSelections[channelRights],
      [id]: checked,
    };
    const node = findNode(channelsTree, id);
    if (node && node.children) {
      setChildrenSelections(currentSelections, node.children, checked);
    }
    updateParentSelections(currentSelections, channelsTree);
    setChannelSelections({
      ...channelSelections,
      [channelRights]: currentSelections,
    });
  };

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const findNode = (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const setChildrenSelections = (selections, children, checked) => {
    children.forEach((child) => {
      selections[child.id] = checked;
      if (child.children) {
        setChildrenSelections(selections, child.children, checked);
      }
    });
  };

  const updateParentSelections = (selections, nodes) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        updateParentSelections(selections, node.children);
        selections[node.id] = node.children.every(
          (child) => selections[child.id],
        );
      }
    });
  };

  const getLeafCount = (node) => {
    if (!node.children || node.children.length === 0) return 1;
    return node.children.reduce((sum, child) => sum + getLeafCount(child), 0);
  };

  const getSelectedLeafCount = (node) => {
    const currentSelections = channelSelections[channelRights] || {};
    if (!node.children || node.children.length === 0) {
      return currentSelections[node.id] ? 1 : 0;
    }
    return node.children.reduce(
      (sum, child) => sum + getSelectedLeafCount(child),
      0,
    );
  };

  const copyToAll = () => {
    const source = channelSelections[channelRights];
    const updated = {};
    baseRightsList.forEach((ct) => {
      updated[ct.id] = { ...source };
    });
    setChannelSelections(updated);
    setShowCopyMenu(false);
  };

  const copyToSpecific = (targetId) => {
    const source = channelSelections[channelRights];
    setChannelSelections({
      ...channelSelections,
      [targetId]: { ...source },
    });
    setChannelRights(targetId);
    setShowCopyMenu(false);
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const { username, password, role } = newUser;

      if (editingId) {
        // Partial update — role/active/password; username is immutable.
        await userService.updateUser(editingId, {
          role_name: toBackendRole(role),
          ...(password ? { password } : {}),
        });
      } else {
        // Backend requires department_id for ADMIN/USER — supplied from context.
        // site_rights fans out into user_site_rights_mapping rows.
        const siteRights = buildSiteRights();
        const created = await userService.createUser({
          username: username.trim(),
          password,
          role_name: toBackendRole(role),
          department_id: department?.id,
          station_id: deriveStationId(siteRights),
          active: true,
          site_rights: siteRights,
        });
        if (created?.mappings_created === 0) {
          console.warn(
            "User created but no site-rights mappings — check that channels (sites) are selected.",
          );
        }
      }

      await loadUsers();
      setShowModal(false);
      setEditingId(null);
      setNewUser({
        username: "",
        password: "",
        confirmPassword: "",
        role: "Operator",
      });
      setErrors({});
    } catch (err) {
      setErrors({
        api: err.message || "Failed to create user. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id);
    } catch (err) {
      alert("Failed to delete user: " + (err.message || "Unknown error"));
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setNewUser({
      username: user.name,
      password: "",
      confirmPassword: "",
      role: user.role,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedIds.map((id) => userService.deleteUser(id)),
    );
    const deleted = selectedIds.filter(
      (_, i) => results[i].status === "fulfilled",
    );
    setUsers((prev) => prev.filter((u) => !deleted.includes(u.id)));
    setSelectedIds([]);
    if (deleted.length < selectedIds.length)
      alert("Failed to delete some users.");
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === filteredUsers.length
        ? []
        : filteredUsers.map((u) => u.id),
    );
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <>
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center min-h-[3rem] h-auto md:h-12 py-2.5 md:py-0 px-4 border-b border-[var(--border-color)] bg-[var(--card-bg)] flex-shrink-0 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors"
            >
              <FaArrowLeft size={14} />
            </button>
            <div className=" flex-shrink-0">
              <FaUsers className="text-[var(--primary-color)] text-[22px]" />
            </div>
            <div>
              <h2 className="text-xs md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
                User Management — {department?.name || "No department selected"}
              </h2>
            </div>
            <span className="text-[13px] bg-[var(--primary-color)]/10 text-[var(--primary-color)] px-2 py-0.5 rounded-full font-bold">
              {filteredUsers.length}
            </span>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative w-full md:w-[170px]">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <FiSearch size={13} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)] bg-[var(--input-bg)] text-[var(--text-dark)] placeholder:text-[var(--text-muted)] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 w-full md:flex md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full md:w-auto px-2 py-1.5 text-[12px] rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-dark)] cursor-pointer focus:outline-none focus:border-[var(--primary-color)]"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="operator">User</option>
              </select>
            </div>

            <div className="flex gap-1.5 w-full md:w-auto items-center">
              <button
                onClick={() => {
                  setEditingId(null);
                  setNewUser({
                    username: "",
                    password: "",
                    confirmPassword: "",
                    role: "Operator",
                  });
                  setBaseRights({
                    selectAll: true,
                    ...Object.fromEntries(
                      baseRightsList.map((r) => [r.id, true]),
                    ),
                  });
                  setChannelRights("dashboard");
                  setErrors({});
                  setShowModal(true);
                }}
                className="w-full md:w-auto py-1.5 px-2.5 text-[11px] font-bold bg-[var(--primary-color)] hover:opacity-90 text-white rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
              >
                <FaUsers size={13} className="flex-shrink-0" />
                <span>Add User</span>
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={!hasSelection}
                className={`hidden md:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${hasSelection ? "bg-red-500 text-white shadow-md hover:opacity-90" : "bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border-color)] opacity-50 cursor-not-allowed"}`}
                title={`Delete Selected (${selectedIds.length})`}
              >
                <div className="relative">
                  <FiTrash2 size={14} />
                  {hasSelection && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-white text-red-500 text-[9px] font-bold shadow">
                      {selectedIds.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--hover-bg)] transition border border-[var(--border-color)]/40 text-[var(--text-muted)] hover:text-[var(--text-dark)] bg-[var(--card-bg)]"
              >
                <FaSyncAlt
                  className={`text-[11px] ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden mx-2 my-2">
          <div
            className={`h-auto min-h-0 flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm transition-opacity duration-200 ${isRefreshing ? "opacity-40 pointer-events-none" : ""}`}
          >
            <div className="max-h-[60vh] min-h-0 overflow-y-auto custom-scrollbar">
              <table className="w-full border-collapse text-[13px] uppercase tracking-wider text-[var(--text-dark)]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[var(--primary-color)]/16  font-semibold">
                    <th className="w-[44px] border border-[var(--border-color)] px-4 py-2.5 text-center font-semibold">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={
                          filteredUsers.length > 0 &&
                          filteredUsers.every((u) => selectedIds.includes(u.id))
                        }
                        className="w-4 h-4 accent-[var(--primary-color)] cursor-pointer rounded"
                      />
                    </th>
                    <th className="border border-[var(--border-color)] px-4 py-2.5 text-left font-semibold whitespace-nowrap">
                      NAME
                    </th>
                    <th className="w-[100px] border border-[var(--border-color)] px-4 py-2.5 text-center font-semibold whitespace-nowrap">
                      ROLE
                    </th>
                    <th className="w-[110px] border border-[var(--border-color)] px-4 py-2.5 text-center font-semibold whitespace-nowrap">
                      BASE RIGHTS
                    </th>
                    <th className="w-[80px] border border-[var(--border-color)] px-4 py-2.5 text-center font-semibold whitespace-nowrap">
                      STATUS
                    </th>
                    <th className="w-[100px] border border-[var(--border-color)] px-4 py-2.5 text-center font-semibold whitespace-nowrap">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-[var(--border-color)]"
                      >
                        <div className="flex flex-col items-center justify-center text-[var(--text-muted)] py-16">
                          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                            <svg
                              width="28"
                              height="28"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-gray-300 dark:text-gray-500"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium uppercase">
                            NO USERS FOUND
                          </p>
                          <p className="text-xs mt-1 uppercase">
                            TRY ADJUSTING FILTERS OR SEARCH
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className={`transition-colors duration-150 ${selectedIds.includes(u.id) ? "bg-blue-50" : "hover:bg-[var(--primary-color)]/[0.07]"}`}
                      >
                        <td className="border border-[var(--border-color)] text-center px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.id)}
                            onChange={() => toggleSelect(u.id)}
                            className="w-4 h-4 accent-[var(--primary-color)] cursor-pointer rounded"
                          />
                        </td>
                        <td className="border border-[var(--border-color)] px-4 py-2 text-sm truncate text-left">
                          {u.name}
                        </td>
                        <td className="border border-[var(--border-color)] text-center px-4 py-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-color)] border border-[var(--border-color)]">
                            {u.role}
                          </span>
                        </td>
                        <td className="border border-[var(--border-color)] text-center px-4 py-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-color)] border border-[var(--border-color)]">
                            {u.baseRights
                              ? baseRightsList.filter((r) => u.baseRights[r.id])
                                  .length
                              : 0}
                            /{baseRightsList.length}
                          </span>
                        </td>
                        <td className="border border-[var(--border-color)] text-center px-4 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${u.status === "Active" ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800/30 text-[var(--text-dark)]"}`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="border border-[var(--border-color)] text-center px-4 py-2">
                          <div className="flex justify-center items-center gap-0.5 opacity-60 hover:opacity-100 transition">
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 dark:text-blue-400 transition"
                            >
                              <CiEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition"
                            >
                              <MdDelete size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--border-color)] rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <FaUsers size={16} className="text-[var(--primary-color)]" />
                  <h3 className="text-sm font-bold tracking-tight text-[var(--text-dark)]">
                    {editingId
                      ? `Edit User — ${department?.name || ""}`
                      : `Add User — ${department?.name || ""}`}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="p-1 rounded-md hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-dark)] transition"
                >
                  <IoClose size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Basic Info */}
                <div className="grid grid-cols-4 gap-2.5 mb-4">
                  <label className="text-xs font-semibold text-[var(--text-dark)]">
                    Role
                  </label>
                  <div className="col-span-3">
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="Admin">Admin</option>
                      <option value="User">User</option>
                    </select>
                  </div>

                  <label className="text-xs font-semibold text-[var(--text-dark)]">
                    User name
                  </label>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      className={inputClass}
                    />
                    {errors.username && (
                      <p className="text-red-500 text-[10px] mt-0.5">
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <label className="text-xs font-semibold text-[var(--text-dark)]">
                    Password
                  </label>
                  <div className="col-span-3 relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-dark)]"
                    >
                      {showPassword ? (
                        <FiEyeOff size={16} />
                      ) : (
                        <FiEye size={16} />
                      )}
                    </button>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <label className="text-xs font-semibold text-[var(--text-dark)]">
                    Confirm Password
                  </label>
                  <div className="col-span-3 relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={newUser.confirmPassword}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-dark)]"
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff size={14} />
                      ) : (
                        <FiEye size={14} />
                      )}
                    </button>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-[10px] mt-0.5">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Base Rights */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-[var(--text-dark)] mb-2">
                    Base Rights
                  </h4>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={baseRights.selectAll}
                        onChange={(e) =>
                          handleBaseRightsChange("selectAll", e.target.checked)
                        }
                        className="w-3.5 h-3.5 accent-[var(--primary-color)] cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[var(--text-dark)]">
                        Select all
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 ml-5">
                      {visibleRights.map((right) => (
                        <label
                          key={right.id}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={baseRights[right.id]}
                            onChange={(e) =>
                              handleBaseRightsChange(right.id, e.target.checked)
                            }
                            className="w-3.5 h-3.5 accent-[var(--primary-color)] cursor-pointer"
                          />
                          <span className="text-[11px] text-[var(--text-dark)]">
                            {right.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Channel Rights */}
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Channel Types */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-[var(--text-dark)]">
                          Channel Rights
                        </h4>
                        {/* Invisible spacer to match Channels header height (Apply To button) */}
                        <div className="invisible text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          Apply To
                        </div>
                      </div>
                      <div className="border border-[var(--border-color)] rounded-lg p-2 overflow-y-auto flex-1 min-h-0 max-h-[230px]">
                        {visibleRights
                          .filter((channel) => baseRights[channel.id])
                          .map((channel) => (
                            <button
                              key={channel.id}
                              onClick={() => setChannelRights(channel.id)}
                              className={`w-full text-left px-2.5 py-1.5 text-xs border-b border-[var(--border-color)] last:border-b-0 transition ${
                                channelRights === channel.id
                                  ? "bg-blue-100 text-blue-700 font-medium"
                                  : "hover:bg-[var(--hover-bg)] text-[var(--text-dark)]"
                              }`}
                            >
                              {channel.label}
                            </button>
                          ))}
                        {visibleRights.filter(
                          (channel) => baseRights[channel.id],
                        ).length === 0 && (
                          <p className="text-[11px] text-[var(--text-muted)] text-center py-4">
                            Select base rights to configure channels
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Channels */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-[var(--text-dark)]">
                          Channels
                        </h4>
                        <div className="relative" ref={copyMenuRef}>
                          <button
                            type="button"
                            onClick={() => setShowCopyMenu(!showCopyMenu)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/20 transition flex items-center gap-1.5"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                              />
                            </svg>
                            Apply To
                            <svg
                              className={`w-3 h-3 transition-transform ${showCopyMenu ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          {showCopyMenu && (
                            <div className="vms-dropdown absolute right-0 top-full mt-1 z-[9999] w-[190px]">
                              {/* All Rights - Checkbox */}
                              <div className="px-2 py-1.5 border-b border-[var(--border-color)]">
                                <label className="flex items-center gap-1.5 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={
                                      visibleRights.filter(
                                        (ct) => ct.id !== channelRights,
                                      ).length === selectedCopyRights.length
                                    }
                                    onChange={(e) => {
                                      const available = visibleRights
                                        .filter((ct) => ct.id !== channelRights)
                                        .map((ct) => ct.id);
                                      setSelectedCopyRights(
                                        e.target.checked ? available : [],
                                      );
                                    }}
                                    className="w-3 h-3 accent-[var(--primary-color)] cursor-pointer"
                                  />
                                  <div className="flex items-center gap-1">
                                    <span className="w-4 h-4 rounded bg-[var(--primary-color)]/10 flex items-center justify-center text-[var(--primary-color)]">
                                      <svg
                                        className="w-2.5 h-2.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </span>
                                    <div>
                                      <p className="text-[10px] font-semibold text-[var(--text-dark)] group-hover:text-[var(--primary-color)] transition">
                                        All Rights
                                      </p>
                                      <p className="text-[8px] text-[var(--text-muted)]">
                                        Select all channel rights
                                      </p>
                                    </div>
                                  </div>
                                </label>
                              </div>

                              {/* Specific Rights - Checkboxes */}
                              <div className="px-2 py-1.5">
                                <p className="text-[8px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                                  Specific Rights
                                </p>
                                <div className="space-y-0 max-h-[120px] overflow-y-auto">
                                  {visibleRights
                                    .filter((ct) => ct.id !== channelRights)
                                    .map((ct) => (
                                      <label
                                        key={ct.id}
                                        className="flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer hover:bg-[var(--hover-bg)] transition group"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedCopyRights.includes(
                                            ct.id,
                                          )}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedCopyRights((prev) => [
                                                ...prev,
                                                ct.id,
                                              ]);
                                            } else {
                                              setSelectedCopyRights((prev) =>
                                                prev.filter(
                                                  (id) => id !== ct.id,
                                                ),
                                              );
                                            }
                                          }}
                                          className="w-3 h-3 accent-[var(--primary-color)] cursor-pointer"
                                        />
                                        <span className="w-3.5 h-3.5 rounded bg-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--primary-color)]/10 group-hover:text-[var(--primary-color)] transition">
                                          <svg
                                            className="w-2 h-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M9 5l7 7-7 7"
                                            />
                                          </svg>
                                        </span>
                                        <span className="text-[10px] text-[var(--text-dark)] group-hover:text-[var(--primary-color)] transition">
                                          {ct.label}
                                        </span>
                                      </label>
                                    ))}
                                </div>
                              </div>

                              {/* Apply Button */}
                              <div className="px-2 py-1.5 border-t border-[var(--border-color)]">
                                <button
                                  type="button"
                                  disabled={selectedCopyRights.length === 0}
                                  onClick={() => {
                                    selectedCopyRights.forEach((id) =>
                                      copyToSpecific(id),
                                    );
                                    setSelectedCopyRights([]);
                                    setShowCopyMenu(false);
                                  }}
                                  className={`w-full py-1.5 rounded-lg text-[10px] font-semibold transition ${
                                    selectedCopyRights.length > 0
                                      ? "bg-[var(--primary-color)] text-white hover:opacity-90"
                                      : "bg-[var(--hover-bg)] text-[var(--text-muted)] cursor-not-allowed"
                                  }`}
                                >
                                  Apply ({selectedCopyRights.length})
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="border border-[var(--border-color)] rounded-lg p-2 overflow-y-auto flex-1 min-h-0 max-h-[230px]">
                        {!channelRights ? (
                          <p className="text-[11px] text-[var(--text-muted)] text-center py-4">
                            Select a channel right to configure cameras
                          </p>
                        ) : (
                          <>
                            {/* Select All Cameras */}
                            {(() => {
                              const currentSelections =
                                channelSelections[channelRights] || {};
                              const allChecked = channelsTree.every(
                                (loc) => currentSelections[loc.id],
                              );
                              return (
                                <div className="flex items-center gap-1.5 py-1.5 px-1 mb-1.5 border-b border-[var(--border-color)]">
                                  <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const newSelections = {
                                        ...currentSelections,
                                      };
                                      channelsTree.forEach((loc) => {
                                        newSelections[loc.id] = checked;
                                        if (loc.children) {
                                          loc.children.forEach((block) => {
                                            newSelections[block.id] = checked;
                                            if (block.children) {
                                              block.children.forEach((cam) => {
                                                newSelections[cam.id] = checked;
                                              });
                                            }
                                          });
                                        }
                                      });
                                      setChannelSelections({
                                        ...channelSelections,
                                        [channelRights]: newSelections,
                                      });
                                    }}
                                    className="w-3.5 h-3.5 accent-[var(--primary-color)] cursor-pointer"
                                  />
                                  <span className="text-[10px] font-semibold text-[var(--text-dark)]">
                                    Select All Cameras
                                  </span>
                                </div>
                              );
                            })()}
                            {channelsTree.map((location) => {
                              const total = getLeafCount(location);
                              const selected = getSelectedLeafCount(location);
                              const isExpanded = expandedNodes[location.id];
                              const currentSelections =
                                channelSelections[channelRights];
                              return (
                                <div
                                  key={location.id}
                                  className="mb-1 last:mb-0"
                                >
                                  <div className="flex items-center gap-1.5 py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={currentSelections[location.id]}
                                      onChange={(e) =>
                                        handleChannelSelectionChange(
                                          location.id,
                                          e.target.checked,
                                        )
                                      }
                                      className="w-3.5 h-3.5 accent-[var(--primary-color)] cursor-pointer"
                                    />
                                    <span className="text-[var(--text-muted)] text-[10px]">
                                      {isExpanded ? "▼" : "▶"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleExpand(location.id)}
                                      className="flex items-center gap-1 text-xs font-semibold text-[var(--text-dark)] hover:text-[var(--primary-color)] transition"
                                    >
                                      <span>📁</span>
                                      {location.label}
                                    </button>
                                    <span className="text-[9px] font-semibold px-1 py-0.5 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                                      {selected}/{total}
                                    </span>
                                  </div>
                                  {isExpanded &&
                                    location.children.length > 0 && (
                                      <div className="ml-4 pl-2 border-l border-[var(--border-color)]">
                                        {location.children.map((block) => {
                                          const blockTotal =
                                            getLeafCount(block);
                                          const blockSelected =
                                            getSelectedLeafCount(block);
                                          const blockExpanded =
                                            expandedNodes[block.id];
                                          return (
                                            <div
                                              key={block.id}
                                              className="mb-0.5 last:mb-0"
                                            >
                                              <div className="flex items-center gap-1.5 py-0.5">
                                                <input
                                                  type="checkbox"
                                                  checked={
                                                    currentSelections[block.id]
                                                  }
                                                  onChange={(e) =>
                                                    handleChannelSelectionChange(
                                                      block.id,
                                                      e.target.checked,
                                                    )
                                                  }
                                                  className="w-3.5 h-3.5 accent-[var(--primary-color)] cursor-pointer"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    toggleExpand(block.id)
                                                  }
                                                  className="flex items-center gap-1 text-xs text-[var(--text-dark)] hover:text-[var(--primary-color)] transition"
                                                >
                                                  <span>📁</span>
                                                  {block.label}
                                                </button>
                                                <span className="text-[9px] font-semibold px-1 py-0.5 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                                                  {blockSelected}/{blockTotal}
                                                </span>
                                              </div>
                                              {blockExpanded &&
                                                block.children.length > 0 && (
                                                  <div className="ml-4 pl-2 border-l border-[var(--border-color)]">
                                                    {block.children.map(
                                                      (camera) => (
                                                        <label
                                                          key={camera.id}
                                                          className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:bg-[var(--hover-bg)] rounded px-1 transition"
                                                        >
                                                          <input
                                                            type="checkbox"
                                                            checked={
                                                              currentSelections[
                                                                camera.id
                                                              ]
                                                            }
                                                            onChange={(e) =>
                                                              handleChannelSelectionChange(
                                                                camera.id,
                                                                e.target
                                                                  .checked,
                                                              )
                                                            }
                                                            className="w-3.5 h-3.5 accent-[var(--primary-color)] cursor-pointer"
                                                          />
                                                          <span className="text-[var(--text-muted)] text-[10px]">
                                                            🎥
                                                          </span>
                                                          <span className="text-xs text-[var(--text-dark)]">
                                                            {camera.label}
                                                          </span>
                                                        </label>
                                                      ),
                                                    )}
                                                  </div>
                                                )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {errors.api && (
                  <p className="text-red-500 text-sm mt-4 text-center bg-red-50 p-2 rounded-lg">
                    {errors.api}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setNewUser({
                      username: "",
                      password: "",
                      confirmPassword: "",
                      role: "Operator",
                    });
                    setBaseRights({
                      selectAll: true,
                      ...Object.fromEntries(
                        baseRightsList.map((r) => [r.id, true]),
                      ),
                    });
                    setChannelRights("dashboard");
                    setChannelSelections(() => {
                      const allSelections = {};
                      baseRightsList.forEach((ct) => {
                        allSelections[ct.id] = buildDefaultSelections();
                      });
                      return allSelections;
                    });
                    setErrors({});
                  }}
                  className="px-5 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-muted)] hover:bg-[var(--hover-bg)] transition text-sm font-semibold"
                >
                  Default
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 transition text-sm font-bold disabled:opacity-50 disabled:cursor-wait"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add User"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default UserSettings;
