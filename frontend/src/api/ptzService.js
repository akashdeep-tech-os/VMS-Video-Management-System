// PTZ control for a camera (/api/v1/cameras/{id}/ptz*).
import apiClient from "./apiClient";

const ptzService = {
  // pan/tilt/zoom velocities in [-1, 1].
  move(id, { pan = 0, tilt = 0, zoom = 0 }) {
    return apiClient.post(`/cameras/${id}/ptz/move`, { pan, tilt, zoom });
  },

  stop(id) {
    return apiClient.post(`/cameras/${id}/ptz/stop`);
  },

  presets(id) {
    return apiClient.get(`/cameras/${id}/ptz/presets`);
  },

  createPreset(id, name) {
    return apiClient.post(`/cameras/${id}/ptz/presets`, { name });
  },

  gotoPreset(id, presetToken) {
    return apiClient.post(`/cameras/${id}/ptz/presets/${presetToken}/goto`);
  },

  deletePreset(id, presetToken) {
    return apiClient.del(`/cameras/${id}/ptz/presets/${presetToken}`);
  },

  goHome(id) {
    return apiClient.post(`/cameras/${id}/ptz/home`);
  },

  setHome(id) {
    return apiClient.put(`/cameras/${id}/ptz/home`);
  },
};

export default ptzService;
