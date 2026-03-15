import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

const target = process.env.VITE_BUILD_TARGET // 'app' | 'panel' | undefined (dev)

const pwaPlugin = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.png', 'pwa-192x192.svg'],
  manifest: {
    name: 'Usta Go - Ev Hizmetleri',
    short_name: 'Usta Go',
    description: 'Güvenilir ev hizmetleri platformu. Temizlik, tadilat, tamirat ve daha fazlası.',
    theme_color: '#3B82F6',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    categories: ['business', 'lifestyle'],
    icons: [
      {
        src: '/pwa-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/pwa-192x192.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/usta-go-api\.onrender\.com\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
})

export default defineConfig({
  plugins: [
    react(),
    // PWA sadece app build'ında aktif (panel'de gereksiz)
    ...(target !== 'panel' ? [pwaPlugin] : []),
  ],

  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  build: {
    outDir: target === 'panel' ? 'dist-panel' : 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: target === 'panel'
        ? resolve(__dirname, 'panel.html')
        : resolve(__dirname, 'index.html'),
      output: {
        // Vendor elle bölünmüyor — circular dependency + React undefined hatasını önler
        // Vite kendi otomatik chunk stratejisini kullanır
        manualChunks(id) {
          if (
            id.includes('node_modules/socket.io-client') ||
            id.includes('node_modules/engine.io-client')
          ) {
            return 'vendor-socket'
          }
          if (id.includes('node_modules/@capacitor')) {
            return 'vendor-capacitor'
          }
        },
      },
    },
  },

  define: {
    'process.env.VITE_APP_CAPACITOR': JSON.stringify(true),
  },
})
