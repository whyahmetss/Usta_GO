import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    }
  },
  define: {
    'process.env.VITE_APP_CAPACITOR': JSON.stringify(true),
  }
})
