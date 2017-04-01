const fps = 30;
const interval = 1000 / fps;

export default function debounceVideo(cb, videoElement) {
  const ENOUGH_DATA = videoElement.HAVE_ENOUGH_DATA;
  let start = Date.now() - interval;
  let now;

  const debounced = () => {
    now = Date.now();
    const elapsed = now - start;

    if (elapsed > interval) {
      const isVideoReady = videoElement.readyState === ENOUGH_DATA;
      const videoHasWidth = videoElement.videoWidth > 0;

      if (isVideoReady && videoHasWidth) {
        start = now;
        setTimeout(cb, interval);
      } else {
        setTimeout(debounced, interval);
      }
    }
  };

  return debounced;
}
