import { useEffect, useRef } from 'react';
import { NO_SLEEP_MP4, NO_SLEEP_WEBM } from '@/lib/noSleepVideo';

function createFallbackVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.muted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('title', 'Keep screen awake');
  video.setAttribute('aria-hidden', 'true');
  // Must stay attached and rendered (not display:none/visibility:hidden) —
  // some browsers pause truly-hidden video — but kept effectively invisible.
  Object.assign(video.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    opacity: '0.01',
    pointerEvents: 'none',
    zIndex: '-1',
  });

  const webmSource = document.createElement('source');
  webmSource.src = NO_SLEEP_WEBM;
  webmSource.type = 'video/webm';
  video.appendChild(webmSource);

  const mp4Source = document.createElement('source');
  mp4Source.src = NO_SLEEP_MP4;
  mp4Source.type = 'video/mp4';
  video.appendChild(mp4Source);

  video.addEventListener('loadedmetadata', () => {
    if (video.duration <= 1) {
      video.loop = true;
    } else {
      // The mp4 fallback runs longer than a second, so <video loop> would
      // show a visible jump at the loop point — keep rewinding near the
      // start instead, same trick NoSleep.js uses for this clip.
      video.addEventListener('timeupdate', () => {
        if (video.currentTime > 0.5) video.currentTime = Math.random();
      });
    }
  });

  return video;
}

/**
 * Keeps the screen awake while the app is open — on both desktop and
 * mobile, old and new. Uses the native Screen Wake Lock API where
 * available, but *always* also runs a muted silent-video fallback in
 * parallel rather than only when the native API is missing: the native API
 * can exist and still silently fail to actually hold the lock (notably
 * iOS's long-standing bug for apps installed via "Add to Home Screen" —
 * WebKit bug #254545 — whose fix hasn't reliably reached every iOS version
 * bands actually run). The video trick has no such caveat.
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const requestNativeLock = async () => {
      if (!('wakeLock' in navigator)) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = lock;
        // The OS can revoke the lock for reasons other than the tab going
        // hidden (e.g. battery saver) — re-acquire it if still visible.
        lock.addEventListener('release', () => {
          if (wakeLockRef.current === lock) wakeLockRef.current = null;
          if (document.visibilityState === 'visible') void requestNativeLock();
        });
      } catch (err) {
        console.error(`Failed to acquire wake lock: ${(err as Error).message}`);
      }
    };

    const releaseNativeLock = () => {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };

    const playFallbackVideo = () => {
      if (!videoRef.current) {
        videoRef.current = createFallbackVideo();
        document.body.appendChild(videoRef.current);
      }
      videoRef.current.play().catch(() => {
        // Best-effort: the native lock above is the primary mechanism, and
        // playback can be blocked in rare cases (e.g. data saver mode).
      });
    };

    const pauseFallbackVideo = () => {
      videoRef.current?.pause();
    };

    const acquire = () => {
      void requestNativeLock();
      playFallbackVideo();
    };

    const release = () => {
      releaseNativeLock();
      pauseFallbackVideo();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquire();
      else release();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    acquire();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      release();
      videoRef.current?.remove();
      videoRef.current = null;
    };
  }, []);
}
