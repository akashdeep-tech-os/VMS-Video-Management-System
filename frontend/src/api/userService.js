// Auth + user management against the real backend (/api/v1).
//
// Contract notes (verified against the live server):
//  - Login returns { token, token_type, expires_in_seconds, username, role }
//    and NO rights array anymore -> we derive rights client-side from the role
//    so existing rights-gated UI keeps working.
//  - Users use first_name / last_name / role_name / active (no `email`).
//  - Roles are a fixed enum, not a /roles endpoint.
import apiClient from "./apiClient";

// Backend roles are a closed enum (SUPER_ADMIN | ADMIN | USER). We surface them
// as the "roles" list the Users form expects (id + name).
export const ROLES = [
  { id: "SUPER_ADMIN", name: "SUPER_ADMIN", description: "Full system access" },
  { id: "ADMIN", name: "ADMIN", description: "Department administrator" },
  { id: "USER", name: "USER", description: "Standard operator" },
];

// Login no longer returns rights; derive a sensible set from the role so any
// rights-based show/hide in the UI still functions.
const ALL_RIGHTS = [
  "CAMERA_CREATE",
  "CAMERA_UPDATE",
  "CAMERA_DELETE",
  "NVR_MANAGE",
  "STREAM_VIEW",
  "PLAYBACK_VIEW",
  "HEALTH_VIEW",
  "PTZ_CONTROL",
  "USER_MANAGE",
];

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

// Turn the backend role enum (e.g. "SUPER_ADMIN") into a display label
// ("Super Admin").
export function roleLabel(role) {
  if (!role) return "";
  return String(role)
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Department writes are SUPER_ADMIN-only on the backend.
export function isSuperAdmin() {
  return currentRole() === "SUPER_ADMIN";
}

// Station/site writes are allowed for SUPER_ADMIN and ADMIN (an ADMIN is scoped
// to its own department, enforced by the backend).
export function canManageStationsSites() {
  const r = currentRole();
  return r === "SUPER_ADMIN" || r === "ADMIN";
}

export function rightsForRole(role) {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return ALL_RIGHTS;
    case "USER":
    default:
      return ["STREAM_VIEW", "PLAYBACK_VIEW", "HEALTH_VIEW"];
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

  // A user's granted rights, grouped per site (user_site_rights_mapping).
  // Used to constrain what an admin can delegate — no privilege escalation.
  async getUserRights(id) {
    return apiClient.get(`/users/${id}/rights`);
  },

  // The read-only rights catalog: [{ id, rights_name, description }].
  async getRights() {
    return apiClient.get("/rights");
  },

  // The Station -> Site -> Camera tree the user may see for a given right.
  // right_id is resolved from getRights() (e.g. the LIVE_MONITORING entry).
  async getAccessibleCameras(id, rightId) {
    return apiClient.get(`/users/${id}/accessible-cameras`, { right_id: rightId });
  },

  // ---- users ----
  async getUsers() {
    // List endpoint is paginated + enveloped; unwrap to the plain array.
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

// Map the (rich, mock-era) Add/Edit-User form to the fields the backend accepts.
// Unsupported fields (email, base/channel rights matrix) are intentionally dropped
// per the agreed "keep form UI, send supported subset" approach.
function toBackendUser(form = {}, { create = false } = {}) {
  const roleName = form.role_name || form.role || undefined;
  const payload = {
    role_name: roleName,
    first_name: form.first_name ?? form.firstName,
    last_name: form.last_name ?? form.lastName,
  };
  if (create) payload.username = form.username;
  if (typeof form.active === "boolean") payload.active = form.active;
  // The backend requires department_id for ADMIN/USER accounts (not SUPER_ADMIN).
  // Passed through when the form provides it; otherwise the backend returns a
  // clear VALIDATION_ERROR that surfaces in the Users page alert.
  if (form.department_id != null) payload.department_id = form.department_id;
  if (form.station_id != null) payload.station_id = form.station_id;
  // Per-site rights grants: [{ site_id, right_ids: [...] }] -> the backend fans
  // these out into user_site_rights_mapping rows.
  if (Array.isArray(form.site_rights)) payload.site_rights = form.site_rights;
  // Only include password when actually provided (create, or an explicit reset).
  if (form.password) payload.password = form.password;

  // Strip undefined so PATCH stays a true partial update.
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return payload;
}

export default userService;
