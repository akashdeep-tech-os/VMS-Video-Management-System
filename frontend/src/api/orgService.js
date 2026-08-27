// Org hierarchy: sites / stations / departments (/api/v1/*).
// Stations and departments are paginated (list returns just the data array here).
import apiClient from "./apiClient";

// DELETE IMPACT: deleting an org node CASCADES to everything under it —
// child stations/sites and every NVR/camera placed on them (users are only
// unassigned, never deleted). There is no confirmation flag on the API, so the
// UI must show the operator what will be destroyed BEFORE calling remove().
// deleteImpact() below fetches those counts for any node type.
export const siteService = {
  // Optional { station_id } filter; response is a plain array (not paginated).
  list: (params) => apiClient.get("/sites", params),
  // expand: "stats" adds { cameras, nvrs } — the delete-impact counts.
  get: (id, params) => apiClient.get(`/sites/${id}`, params),
  create: (body) => apiClient.post("/sites", body),
  update: (id, body) => apiClient.patch(`/sites/${id}`, body),
  remove: (id) => apiClient.del(`/sites/${id}`),
};

export const stationService = {
  list: (params) => apiClient.get("/stations", params),
  // expand: "stats" adds { cameras, nvrs, users, sites }; "department" adds the parent.
  get: (id, params) => apiClient.get(`/stations/${id}`, params),
  create: (body) => apiClient.post("/stations", body),
  update: (id, body) => apiClient.patch(`/stations/${id}`, body),
  remove: (id) => apiClient.del(`/stations/${id}`),
};

export const departmentService = {
  list: async (params) => {
    return await apiClient.get("/departments", params);
  },
  // expand: "stats" adds { cameras, nvrs, stations, users } — delete-impact counts.
  get: (id, params) => apiClient.get(`/departments/${id}`, params),
  create: (body) => apiClient.post("/departments", body),
  update: (id, body) => apiClient.patch(`/departments/${id}`, body),
  remove: (id) => apiClient.del(`/departments/${id}`),
};

/**
 * What deleting an org node will destroy. Call this before remove() and show
 * the result in the confirmation dialog — the delete cascades and cannot be
 * undone, and the API gives no second chance.
 *
 * @param {"department"|"station"|"site"} type
 * @param {number|string} id
 * @returns {Promise<Array<{label: string, count: number}>>} non-zero impacts
 *   only, biggest-consequence-first. Empty array = nothing else is affected.
 *   Never rejects: if the lookup fails the dialog still opens (with no counts)
 *   rather than blocking the operator on a failed preflight.
 */
export async function deleteImpact(type, id) {
  const svc =
    type === "department" ? departmentService
    : type === "station" ? stationService
    : siteService;

  let stats;
  try {
    const node = await svc.get(id, { expand: "stats" });
    stats = node?.stats;
  } catch {
    return [];
  }
  if (!stats) return [];

  // Users are SET NULL by the cascade (unassigned, not deleted), so they are
  // labelled differently — losing an assignment is not losing an account.
  return [
    { label: "cameras", count: stats.cameras ?? 0 },
    { label: "NVRs", count: stats.nvrs ?? 0 },
    { label: "sites", count: stats.sites ?? 0 },
    { label: "stations", count: stats.stations ?? 0 },
    { label: "users (unassigned, not deleted)", count: stats.users ?? 0 },
  ].filter((row) => row.count > 0);
}

export default { siteService, stationService, departmentService, deleteImpact };
