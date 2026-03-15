import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { fetchAPI } from './api'
import { API_ENDPOINTS } from '../config'

let initialized = false

/**
 * Push notification'ları başlat.
 * Sadece native platformda (Android/iOS) çalışır.
 * FCM token'ı backend'e kaydeder.
 */
export async function initPushNotifications() {
  if (initialized) return
  if (!Capacitor.isNativePlatform()) return

  try {
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
      // Foreground'da local notification gösterebilirsin veya in-app toast
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
