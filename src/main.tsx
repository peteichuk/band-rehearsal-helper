import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import i18n, { loadLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';

const queryClient = new QueryClient();

// Blocks first paint on loading just the one locale actually needed (`i18n`
// already resolved `lng` synchronously during its own init, above) — a
// no-op, zero-network wait for English (see i18n.ts), and for anything
// else a single small chunk that's cached permanently after this first
// fetch (see vite.config.ts). Without this, the first render would briefly
// show the English fallback before the translation bundle arrived.
void loadLocale(i18n.language as Locale).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
});
