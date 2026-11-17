import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FAQ_URL = 'https://peteichuk.github.io/band-rehearsal-helper/faq.html';
const GITHUB_URL = 'https://github.com/peteichuk/band-rehearsal-helper';

/**
 * Drops the service worker and every cache it filled, then reloads — the
 * fix for a stuck old version on an installed PWA. Only touches the app's
 * own cached files: favorites, setlists, notes and the like live in
 * localStorage, which this never reads or clears.
 */
async function forceRefreshApp() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
  }
  window.location.reload();
}

export function SettingsAboutSection() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void forceRefreshApp().catch(() => setIsRefreshing(false));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Band Rehearsal Helper <span className="text-muted-foreground">v{__APP_VERSION__}</span>
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <a
          href={FAQ_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('FAQ')}
          <ExternalLink className="size-3.5" />
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
        >
          GitHub
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      <div className="space-y-1">
        <Button type="button" variant="outline" disabled={isRefreshing} onClick={handleRefresh}>
          <RefreshCw data-icon="inline-start" className={isRefreshing ? 'animate-spin' : ''} />
          {t('Update the app')}
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t(
            'Clears the cached app files and reloads, to get the newest version. Your songs data and local settings are kept.'
          )}
        </p>
      </div>
    </div>
  );
}
