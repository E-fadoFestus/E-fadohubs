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
              src: '/efado_logo_192.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: '/efado_logo_512.jpg',
              sizes: '512x512',
              type: 'image/jpeg'
            },
            {
              src: '/efado_logo_512.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
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
               icons: [{ src: '/efado_logo_192.jpg', sizes: '96x96', type: 'image/jpeg' }]
            },
            {
               name: 'Mining Core',
               short_name: 'Mining',
               description: 'Start mining now',
               url: '/?hub=MINING',
               icons: [{ src: '/efado_logo_192.jpg', sizes: '96x96', type: 'image/jpeg' }]
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
