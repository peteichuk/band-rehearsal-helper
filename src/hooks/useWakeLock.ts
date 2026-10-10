import { useEffect, useRef } from 'react';

/** Keeps the screen awake (desktop only — mobile browsers don't reliably support this yet). */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API is not supported in this browser.');
      return;
    }

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake lock is active');
      } catch (err) {
        console.error(`Failed to acquire wake lock: ${(err as Error).message}`);
      }
    };

    const releaseWakeLock = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
          console.log('Wake lock released');
        });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock();
      } else {
        releaseWakeLock();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    void requestWakeLock();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      releaseWakeLock();
    };
  }, []);
}
