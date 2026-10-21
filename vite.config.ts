import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/band-rehearsal-helper/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'docs',
    rollupOptions: {
      output: {
        // Gives each lazy-loaded locale JSON its own predictably-named chunk
        // (`locale-uk-*.js` etc.) instead of Rollup's default hash-only
        // naming, so the service worker's runtimeCaching rule below can
        // recognize and lazily cache them separately from the rest of the
        // precached app shell (see the VitePWA workbox config).
        manualChunks(id) {
          const match = /[/\\]src[/\\]locales[/\\]([a-z]+)\.json$/.exec(id);
          if (match) return `locale-${match[1]}`;
        },
      },
    },
  },
  // Binds to 0.0.0.0 instead of just localhost, so the dev server is also
  // reachable from other devices on the LAN (e.g. a phone, for testing
  // touch gestures) at http://<your-machine-ip>:5173 — printed in the
  // terminal as the "Network:" URL when `npm run dev` starts.
  server: {
    host: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    svgr({ svgrOptions: { dimensions: false } }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'images/favicon.svg',
        'images/favicon-white.svg',
        'images/apple-touch-icon.png',
      ],
      manifest: {
        name: 'Band Rehearsal Helper',
        short_name: 'BandHelper',
        // No start_url: the plugin defaults it to the base path, but that makes every
        // "Add to Home Screen" open the bare app, losing the current ?tableId=... . Omitting
        // it (vite-plugin-pwa drops undefined keys from the written JSON) makes iOS
        // Safari/Chrome fall back to the current document URL instead, so the installed
        // icon reopens whichever table was loaded when the user added it.
        start_url: undefined,
        scope: '/band-rehearsal-helper/',
        display: 'standalone',
        theme_color: '#2563eb',
        background_color: '#2563eb',
        icons: [
          {
            src: 'images/favicon.svg',
            type: 'image/svg+xml',
            sizes: 'any',
            purpose: 'any',
          },
          {
            src: 'images/icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any',
          },
          {
            src: 'images/icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Explicitly undefined, not just omitted — vite-plugin-pwa merges a
        // `navigateFallback: 'index.html'` default of its own on top of
        // whatever's (not) set here, so leaving the key out entirely still
        // left it on. With it set, workbox-build always registers its
        // NavigationRoute (precache-bound, so cache-first with no network
        // check) *before* any runtimeCaching route below, meaning it'd win
        // every navigation and make the NetworkFirst rule right below dead
        // code. The runtimeCaching entry on its own already covers
        // navigateFallback's one job (serving the shell for every
        // navigation) — see its own comment for why that's safe here.
        navigateFallback: undefined,
        // Locale chunks (locale-uk-*.js etc., see manualChunks above) are
        // deliberately NOT force-precached with the rest of the app shell —
        // that would defeat the point of lazy-loading them (every visitor
        // downloading all 7 non-English bundles upfront). The runtimeCaching
        // CacheFirst rule below caches each one only once it's actually
        // requested, which is also all a hashed filename ever needs: a
        // cache hit is permanently valid, since any future translation
        // change ships under a brand new hash/URL instead of overwriting
        // this one.
        globIgnores: ['**/locale-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/locale-[a-z]+-[\w-]+\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'locale-cache',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // The app shell itself (index.html). Precaching alone (the
            // default for everything generateSW lists) means Workbox serves
            // whatever got installed at the *last* visit straight from the
            // cache, with no network check at all — a fresh deploy only
            // shows up after an extra reload or two. Network-first instead:
            // online, always fetch the current shell (and refresh the
            // cache with it); only fall back to the cached one when the
            // network genuinely fails or is too slow to bother waiting on.
            // Safe to scope to *every* navigation here specifically because
            // routing is HashRouter-based (see App.tsx) — the only real
            // browser navigation/fetch this app ever makes is for this one
            // shell URL; every in-app "page" is a `#` fragment that never
            // reaches the network or this service worker at all.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell-cache',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Sheets song data (gviz) — not same-origin, so Workbox
            // doesn't precache it by default. Network-first with a cached
            // fallback mirrors the legacy service worker's behavior: once a
            // sheet has loaded successfully, the last good response is
            // available offline too, not just the app shell.
            urlPattern: ({ url }) =>
              url.hostname === 'docs.google.com' && url.pathname.includes('/gviz/tq'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sheet-data-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Metronome iframe document (guitarapp.com). Note: this only
            // caches the top-level page we embed — its own JS/audio assets
            // are fetched by that iframe's own browsing context, which our
            // service worker (scoped to our origin) can't see or cache.
            urlPattern: ({ url }) => url.hostname === 'guitarapp.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'metronome-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
