import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Little Learners',
        short_name: 'Learners',
        description: 'Offline learning games for kids',
        display: 'standalone',
        orientation: 'any',
        background_color: '#fff7e6',
        theme_color: '#ffb703',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,m4a}'] },
    }),
  ],
});
