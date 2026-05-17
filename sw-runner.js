// service worker runner

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(registration => {
        console.log('SW registered, scope:', registration.scope);
      })
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  });
}

window.addEventListener('online', () => {
  if (document.getElementById('update-notification')) return;

  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.className =
    'fixed min-w-[300px] bottom-4 right-0 -translate-x-1/2 text-white px-3  z-[100] animate-bounce';

  notification.innerHTML = `
    <div class="flex items-center gap-3 bg-blue-600/90 px-6 py-3 rounded-full shadow-2xl">
      <span class="text-sm font-medium">The internet is back. Update the song list?</span>
      <button id="confirmUpdateBtn" class="bg-white text-blue-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors">
        YES
      </button>
      <button id="closeNotificationBtn" class="text-white hover:text-gray-200">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  document.getElementById('confirmUpdateBtn').addEventListener('click', () => {
    notification.remove();
    window.location.reload();
  });

  document.getElementById('closeNotificationBtn').addEventListener('click', () => {
    notification.remove();
  });

  setTimeout(() => {
    notification.remove();
  }, 5000);
});

window.addEventListener('offline', () => {
  const notification = document.getElementById('update-notification');
  if (notification) notification.remove();
});
