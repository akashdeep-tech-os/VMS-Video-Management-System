"""Role-based access control: the two roles and the base-rights catalog.

The system ships with exactly two roles:

* ``ADMIN`` - full access, including Settings / User Management.
* ``USER``  - operator access granted per base right (never Settings).

A "base right" is one module of the application (Dashboard, Playback, ...).
It maps 1:1 to the checkboxes in the Add/Edit User modal. Each right can
further be scoped to individual cameras ("channel rights"), stored on the
user row as ``channel_rights``.
"""

from typing import Any

ROLE_ADMIN = "ADMIN"
ROLE_USER = "USER"
ROLES: tuple[str, ...] = (ROLE_ADMIN, ROLE_USER)

# (ui_id, rights_name, label, description)
#
# ``ui_id`` is what the frontend sends in base_rights/channel_rights and what
# its modal uses as the checkbox id. ``rights_name`` is the canonical uppercase
# name used by GET /rights and GET /users/{id}/rights.
BASE_RIGHTS: tuple[tuple[str, str, str, str], ...] = (
    ("dashboard", "DASHBOARD", "Dashboard", "Access the main dashboard"),
    ("liveMonitoring", "LIVE_MONITORING", "Live Monitoring", "View live camera streams"),
    ("playback", "PLAYBACK", "Playback", "Review recorded footage"),
    ("reports", "REPORTS", "Reports", "View operational reports"),
    ("anprDashboard", "ANPR_DASHBOARD", "ANPR Dashboard", "Access the ANPR dashboard"),
    ("vehicleTracking", "VEHICLE_TRACKING", "Vehicle Tracking", "Track vehicles on the map"),
    ("blacklistVehicles", "BLACKLIST_VEHICLES", "Blacklist Vehicles", "Manage the blacklist"),
    ("anprReports", "ANPR_REPORTS", "ANPR Reports", "View ANPR reports"),
    ("faceRecognition", "FACE_RECOGNITION", "Face Recognition", "Access face recognition"),
    ("peopleCounting", "PEOPLE_COUNTING", "People Counting", "Access people counting"),
    ("lineCrossing", "LINE_CROSSING", "Line Crossing", "Access line crossing analytics"),
    ("objectDetection", "OBJECT_DETECTION", "Object Detection", "Access object detection"),
    ("ptzController", "PTZ_CONTROLLER", "PTZ Controller", "Control PTZ cameras"),
    ("settings", "SETTINGS", "Settings", "Manage settings, devices and users (Admin only)"),
)

ALL_RIGHT_IDS: tuple[str, ...] = tuple(ui_id for ui_id, *_ in BASE_RIGHTS)
RIGHT_IDS_BY_NAME: dict[str, str] = {name: ui_id for ui_id, name, *_ in BASE_RIGHTS}
RIGHT_LABELS: dict[str, str] = {ui_id: label for ui_id, _, label, _ in BASE_RIGHTS}
RIGHT_DESCRIPTIONS: dict[str, str] = {ui_id: desc for ui_id, _, _, desc in BASE_RIGHTS}

# GET /rights and GET /users/{id}/rights expose a stable 1-based numeric id per
# right (position in the catalog), which is what ``right_id`` query params use.
RIGHTS_BY_ID: dict[int, str] = {index: ui_id for index, ui_id in enumerate(ALL_RIGHT_IDS, start=1)}
RIGHT_IDS_BY_UI_ID: dict[str, int] = {ui_id: index for index, ui_id in RIGHTS_BY_ID.items()}

# Rights a freshly created USER gets when the form does not specify any.
USER_DEFAULT_RIGHT_IDS: tuple[str, ...] = (
    "dashboard",
    "liveMonitoring",
    "playback",
    "reports",
    "anprDashboard",
    "vehicleTracking",
    "blacklistVehicles",
    "anprReports",
)


def normalize_base_rights(role: str, rights: list[str] | None) -> list[str]:
    """Resolve the effective base rights for a role.

    * ADMIN always holds every right (including Settings), whatever was sent.
    * USER never holds Settings; unknown ids are dropped; an omitted/empty
      selection falls back to the default operator set.
    """
    if role == ROLE_ADMIN:
        return list(ALL_RIGHT_IDS)
    if rights is None:
        return list(USER_DEFAULT_RIGHT_IDS)
    requested = set(rights)
    selected = [ui_id for ui_id in ALL_RIGHT_IDS if ui_id in requested and ui_id != "settings"]
    return selected or list(USER_DEFAULT_RIGHT_IDS)


def normalize_channel_rights(base_rights: list[str], channel_rights: Any) -> dict[str, list[int]]:
    """Keep only camera grants for rights the user actually holds.

    A right that is present in the payload keeps its list even when empty -
    that means "no cameras", while an absent right means "not restricted to
    specific cameras". Ids are coerced to de-duplicated ints so a malformed
    payload can never poison the stored JSON.
    """
    granted: dict[str, list[int]] = {}
    raw = channel_rights if isinstance(channel_rights, dict) else {}
    for ui_id in base_rights:
        if ui_id not in raw:
            continue
        cameras = raw[ui_id]
        if not isinstance(cameras, list):
            continue
        ids: list[int] = []
        for camera_id in cameras:
            try:
                value = int(camera_id)
            except (TypeError, ValueError):
                continue
            if value > 0 and value not in ids:
                ids.append(value)
        granted[ui_id] = ids
    return granted
