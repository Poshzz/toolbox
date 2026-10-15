import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// base './' + HashRouter => ใช้กับ GitHub Pages ได้ทุก subpath โดยไม่ต้องแก้ config
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'pwa-180.png', 'pwa-192.png', 'pwa-512.png', 'pwa-maskable-512.png'],
      manifest: {
        name: 'Toolbox — กล่องเครื่องมือออนไลน์',
        short_name: 'Toolbox',
        description: 'รวมเครื่องมือใช้บ่อย ทำงานในเบราว์เซอร์ 100%',
        lang: 'th',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#f4edde',
        background_color: '#f4edde',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
