import { Capacitor } from '@capacitor/core'
import { fetchAPI } from './api'
import { API_ENDPOINTS } from '../config'

let initialized = false

// Firebase henüz yapılandırılmadı (google-services.json eksik).
// Bu flag true yapılınca push notification aktif olur.
const FIREBASE_CONFIGURED = false

/**
 * Push notification'ları başlat.
 * Sadece native platformda (Android/iOS) çalışır.
 * FCM token'ı backend'e kaydeder.
 * FIREBASE_CONFIGURED = true olunca aktif olur.
 */
export async function initPushNotifications() {
  if (!FIREBASE_CONFIGURED) return
  if (initialized) return
  if (!Capacitor.isNativePlatform()) return

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    // İzin iste
    const permResult = await PushNotifications.requestPermissions()
    if (permResult.receive !== 'granted') {
      console.warn('Push notification izni verilmedi')
      return
    }

    // Kayıt ol
    await PushNotifications.register()

    // Token alındığında backend'e gönder
    PushNotifications.addListener('registration', async (token) => {
      console.log('FCM Token:', token.value)
      try {
        await fetchAPI(API_ENDPOINTS.AUTH.FCM_TOKEN, {
          method: 'POST',
          body: { fcmToken: token.value },
        })
      } catch (err) {
        console.error('FCM token kayıt hatası:', err)
      }
    })

    // Token alma hatası
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push notification kayıt hatası:', error)
    })

    // Uygulama açıkken gelen bildirim
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push bildirim alındı (foreground):', notification)
    })

    // Bildirime tıklanınca
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Bildirime tıklandı:', action)
      const data = action.notification?.data
      if (data?.route) {
        window.location.href = data.route
      }
    })

    initialized = true
  } catch (err) {
    console.error('Push notification init hatası:', err)
  }
}
