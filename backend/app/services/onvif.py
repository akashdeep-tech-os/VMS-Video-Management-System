"""ONVIF probing service.

All blocking socket/ONVIF work happens in *_sync helpers executed via
``asyncio.to_thread`` so the FastAPI event loop never blocks, even while
probing 100 cameras.
"""

import asyncio
import logging
import re
import socket
from dataclasses import dataclass
from urllib.parse import quote, urlparse

logger = logging.getLogger(__name__)

TCP_TIMEOUT = 2.0
PROBE_TIMEOUT = 10.0
RTSP_PROBE_TIMEOUT = 12.0

# Common vendor RTSP paths probed when ONVIF GetStreamUri fails.
# Sub-streams (102 / subtype=1 / _sub) are listed first on purpose: for load
# testing 100 cameras we prefer the low-bandwidth secondary stream.
FALLBACK_RTSP_PATHS = [
    "/Streaming/Channels/102",
    "/Streaming/Channels/101",
    "/cam/realmonitor?channel=1&subtype=1",
    "/cam/realmonitor?channel=1&subtype=0",
    "/rtsp/streaming?channel=1&subtype=1",
    "/rtsp/streaming?channel=1&subtype=0",
    "/h264Preview_01_sub",
    "/h264Preview_01_main",
    "/stream2",
    "/stream1",
    "/live",
    "/media/video1",
    "/ch01",
]


@dataclass
class OnvifProbeResult:
    manufacturer: str | None = None
    model: str | None = None
    firmware: str | None = None
    serial: str | None = None
    rtsp_path: str | None = None
    rtsp_sub_path: str | None = None
    rtsp_source: str = "none"  # onvif | fallback | none
    fail_reason: str | None = None  # unreachable | auth | timeout | onvif | rtsp
    detail: str | None = None

    @property
    def ok(self) -> bool:
        return self.fail_reason is None


def build_rtsp_url(host: str, port: int, path: str | None, username: str, password: str) -> str:
    """Build an RTSP URL with URL-encoded credentials for MediaMTX source."""
    creds = ""
    if username or password:
        creds = f"{quote(username, safe='')}:{quote(password, safe='')}@"
    return f"rtsp://{creds}{host}:{port}{path or '/'}"


def derive_sub_path(main_path: str | None) -> str | None:
    """Derive the sub-stream RTSP path from a main-stream path.

    Known patterns:
      Dahua / CP Plus: /cam/realmonitor?channel=N&subtype=0  ->  subtype=1
      Hikvision:       /Streaming/Channels/N01               ->  N02
      e-Vision:        /rtsp/streaming?channel=N&subtype=0   ->  subtype=1
    Returns None for unrecognized paths (caller should fall back to main).
    """
    if not main_path:
        return None

    # Dahua / CP Plus / e-Vision: subtype=0 -> subtype=1
    if "subtype=0" in main_path:
        return main_path.replace("subtype=0", "subtype=1")

    # Hikvision: channel path ending in 01 -> 02
    m = re.search(r"(/Streaming/Channels/\d+)01$", main_path)
    if m:
        return m.group(1) + "02"

    return None


def derive_mobile_path(main_path: str | None) -> str | None:
    """Derive the mobile-stream RTSP path (e-Vision subtype=2) from a main path.

    e-Vision NVRs expose three tiers: subtype=0 (main), subtype=1 (sub) and
    subtype=2 (mobile/low-bandwidth). Returns None for paths without a
    subtype= query (no mobile tier to derive).
    """
    if not main_path or "subtype=" not in main_path:
        return None
    if "subtype=0" in main_path:
        return main_path.replace("subtype=0", "subtype=2")
    if "subtype=1" in main_path:
        return main_path.replace("subtype=1", "subtype=2")
    return None


def _tcp_reachable(host: str, port: int, timeout: float = TCP_TIMEOUT) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _preferred_profile(profiles):
    """Pick the profile with the lowest resolution (secondary stream)."""
    def _height(profile):
        enc = getattr(profile, "VideoEncoderConfiguration", None)
        res = getattr(enc, "Resolution", None) if enc else None
        return getattr(res, "Height", None) or 999999

    return min(profiles, key=_height) if profiles else None


def _stream_uri_path(media, profile) -> str | None:
    """Resolve the RTSP URI for a profile and return only its path + query."""
    try:
        request = media.create_type("GetStreamUri")
        request.ProfileToken = profile.token
        request.StreamSetup = {"Stream": "RTP-Unicast", "Transport": {"Protocol": "RTSP"}}
        response = media.GetStreamUri(request)
    except Exception:
        # Some devices are picky about the request object shape.
        try:
            response = media.GetStreamUri({"Stream": "RTP-Unicast", "Transport": {"Protocol": "RTSP"}}, profile.token)
        except Exception as exc:
            logger.debug("GetStreamUri failed for profile %s: %s", profile.token, exc)
            return None
    uri = getattr(response, "Uri", None)
    if not uri:
        return None
    parsed = urlparse(uri)
    return parsed.path + (f"?{parsed.query}" if parsed.query else "")


def _probe_onvif_sync(host, onvif_port, rtsp_port, username, password) -> OnvifProbeResult:
    from onvif import ONVIFCamera

    cam = ONVIFCamera(host, onvif_port, username, password)
    dev = cam.create_devicemgmt_service()
    info = dev.GetDeviceInformation()
    media = cam.create_media_service()
    profiles = media.GetProfiles() or []
    profile = _preferred_profile(profiles)
    rtsp_path = _stream_uri_path(media, profile) if profile is not None else None
    return OnvifProbeResult(
        manufacturer=getattr(info, "Manufacturer", None) or None,
        model=getattr(info, "Model", None) or None,
        firmware=str(getattr(info, "FirmwareVersion", "") or "") or None,
        serial=getattr(info, "SerialNumber", None) or None,
        rtsp_path=rtsp_path,
        rtsp_sub_path=derive_sub_path(rtsp_path),
        rtsp_source="onvif" if rtsp_path else "none",
    )


def _rtsp_options_ok(host, port, path, username, password) -> bool:
    url = build_rtsp_url(host, port, path, username, password)
    try:
        with socket.create_connection((host, port), timeout=TCP_TIMEOUT) as sock:
            sock.settimeout(TCP_TIMEOUT)
            sock.sendall(f"OPTIONS {url} RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: load-test\r\n\r\n".encode())
            response = sock.recv(4096).decode("utf-8", errors="ignore")
            return "200 OK" in response
    except OSError:
        return False


def _probe_rtsp_sync(host, rtsp_port, username, password) -> str | None:
    for path in FALLBACK_RTSP_PATHS:
        if _rtsp_options_ok(host, rtsp_port, path, username, password):
            return path
    return None


def _classify_failure(exc: Exception) -> str:
    message = str(exc).lower()
    if any(term in message for term in ("unauthorized", "not authorized", "authorization", "401", "credentials")):
        return "auth"
    return "onvif"


async def probe_camera(host: str, onvif_port: int, rtsp_port: int, username: str, password: str) -> OnvifProbeResult:
    """Validate an ONVIF camera and resolve its RTSP stream path.

    Fast path: unreachable IPs fail on the TCP check (< ~3 s).
    """
    if not await asyncio.to_thread(_tcp_reachable, host, onvif_port):
        return OnvifProbeResult(fail_reason="unreachable", detail=f"No TCP response on ONVIF port {onvif_port}")

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(_probe_onvif_sync, host, onvif_port, rtsp_port, username, password),
            timeout=PROBE_TIMEOUT,
        )
    except asyncio.TimeoutError:
        return OnvifProbeResult(fail_reason="timeout", detail="ONVIF device did not respond in time")
    except Exception as exc:
        logger.warning("ONVIF probe failed for %s:%s: %s", host, onvif_port, exc)
        return OnvifProbeResult(fail_reason=_classify_failure(exc), detail=str(exc)[:500])

    if result.rtsp_path:
        return result

    # ONVIF works but returned no stream URI - probe well-known vendor paths.
    try:
        path = await asyncio.wait_for(
            asyncio.to_thread(_probe_rtsp_sync, host, rtsp_port, username, password), timeout=RTSP_PROBE_TIMEOUT
        )
    except asyncio.TimeoutError:
        path = None

    if path:
        result.rtsp_path = path
        result.rtsp_sub_path = derive_sub_path(path)
        result.rtsp_source = "fallback"
        return result

    result.fail_reason = "rtsp"
    result.detail = "ONVIF device reached, but no RTSP stream URL could be resolved"
    return result


FAIL_MESSAGES = {
    "unreachable": "Camera is not reachable. Check the IP address and ONVIF port.",
    "auth": "ONVIF authentication failed. Check the username and password.",
    "timeout": "ONVIF device timed out. Check the ONVIF port and firewall settings.",
    "onvif": "Could not communicate with the ONVIF device. Make sure ONVIF is enabled on the camera.",
    "rtsp": "Camera connected via ONVIF, but no RTSP stream URL was found. Check the RTSP port.",
}
