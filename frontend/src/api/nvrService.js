// NVR registry (/api/v1/nvrs*).
import apiClient from "./apiClient";

const nvrService = {
  list() {
    return apiClient.get("/nvrs");
  },

  get(id) {
    return apiClient.get(`/nvrs/${id}`);
  },

  create(payload) {
    return apiClient.post("/nvrs", payload);
  },

  // Partial metadata/org update. Credentials and ip/rtsp_port are NOT editable
  // here (use updateCredentials; the endpoint is the device's identity).
  //
  // Setting org ids matters twice over: it places the NVR itself, AND channel
  // discovery inherits department/station/site from this row, so future
  // discovered channels land in the right place automatically.
  //
  // cascade: true also moves this NVR's EXISTING cameras onto the same nodes;
  // the response's cameras_moved says how many (null when no cascade ran).
  update(id, { name, brandName, modelNumber, noOfChannels, camerasConnected,
               departmentId, stationId, siteId } = {}, { cascade = false } = {}) {
    const body = {};
    if (name != null) body.name = name;
    if (brandName != null) body.brand_name = brandName;
    if (modelNumber != null) body.model_number = modelNumber;
    if (noOfChannels != null) body.no_of_channels = noOfChannels;
    if (camerasConnected != null) body.cameras_connected = camerasConnected;
    if (departmentId != null) body.department_id = departmentId;
    if (stationId != null) body.station_id = stationId;
    if (siteId != null) body.site_id = siteId;
    return apiClient.request(`/nvrs/${id}`, {
      method: "PATCH",
      body,
      params: { cascade: cascade ? "true" : undefined },
    });
  },

  // Delete an NVR AND every camera under it. Unconditional — there is no
  // confirmation flag, matching the department/station/site deletes. Confirm
  // in the UI before calling: this is not recoverable.
  remove(id) {
    return apiClient.del(`/nvrs/${id}`);
  },

  updateCredentials(id, { username, plainPassword }) {
    return apiClient.request(`/nvrs/${id}/credentials`, {
      method: "PATCH",
      params: { username, plainPassword },
    });
  },

  // Discover channels on an already-registered NVR.
  // `brand` is a vendor hint for the RTSP convention loop (e.g. "cpplus",
  // "hikvision", "hawkvision") — it reorders which URL convention is tried
  // first, and is the only way to reach the Hawkvision convention, which is
  // not attempted by default. Omit to use the brand stored on the NVR row.
  discoverCameras(id, { method, maxChannels, startChannel, zone, brand } = {}) {
    return apiClient.post(`/nvrs/${id}/discover-cameras`, {
      method,
      max_channels: maxChannels,
      start_channel: startChannel,
      zone,
      brand,
    });
  },

  // ID-LESS discovery: the backend registers-or-finds the NVR from `nvrBody`
  // (id generated on store), then discovers channels. preview=true is a dry run;
  // preview=false actually registers the channels.
  discoverForConnection(
    nvrBody,
    { preview = false, method, maxChannels, zone, stationId, siteId, rewriteRtspPort, brand } = {},
  ) {
    return apiClient.request("/nvrs/discover-cameras", {
      method: "POST",
      body: nvrBody,
      params: {
        method,
        max_channels: maxChannels,
        zone,
        station_id: stationId,
        site_id: siteId,
        preview: preview ? "true" : "false",
        rewrite_rtsp_port: rewriteRtspPort ? "true" : undefined,
        // Vendor hint for the RTSP convention loop. Redundant when the NVR body
        // already carries brand_name (it is persisted before the real run), but
        // it also reaches the PREVIEW path, where nothing is stored.
        brand: brand || undefined,
      },
      headers: { "X-Preview": preview ? "true" : "false" },
    });
  },

  channels(id) {
    return apiClient.get(`/nvrs/${id}/channels`);
  },
};

export default nvrService;
