(() => {
  let wakeLock = null;

  // Request wake lock
  async function requestWakeLock() {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake lock is active');
    } catch (err) {
      console.error(`Failed to acquire wake lock: ${err.message}`);
    }
  }

  // Release wake lock
  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().then(() => {
        wakeLock = null;
        console.log('Wake lock released');
      });
    }
  }

  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestWakeLock().then();
    } else {
      releaseWakeLock();
    }
  });

  // Request wake lock when the page loads
  if ('wakeLock' in navigator) {
    requestWakeLock().then();
  } else {
    console.warn('Wake Lock API is not supported in this browser.');
  }
})();
