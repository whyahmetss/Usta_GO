/**
 * Usta Go — Admin Panel Vite Config
 *
 * `npm run dev:admin`   → port 5174'te admin paneli başlatır
 * `npm run build:admin` → dist-admin/ klasörüne düz olarak build eder
 *
 * Render ayarları:
 *   Build Command  : npm install && npm run build:admin
 *   Publish Dir    : dist-admin
 *   Redirect rule  : /* → /index.html (Rewrite)
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],

  /* root = admin-panel klasörü → index.html oradan alınır */
  root: resolve(__dirname, 'admin-panel'),
  base: '/',

  server: {
    port: 5174,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },

  build: {
    /* dist-admin/ → düz yapı: index.html + assets/ */
    outDir: resolve(__dirname, 'dist-admin'),
    emptyOutDir: true,

    rollupOptions: {
      input: resolve(__dirname, 'admin-panel/index.html'),

      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
            if (id.includes('socket.io') || id.includes('engine.io'))    return 'vendor-socket'
            if (id.includes('lucide'))                                    return 'vendor-icons'
            if (id.includes('@capacitor'))                                return 'vendor-capacitor'
            return 'vendor-misc'
          }
          if (id.includes('/pages/Admin'))                                return 'admin-pages'
          if (
            id.includes('/pages/SupportDashboard') ||
            id.includes('/pages/SupportChatPage')
          ) return 'support-pages'
        },
      },
    },

    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
  },

  define: {
    'process.env.VITE_APP_CAPACITOR': JSON.stringify(false),
  },
})
