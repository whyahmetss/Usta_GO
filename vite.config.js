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
        manualChunks(id) {
          /* ── Vendor: 3. taraf kütüphaneler ── */
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('socket.io') || id.includes('engine.io')) {
              return 'vendor-socket'
            }
            if (id.includes('lucide')) {
              return 'vendor-icons'
            }
            if (id.includes('@capacitor')) {
              return 'vendor-capacitor'
            }
            return 'vendor-misc'
          }

          /* ── Admin chunk ── */
          if (id.includes('/pages/Admin')) {
            return 'chunk-admin'
          }

          /* ── Support chunk ── */
          if (
            id.includes('/pages/SupportDashboard') ||
            id.includes('/pages/SupportChatPage') ||
            id.includes('/pages/AdminSupportMonitorPage')
          ) {
            return 'chunk-support'
          }

          /* ── Professional chunk ── */
          if (
            id.includes('/pages/ProfessionalDashboard') ||
            id.includes('/pages/ProfessionalMapPage') ||
            id.includes('/pages/UstaRegisterPage') ||
            id.includes('/pages/WithdrawPage')
          ) {
            return 'chunk-pro'
          }

          /* ── Shared pages chunk ── */
          if (
            id.includes('/pages/ProfilePage') ||
            id.includes('/pages/SettingsPage') ||
            id.includes('/pages/MessagesPage') ||
            id.includes('/pages/JobDetailPage') ||
            id.includes('/pages/RateJobPage') ||
            id.includes('/pages/MyJobsPage') ||
            id.includes('/pages/NotificationsPage') ||
            id.includes('/pages/WalletPage') ||
            id.includes('/pages/CancelJobPage') ||
            id.includes('/pages/LiveTrackingPage') ||
            id.includes('/pages/LiveSupportChatPage') ||
            id.includes('/pages/HelpPage') ||
            id.includes('/pages/AboutPage') ||
            id.includes('/pages/odeme') ||
            id.includes('/pages/PaymentResultPage')
          ) {
            return 'chunk-shared'
          }
        },
      },
    },
  },

  define: {
    'process.env.VITE_APP_CAPACITOR': JSON.stringify(true),
  },
})
