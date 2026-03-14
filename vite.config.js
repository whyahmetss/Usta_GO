import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
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
