/**
 * Usta Go — Admin Panel Vite Config
 *
 * `npm run dev:admin`   → port 5174'te admin paneli başlatır
 * `npm run build:admin` → dist-admin/ klasörüne build eder
 *
 * Backend URL: src/config.js ile ortak (aynı API_URL)
 * Kaynak dosyalar: src/ ile ortak (components, utils, context, pages)
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  /* Admin panel'in HTML entry noktası */
  root: '.',

  server: {
    port: 5174,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  build: {
    /* Ayrı output klasörü — mobil dist/ ile karışmasın */
    outDir: 'dist-admin',
    emptyOutDir: true,

    rollupOptions: {
      /* Admin panel için HTML entry */
      input: 'admin-panel/index.html',

      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
            if (id.includes('socket.io') || id.includes('engine.io'))    return 'vendor-socket'
            if (id.includes('lucide'))                                    return 'vendor-icons'
            if (id.includes('@capacitor'))                                return 'vendor-capacitor'
            return 'vendor-misc'
          }
          /* Admin sayfaları tek chunk'ta toplanabilir ya da ayrı ayrı yüklenir */
          if (id.includes('/pages/Admin')) return 'admin-pages'
          if (
            id.includes('/pages/SupportDashboard') ||
            id.includes('/pages/SupportChatPage')
          ) return 'support-pages'
        },
      },
    },

    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  define: {
    'process.env.VITE_APP_CAPACITOR': JSON.stringify(false),
  },
})
