// Shared loader for the per-user, per-right camera tree that backs the Live
// Monitoring and Playback sidebars. Resolves the right's id from the rights
// catalog by name, then fetches GET /users/{id}/accessible-cameras?right_id=.
import userService, { currentUserId } from "./userService";

// Right names (rights_name in the backend rights catalog) whose accessible
// camera trees drive the video sidebars. These must match the canonical set in
// the backend's RightsCatalogInitializer.BASE_RIGHTS (which prunes the old
// Flyway seed, so e.g. the playback right is "PLAYBACK", not "PLAYBACK_VIEW").
export const RIGHT_LIVE_MONITORING = "LIVE_MONITORING";
export const RIGHT_PLAYBACK = "PLAYBACK";

// Convert the backend response (either flat camera list or station tree) into
// a flat { cameras, meta } shape the sidebar consumes.
export function treeToGroups(resp) {
  const cameras = [];
  const meta = {};

  // New flat format: array of camera objects
  if (Array.isArray(resp)) {
    resp.forEach((cam) => {
      cameras.push(cam.name);
      meta[cam.name] = {
        id: cam.camera_id,
        status: cam.online ? "online" : "offline",
        cameraType: cam.camera_type,
      };
    });
    return { cameras, meta };
  }

  // Legacy station-tree format: { stations: [...] }
  const stations = resp?.stations || [];
  stations.forEach((st) => {
    (st.sites || []).forEach((site) => {
      (site.cameras || []).forEach((cam) => {
        cameras.push(cam.name);
        meta[cam.name] = {
          id: cam.camera_id,
          status: cam.online ? "online" : "offline",
          cameraType: cam.camera_type,
        };
      });
    });
  });

  return { cameras, meta };
}

// Resolve + fetch the accessible-camera tree for the logged-in user and the
// given right name. Returns { cameras, meta } or null when unauthenticated /
// the right isn't in the catalog. Throws on network/API errors.
export async function loadAccessibleCameras(rightName) {
  const userId = currentUserId();
  if (!userId) return null;
  const rights = await userService.getRights();
  const right = (rights || []).find((r) => r.rights_name === rightName);
  if (!right) return null;
  const resp = await userService.getAccessibleCameras(userId, right.id);
  return treeToGroups(resp);
}
