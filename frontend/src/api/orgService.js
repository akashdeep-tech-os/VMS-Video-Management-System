// Org hierarchy: sites / stations (/api/v1/*).
import apiClient from "./apiClient";

export const siteService = {
  list: (params) => apiClient.get("/sites", params),
  get: (id, params) => apiClient.get(`/sites/${id}`, params),
  create: (body) => apiClient.post("/sites", body),
  update: (id, body) => apiClient.patch(`/sites/${id}`, body),
  remove: (id) => apiClient.del(`/sites/${id}`),
};

export const stationService = {
  list: (params) => apiClient.get("/stations", params),
  get: (id, params) => apiClient.get(`/stations/${id}`, params),
  create: (body) => apiClient.post("/stations", body),
  update: (id, body) => apiClient.patch(`/stations/${id}`, body),
  remove: (id) => apiClient.del(`/stations/${id}`),
};

export async function deleteImpact(type, id) {
  const svc = type === "station" ? stationService : siteService;

  let stats;
  try {
    const node = await svc.get(id, { expand: "stats" });
    stats = node?.stats;
  } catch {
    return [];
  }
  if (!stats) return [];

  return [
    { label: "cameras", count: stats.cameras ?? 0 },
    { label: "NVRs", count: stats.nvrs ?? 0 },
    { label: "sites", count: stats.sites ?? 0 },
    { label: "stations", count: stats.stations ?? 0 },
    { label: "users (unassigned, not deleted)", count: stats.users ?? 0 },
  ].filter((row) => row.count > 0);
}

export default { siteService, stationService, deleteImpact };
