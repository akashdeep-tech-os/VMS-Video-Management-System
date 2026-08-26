// Device "test connection" probe.
//
// NOTE: the backend has no test-connection endpoint yet, so this call is served
// by the MSW mock in src/mocks/handlers.js (matched on /api/v1/devices/test-connection).
// It still goes through apiClient so headers/error handling stay consistent.
import apiClient from "./apiClient";

const deviceService = {
  /**
   * Asks the edge server whether a device is reachable with these credentials.
   * Resolves for both outcomes — read `reachable`. Only a genuinely failed call
   * (bad request, server error) rejects.
   *
   * @returns {Promise<{reachable:boolean, protocol:?string, channelCount:?number,
   *   onvifPort:?number, videoCodec:?string, credentialsRejected:boolean, message:string}>}
   */
  async testConnection(payload) {
    return apiClient.post("/devices/test-connection", payload);
  },
};

export default deviceService;
