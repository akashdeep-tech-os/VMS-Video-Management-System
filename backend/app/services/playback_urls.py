"""Vendor-specific recorded-playback RTSP URL builders.

Live-stream URLs are mostly ONVIF-standard (``GetStreamUri``), so any ONVIF
NVR works for live view. Recorded playback is different: every manufacturer
exposes recordings under its own RTSP path with its own time format:

  Dahua / CP Plus family:
    /cam/playback?channel=N&subtype=0
        &starttime=YYYY_MM_DD_HH_MM_SS&endtime=YYYY_MM_DD_HH_MM_SS
  Hikvision family (Hikvision, Prama, EZVIZ-style OEMs):
    /Streaming/tracks/{N*100+1}?starttime=YYYYMMDDTHHMMSSZ&endtime=...
  e-Vision (and Diversity/Avycon-style OEMs) - NVR/DVR:
    /rtsp/playback?channel=N&subtype=0
        &starttime=YYYY-MM-DDTHH:MM:SSZ&endtime=...&localtime=true
  e-Vision IPC ("other platforms"):
    /cam/playback?channel=N&starttime=YYYY-MM-DDTHH:MM:SSZ&endtime=...
  Axis:
    /axis-media/media.amp?camera=N&event=1&starttime=...&endtime=...

Brand tables below map both the operator-selected brand and the live RTSP
path pattern to one of these families, so OEM recorders (CP Plus, Prama,
Hi-Focus, …) pick the right parent convention automatically.
"""

import re
from datetime import datetime

# ---- brand / path -> vendor family -----------------------------------------

# Normalized brand-name fragments -> vendor family key.
BRAND_FAMILIES: dict[str, str] = {
    # Dahua OEMs
    "dahua": "dahua",
    "dahuasecurity": "dahua",
    "dahuaglobal": "dahua",
    "cpplus": "dahua",
    "cpplusworldwide": "dahua",
    "lorec": "dahua",
    "lorex": "dahua",
    "imou": "dahua",
    "consistent": "dahua",
    "hifocus": "dahua",
    "hifocuscctv": "dahua",
    # Hikvision OEMs
    "hikvision": "hikvision",
    "prama": "hikvision",
    "pramaindia": "hikvision",
    "hawkvision": "hikvision",
    "ezviz": "hikvision",
    # e-Vision
    "evision": "e_vision",
    "evisiondigital": "e_vision",
    "327de": "e_vision",
    # Axis
    "axis": "axis",
    "axiscommunications": "axis",
}

# Live-RTSP-path fragments -> vendor family (used when the brand is unknown,
# e.g. ONVIF-probed cameras whose manufacturer string is unusual).
PATH_MARKERS: tuple[tuple[str, str], ...] = (
    ("realmonitor", "dahua"),
    ("cam/playback", "dahua"),
    ("streaming/channels", "hikvision"),
    ("streaming/tracks", "hikvision"),
    ("/psia/", "hikvision"),
    ("/isapi/", "hikvision"),
    ("rtsp/streaming", "e_vision"),
    ("rtsp/playback", "e_vision"),
    ("axis-media", "axis"),
)


def normalize_brand(text: str | None) -> str:
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def detect_vendor(live_path: str | None, *brand_texts: str | None) -> str:
    """Resolve the playback family: brand first, then the live-path pattern."""
    for text in brand_texts:
        key = normalize_brand(text)
        if key in BRAND_FAMILIES:
            return BRAND_FAMILIES[key]
        for fragment, family in BRAND_FAMILIES.items():
            if fragment in key:
                return family
    path = (live_path or "").lower()
    for marker, family in PATH_MARKERS:
        if marker in path:
            return family
    return "generic"


# ---- time formats -----------------------------------------------------------


def _fmt_dahua(dt: datetime) -> str:
    return dt.strftime("%Y_%m_%d_%H_%M_%S")


def _fmt_iso_colon(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _fmt_iso_compact(dt: datetime) -> str:
    return dt.strftime("%Y%m%dT%H%M%SZ")


# ---- per-vendor playback path builders --------------------------------------


def _dahua_playback_path(channel: int, start: datetime, end: datetime) -> str:
    return (
        f"/cam/playback?channel={channel}&subtype=0"
        f"&starttime={_fmt_dahua(start)}&endtime={_fmt_dahua(end)}"
    )


def _hikvision_playback_path(channel: int, start: datetime, end: datetime) -> str:
    # Track ID = channel * 100 + stream number (1 = main stream).
    track = channel * 100 + 1
    return (
        f"/Streaming/tracks/{track}"
        f"?starttime={_fmt_iso_compact(start)}&endtime={_fmt_iso_compact(end)}"
    )


def _evision_nvr_playback_path(channel: int, start: datetime, end: datetime) -> str:
    # localtime=true makes the recorder treat the times as device-local,
    # matching what the operator types into the playback form.
    return (
        f"/rtsp/playback?channel={channel}&subtype=0"
        f"&starttime={_fmt_iso_colon(start)}&endtime={_fmt_iso_colon(end)}"
        f"&localtime=true"
    )


def _evision_ipc_playback_path(channel: int, start: datetime, end: datetime) -> str:
    return (
        f"/cam/playback?channel={channel}"
        f"&starttime={_fmt_iso_colon(start)}&endtime={_fmt_iso_colon(end)}"
    )


def _axis_playback_path(channel: int, start: datetime, end: datetime) -> str:
    return (
        f"/axis-media/media.amp?camera={channel}&event=1"
        f"&starttime={_fmt_iso_colon(start)}&endtime={_fmt_iso_colon(end)}"
    )


def _generic_playback_path(live_path: str, channel: int, start: datetime, end: datetime) -> str:
    """Best effort for unknown vendors: keep the old behaviour.

    Dahua-style live paths are converted to /cam/playback; anything else gets
    the time window appended to its stored live path.
    """
    if "realmonitor" in live_path:
        return _dahua_playback_path(channel, start, end)
    window = f"starttime={_fmt_dahua(start)}&endtime={_fmt_dahua(end)}"
    separator = "&" if "?" in live_path else "?"
    return f"{live_path}{separator}{window}"


# ---- public API --------------------------------------------------------------


def channel_from_path(live_path: str | None) -> int | None:
    path = live_path or ""
    match = re.search(r"channel=(\d+)", path)
    if match:
        return int(match.group(1))
    # Hikvision-style: /Streaming/Channels/{channel}01 -> channel
    match = re.search(r"/Streaming/Channels/(\d+)0[12]/?$", path)
    if match:
        return int(match.group(1))
    return None


def build_playback_path(
    vendor: str,
    live_path: str | None,
    channel: int,
    start: datetime,
    end: datetime,
    *,
    is_nvr_channel: bool = True,
) -> str:
    """Return the RTSP path (no host) that serves the recorded window."""
    if vendor == "dahua":
        return _dahua_playback_path(channel, start, end)
    if vendor == "hikvision":
        return _hikvision_playback_path(channel, start, end)
    if vendor == "e_vision":
        if is_nvr_channel:
            return _evision_nvr_playback_path(channel, start, end)
        return _evision_ipc_playback_path(channel, start, end)
    if vendor == "axis":
        return _axis_playback_path(channel, start, end)
    return _generic_playback_path(live_path or "", channel, start, end)
