import { http, HttpResponse } from "msw";

// The app now talks to the real backend (/api/v1/*) for auth, users, dashboard,
// system health, cameras, nvrs, org and PTZ. The ONLY endpoint kept mocked is
// the device "test connection" probe, which has no backend equivalent yet.
// Everything else falls through to the network (worker uses onUnhandledRequest: "bypass").
export const handlers = [
  http.post("*/devices/test-connection", async ({ request }) => {
    const body = await request.json();
    const { ip, connectionType } = body;

    if (!ip) {
      return HttpResponse.json(
        { message: "IP address is required" },
        { status: 400 },
      );
    }

    // Simulate: wrong credentials.
    if (ip === "192.168.1.99") {
      return HttpResponse.json({
        reachable: false,
        protocol: null,
        channelCount: null,
        onvifPort: null,
        videoCodec: null,
        credentialsRejected: true,
        message: "Device responded but credentials were rejected.",
      });
    }

    // Simulate: device not reachable (only local-network IPs "respond").
    const isLocalNetwork =
      ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.");
    if (!isLocalNetwork) {
      return HttpResponse.json({
        reachable: false,
        protocol: null,
        channelCount: null,
        onvifPort: null,
        videoCodec: null,
        credentialsRejected: false,
        message: `No device found at ${ip}. Check the IP address and network.`,
      });
    }

    // Simulate: device reachable.
    const isNvr = connectionType === "ONBRAND";
    return HttpResponse.json({
      reachable: true,
      protocol: connectionType === "RTSP" ? "RTSP" : "ONVIF",
      channelCount: isNvr ? 16 : 1,
      onvifPort: connectionType === "RTSP" ? null : 80,
      videoCodec: "H.265",
      credentialsRejected: false,
      message: `Device at ${ip} is reachable via ${connectionType === "RTSP" ? "RTSP" : "ONVIF"}.`,
    });
  }),
];
