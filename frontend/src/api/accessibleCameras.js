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

// Convert the backend AccessibleCamerasResponse (Station -> Site -> Camera,
// snake_case) into the sidebar tree shape plus a name-keyed metadata lookup.
export function treeToGroups(resp) {
  const stations = resp?.stations || [];
  const groups = [];
  const meta = {};

  stations.forEach((st) => {
    const sites = (st.sites || []).map((site) => {
      const cameras = (site.cameras || []).map((cam) => {
        meta[cam.name] = {
          id: cam.camera_id,
          group: st.station_name,
          subGroup: site.site_name,
          status: cam.online ? "online" : "offline",
          cameraType: cam.camera_type,
        };
        return cam.name;
      });
      return { name: site.site_name, cameras };
    });
    groups.push({ name: st.station_name, sites });
  });

  return { groups, meta };
}

// Resolve + fetch the accessible-camera tree for the logged-in user and the
// given right name. Returns { groups, meta } or null when unauthenticated /
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
