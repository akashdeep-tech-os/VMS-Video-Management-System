// Auth + user management against the real backend (/api/v1).
//
// Contract notes (verified against the live server):
//  - Login returns { token, token_type, expires_in_seconds, id, username,
//    full_name, role } and NO rights array -> we derive rights client-side
//    from the role so rights-gated UI keeps working.
//  - Users use username / role / active / base_rights / channel_rights.
//  - Roles are a fixed two-value enum (ADMIN | USER), not a /roles endpoint.
import apiClient from "./apiClient";

// The only two roles the system knows about.
export const ROLES = [
  { id: "ADMIN", name: "ADMIN", description: "Full system access" },
  { id: "USER", name: "USER", description: "Standard operator" },
];

// The 14 base rights (ui ids) from the backend rights catalog, in catalog order.
export const BASE_RIGHT_IDS = [
  "dashboard",
  "liveMonitoring",
  "playback",
  "reports",
  "anprDashboard",
  "vehicleTracking",
  "blacklistVehicles",
  "anprReports",
  "faceRecognition",
  "peopleCounting",
  "lineCrossing",
  "objectDetection",
  "ptzController",
  "settings",
];

// What a USER holds when nothing explicit was granted (Settings is Admin-only).
const USER_DEFAULT_RIGHT_IDS = BASE_RIGHT_IDS.filter((id) => id !== "settings");

// Normalize any role label ("Admin", "ADMIN", ...) to the backend enum.
export function toRoleEnum(role) {
  return String(role || "").toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
}

// The currently logged-in user's role. Read from the JWT (authoritative for
// this session, always present) and fall back to the stored vms_user object.
export function currentRole() {
  try {
    const token = localStorage.getItem("vms_token");
    if (token) {
      const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
      const claims = JSON.parse(atob(b64 + pad));
      if (claims?.role) return claims.role;
    }
  } catch {
    /* fall through to vms_user */
  }
  try {
    return JSON.parse(localStorage.getItem("vms_user") || "null")?.role || null;
  } catch {
    return null;
  }
}

// The currently logged-in user's numeric id, read from the JWT `uid` claim
// (set by the backend at login). Returns null when unauthenticated.
export function currentUserId() {
  try {
    const token = localStorage.getItem("vms_token");
    if (token) {
      const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
      const claims = JSON.parse(atob(b64 + pad));
      if (claims?.uid != null) return claims.uid;
    }
  } catch {
    /* fall through */
  }
  return null;
}

// The currently logged-in user object as stored at login (vms_user).
export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("vms_user") || "null");
  } catch {
    return null;
  }
}

// Human-readable name for the header/profile: prefer the full name, then
// first+last, and finally the username so something always renders.
export function currentDisplayName() {
  const u = currentUser();
  if (!u) return "";
  const full =
    u.full_name ||
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return full || u.username || "";
}

// Turn the backend role enum (e.g. "ADMIN") into a display label ("Admin").
// ("Super Admin").
export function roleLabel(role) {
  if (!role) return "";
  return String(role)
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Settings (user/device management) is Admin-only in the two-role system.
export function isAdmin() {
  return currentRole() === "ADMIN";
}

// Station/site writes are allowed for admins.
export function canManageStationsSites() {
  return isAdmin();
}

export function rightsForRole(role) {
  switch (toRoleEnum(role)) {
    case "ADMIN":
      return BASE_RIGHT_IDS;
    case "USER":
    default:
      return USER_DEFAULT_RIGHT_IDS;
  }
}

const userService = {
  // ---- auth ----
  async login(username, password) {
    const data = await apiClient.post("/auth/login", { username, password });
    return { ...data, rights: rightsForRole(data.role) };
  },

  async getMe() {
    return apiClient.get("/auth/me");
  },

  // A user's granted base rights as grouped entries
  // ([{ scope, rights: [{ id, rights_name }] }]).
  // Used to constrain what an admin can delegate - no privilege escalation.
  async getUserRights(id) {
    return apiClient.get(`/users/${id}/rights`);
  },

  // The rights catalog: [{ id, rights_name, ui_id, label, description }].
  async getRights() {
    return apiClient.get("/rights");
  },

  // The cameras the user may use for a given right (their channel-rights
  // grant). right_id comes from getRights() (e.g. the LIVE_MONITORING entry).
  async getAccessibleCameras(id, rightId) {
    return apiClient.get(`/users/${id}/accessible-cameras`, { right_id: rightId });
  },

  // ---- users ----
  async getUsers() {
    // Admin-only list; returns the plain array of users.
    return apiClient.get("/users");
  },

  // No /roles endpoint on the backend — roles are a fixed enum.
  async getGroups() {
    return ROLES;
  },

  async createUser(userData) {
    return apiClient.post("/users", toBackendUser(userData, { create: true }));
  },

  async updateUser(id, userData) {
    return apiClient.patch(`/users/${id}`, toBackendUser(userData));
  },

  async deleteUser(id) {
    return apiClient.del(`/users/${id}`);
  },

  async resetPassword(id, newPassword) {
    return apiClient.patch(`/users/${id}/password`, { new_password: newPassword });
  },
};

// Map the Add/Edit-User form to the fields the backend accepts.
function toBackendUser(form = {}, { create = false } = {}) {
  const payload = {};

  const role = form.role || form.role_name;
  if (role) payload.role = toRoleEnum(role);

  if (create) {
    payload.username = form.username;
    payload.password = form.password;
  } else if (form.password) {
    // Only include the password when one was actually typed (a reset).
    payload.password = form.password;
  }

  if (typeof form.active === "boolean") payload.active = form.active;
  if (Array.isArray(form.base_rights)) payload.base_rights = form.base_rights;
  if (form.channel_rights && typeof form.channel_rights === "object") {
    payload.channel_rights = form.channel_rights;
  }

  return payload;
}

export default userService;
