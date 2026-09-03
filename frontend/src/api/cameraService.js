// Camera registry + streaming info (/api/v1/cameras*).
import apiClient from "./apiClient";

const cameraService = {
  list() {
    return apiClient.get("/cameras");
  },

  tree() {
    return apiClient.get("/cameras/tree");
  },

  get(id) {
    return apiClient.get(`/cameras/${id}`);
  },

  // Everything a player needs: webrtc_url / hls_url (+ sub_* for grid tiles).
  getStream(id) {
    return apiClient.get(`/cameras/${id}/stream`);
  },

  // Register a channel under an existing NVR. Requires nvr_id + rtsp_url.
  create(payload) {
    return apiClient.post("/cameras", payload);
  },

  // Register a camera directly from an RTSP URL (no ONVIF probe).
  createRtsp(payload) {
    return apiClient.post("/cameras/rtsp", payload);
  },

  // One-call ONVIF registration (standalone camera).
  createOnvif(payload) {
    return apiClient.post("/cameras/onvif", payload);
  },

  setActive(id, active) {
    return apiClient.request(`/cameras/${id}/status`, {
      method: "PATCH",
      params: { active },
    });
  },

  setType(id, cameraType) {
    return apiClient.request(`/cameras/${id}/type`, {
      method: "PATCH",
      params: { cameraType },
    });
  },

  // Move a camera between org nodes without re-registering it.
  // Partial: omit a field to leave it unchanged.
  setLocation(id, { stationId, siteId } = {}) {
    const body = {};
    if (stationId != null) body.station_id = stationId;
    if (siteId != null) body.site_id = siteId;
    return apiClient.patch(`/cameras/${id}/location`, body);
  },

  remove(id) {
    return apiClient.del(`/cameras/${id}`);
  },
};

export default cameraService;
