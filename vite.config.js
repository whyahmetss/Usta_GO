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
        /**
         * Manuel chunk stratejisi:
         *  - vendor      : React ekosistemi (değişmez, uzun cache)
         *  - chunk-admin : 15 admin sayfası → müşteri/usta ASLA indirmez
         *  - chunk-support: destek sayfaları → müşteri/usta ASLA indirmez
         *  - chunk-shared : ortak sayfalar (profil, mesaj, iş detay…)
         *  - chunk-pro   : usta sayfaları
         *  Geriye kalan → index chunk (auth, müşteri ana sayfası)
         */
        /* Vendor bölme YOK — döngüsel bağımlılık hatasını önler.
           Vite kendi otomatik chunk stratejisini kullanır.
           Sadece büyük sayfa gruplarını ayırıyoruz. */
        manualChunks(id) {
          if (id.includes('node_modules/socket.io-client') ||
              id.includes('node_modules/engine.io-client')) {
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
