import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const version = env.VITE_APP_VERSION || process.env.npm_package_version || '1.0.0';
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/app-icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
        manifest: {
          name: 'Bem pro Goiás — Campo',
          short_name: 'Bem pro Goiás',
          description: 'Gestão de campanha e cadastro offline de eleitores.',
          id: '/',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait-primary',
          background_color: '#ffffff',
          theme_color: '#1f6b34',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          runtimeCaching: [{
            urlPattern: /^https:\/\/[^/]*tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }]
        },
        devOptions: { enabled: true }
      })
    ],
    define: { __APP_VERSION__: JSON.stringify(version) }
  };
});
