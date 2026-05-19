import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10MB to accommodate high-res assets
        },
        manifest: {
          name: 'EFADO Hubs Connect',
          short_name: 'EFADO',
          description: 'Universal Networking, Strategic Advertising & Sovereign Mining Hub',
          theme_color: '#4f46e5',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'https://picsum.photos/seed/efado-icon-192/192/192',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/seed/efado-icon-512/512/512',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/seed/efado-icon-mask/512/512',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          categories: ['business', 'finance', 'social'],
          shortcuts: [
            {
              name: 'Advertising Hub',
              short_name: 'Ads',
              description: 'Place ads globally',
              url: '/?hub=ADVERTISING',
              icons: [{ src: 'https://picsum.photos/seed/ads-icon/96/96', sizes: '96x96' }]
            },
            {
              name: 'Mining Core',
              short_name: 'Mining',
              description: 'Start mining now',
              url: '/?hub=MINING',
              icons: [{ src: 'https://picsum.photos/seed/mine-icon/96/96', sizes: '96x96' }]
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
