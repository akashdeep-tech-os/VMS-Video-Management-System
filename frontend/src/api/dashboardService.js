// Dashboard aggregates (/api/v1/dashboard*).
import apiClient from "./apiClient";

const dashboardService = {
  // KPI cards only.
  getSummary() {
    return apiClient.get("/dashboard/summary");
  },

  // Per-station camera counts for the bar charts.
  getCameraStats(params) {
    return apiClient.get("/dashboard/camera-stats", params);
  },

  // Map markers + online/offline summary. Supports status/station/search/bbox filters.
  getMap(params) {
    return apiClient.get("/dashboard/map", params);
  },

  // Aggregator: { summary, camera_stats } in one call.
  getDashboard(params) {
    return apiClient.get("/dashboard", params);
  },
};

export default dashboardService;
