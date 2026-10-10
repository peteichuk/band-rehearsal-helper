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
        navigateFallback: '/band-rehearsal-helper/index.html',
        runtimeCaching: [
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
