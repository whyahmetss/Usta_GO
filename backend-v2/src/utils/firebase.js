import admin from "firebase-admin";

let firebaseApp = null;

/**
 * Firebase Admin SDK'yı başlat.
 * FIREBASE_SERVICE_ACCOUNT env var'ı JSON string olarak set edilmeli.
 * Yoksa push notification devre dışı kalır (hata vermez).
 */
export const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJSON) {
      console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT env var not set — push notifications disabled");
      return null;
    }

    const serviceAccount = JSON.parse(serviceAccountJSON);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized");
    return firebaseApp;
  } catch (err) {
    console.error("❌ Firebase init error:", err.message);
    return null;
  }
};

/**
 * Tek bir cihaza push notification gönder.
 * @param {string} fcmToken - Hedef cihazın FCM token'ı
 * @param {string} title - Bildirim başlığı
 * @param {string} body - Bildirim içeriği
 * @param {object} data - Ek veri (opsiyonel)
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseApp) return null;
  if (!fcmToken) return null;

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
    };

    const result = await admin.messaging().send(message);
    return result;
  } catch (err) {
    // Token geçersizse sessizce logla
    if (err.code === "messaging/registration-token-not-registered" ||
        err.code === "messaging/invalid-registration-token") {
      console.warn(`FCM token invalid for token: ${fcmToken.slice(0, 20)}...`);
    } else {
      console.error("Push notification error:", err.message);
    }
    return null;
  }
};

/**
 * Birden fazla cihaza push notification gönder.
 * @param {string[]} fcmTokens - FCM token listesi
 * @param {string} title - Bildirim başlığı
 * @param {string} body - Bildirim içeriği
 * @param {object} data - Ek veri (opsiyonel)
 */
export const sendPushToMultiple = async (fcmTokens, title, body, data = {}) => {
  if (!firebaseApp) return null;
  const validTokens = fcmTokens.filter(Boolean);
  if (validTokens.length === 0) return null;

  try {
    const message = {
      tokens: validTokens,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
    };

    const result = await admin.messaging().sendEachForMulticast(message);
    return result;
  } catch (err) {
    console.error("Push multicast error:", err.message);
    return null;
  }
};
