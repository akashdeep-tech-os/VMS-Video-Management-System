import { useEffect } from "react";
import Hls from "hls.js";

export const useHLSPlayer = (videoRef, url) => {
  useEffect(() => {
    if (!videoRef.current || !url) return;

    let hls;
    const video = videoRef.current;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS ERROR:", data);
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [url]);
};