import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const target = process.env.VITE_BUILD_TARGET // 'app' | 'panel' | undefined (dev)

export default defineConfig({
  plugins: [react()],

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
