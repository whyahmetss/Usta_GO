# Native Mobile Development Guide - Usta Go

Usta Go'nun native iOS ve Android uygulaması olarak geliştirilmesi için detaylı rehber.

## 🏗️ Proje Yapısı

```
Usta_GO/
├── src/                           # React web kodu
│   ├── pages/                     # Sayfalar
│   ├── components/                # Bileşenler
│   ├── context/                   # State management
│   ├── hooks/                     # Custom hooks
│   │   └── useCapacitorCamera.js  # Native camera hook
│   └── ...
├── ios/                           # iOS native projesi
│   ├── App/
│   │   ├── App.xcworkspace       # Xcode workspace
│   │   ├── App/
│   │   │   ├── Info.plist        # iOS izin ayarları
│   │   │   ├── Assets.xcassets   # App icon & images
│   │   │   └── public/           # Web dosyaları
│   │   └── Pods/                 # CocoaPods bağımlılıkları
│   └── ...
├── android/                       # Android native projesi
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml # Android izinleri
│   │   │   ├── res/               # Android resources
│   │   │   │   ├── mipmap-*/      # App icons
│   │   │   │   ├── drawable-*/    # Drawables
│   │   │   │   └── values/        # Strings, colors
│   │   │   └── assets/            # Web dosyaları
│   │   └── build.gradle           # Gradle config
│   ├── variables.gradle           # SDK versions
│   └── ...
├── capacitor.config.ts            # Capacitor yapılandırması
├── vite.config.js                 # Build config
├── package.json                   # Dependencies
├── MOBILE_SETUP.md                # Kurulum rehberi
└── ...
```

## 🔌 Native Plugin Entegrasyonu

### Camera Plugin - Custom Hook

**File**: `src/hooks/useCapacitorCamera.js`

```javascript
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';

export const useCapacitorCamera = () => {
  const takePhoto = async (source = CameraSource.Camera) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 1280,
        height: 720,
      });
      return image.dataUrl;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  };

  return {
    takePhoto,
    pickFromGallery: () => takePhoto(CameraSource.Photos),
    takePhotoWithCamera: () => takePhoto(CameraSource.Camera)
  };
};
```

**Kullanım**:

```jsx
import { useCapacitorCamera } from '../hooks/useCapacitorCamera';

function MyComponent() {
  const { takePhotoWithCamera, pickFromGallery } = useCapacitorCamera();

  const handleCamera = async () => {
    try {
      const photo = await takePhotoWithCamera();
      // photo: data URL string
      setPhotoPreview(photo);
    } catch (error) {
      console.error('Camera denied');
    }
  };

  return (
    <button onClick={handleCamera}>
      Fotoğraf Çek
    </button>
  );
}
```

### Geolocation Plugin (Gelecek)

```javascript
import { Geolocation } from '@capacitor/geolocation';

export const useCapacitorGeolocation = () => {
  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy
      };
    } catch (error) {
      console.error('Geolocation error:', error);
      throw error;
    }
  };

  const watchPosition = (callback) => {
    return Geolocation.watchPosition({}, (position, err) => {
      if (position) {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }
    });
  };

  return { getCurrentLocation, watchPosition };
};
```

### Push Notifications Setup (Gelecek)

```javascript
import { PushNotifications } from '@capacitor/push-notifications';

export const setupPushNotifications = async () => {
  try {
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive === 'granted') {
      // Register with APNs (iOS) or FCM (Android)
      await PushNotifications.register();

      // Get the token
      const result = await PushNotifications.getDeliveredNotifications();
      console.log('Push Notifications enabled', result);
    }
  } catch (error) {
    console.error('Push notification setup failed:', error);
  }
};

// Notification listeners
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Notification received:', notification);
});

PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
  console.log('Action performed:', notification);
});
```

## 🎯 Platform Spesifik Özellikleri

### iOS - Swift İntegrasyonu

Özel native code eklemek istiyorsanız:

**File**: `ios/App/App/CustomPlugin.swift`

```swift
import Capacitor

@objc(CustomPlugin)
public class CustomPlugin: CAPPlugin {
    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": value
        ])
    }
}
```

Sonra `capacitor.config.ts`'e ekleyin:

```typescript
plugins: {
  CustomPlugin: {}
}
```

React'tan kullanın:

```javascript
import { Capacitor, registerPlugin } from '@capacitor/core';

const CustomPlugin = registerPlugin('CustomPlugin');

const result = await CustomPlugin.echo({ value: 'Hello' });
```

### Android - Kotlin İntegrasyonu

**File**: `android/app/src/main/java/com/ustago/app/CustomPlugin.kt`

```kotlin
package com.ustago.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "CustomPlugin")
class CustomPlugin : Plugin() {
    @PluginMethod
    fun echo(call: PluginCall) {
        val value = call.getString("value", "")
        val ret = JSObject()
        ret.put("value", value)
        call.resolve(ret)
    }
}
```

## 🔐 İzin Yönetimi

### iOS İzin Talep Etme

`Info.plist` de her izin için açıklama gerekli:

```xml
<key>NSCameraUsageDescription</key>
<string>İşin durumunu belgelemek için kamera kullanılacak</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>İş yerini haritada görmek ve takip etmek için</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Fotoğraf yüklemek için galeri erişimi</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Çekilen fotoğrafları kaydetmek için</string>
```

### Android İzin Talep Etme

Androidmanifest.xml'e ekleyin:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

Runtime izinler Android 6.0+ için talep edilmelidir.
Capacitor plugins bunu otomatik olarak yapar.

## 🎨 UI/UX Platform Farklılıkları

### Safe Area (iPhone Notch/Gesture)

CSS ile yönetim:

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

Tailwind ile:

```jsx
<div className="pt-safe pb-safe">
  Content
</div>
```

### Platform Algılama

```javascript
import { Capacitor } from '@capacitor/core';

const isIOS = Capacitor.getPlatform() === 'ios';
const isAndroid = Capacitor.getPlatform() === 'android';
const isNative = Capacitor.isNativePlatform();
const isWeb = !isNative;
```

### Durumu Çubuğu Özelleştirme

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Koyu tema
await StatusBar.setStyle({ style: Style.Dark });
await StatusBar.setBackgroundColor({ color: '#1F2937' });

// Açık tema
await StatusBar.setStyle({ style: Style.Light });
```

## 🧪 Testing

### Web Geliştirmede Test

```bash
npm run dev
# Localhost:5173'te çalışır
# Chrome DevTools ile debug edin
```

### Emulator/Simulator'da Test

```bash
# Android
npm run android
# Android Studio'da Run butonuna tıklayın

# iOS
npm run ios
# Xcode'da Run butonuna tıklayın
```

### Cihazda Test

```bash
# Android - USB debug modunda
adb install build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.ustago.app/.MainActivity

# iOS - Provisioning profile gerekli
# Xcode'da Run butonuna tıklayın
```

## 📊 Performance Optimization

### Code Splitting

```javascript
import { lazy, Suspense } from 'react';

const JobDetail = lazy(() => import('./pages/JobDetailPage'));

<Suspense fallback={<Loading />}>
  <JobDetail />
</Suspense>
```

### Image Optimization

```jsx
// WebP with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Job" />
</picture>

// Lazy load
<img loading="lazy" src="image.jpg" />
```

### Bundle Size

```bash
npm install -D vite-plugin-compression

// vite.config.js
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [compression()]
});
```

## 🐛 Debugging

### Capacitor Logger

```javascript
import { CapacitorHttp } from '@capacitor/core';

console.log('Debug message');
// DevTools console'da görülür
```

### Native Logging

**iOS**:
```swift
NSLog("Debug: %@", "message")
```

**Android**:
```kotlin
Log.d("UstaGo", "Debug message")
```

### Chrome DevTools (Web & Android)

Android'de remote debug:
```bash
adb reverse tcp:9222 tcp:9222
# Chrome://inspect
```

## 📝 Code Quality

### ESLint Setup (React)

```bash
npm install -D eslint eslint-plugin-react
```

### TypeScript (Gelecek)

```bash
npm install -D typescript @types/react

# tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "jsx": "react-jsx"
  }
}
```

## 🚀 CI/CD (Gelecek)

GitHub Actions ile otomatik build:

```yaml
# .github/workflows/mobile.yml
name: Build Mobile Apps

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build:mobile
```

## 📚 Kaynaklar

- [Capacitor Official Docs](https://capacitorjs.com/docs)
- [React Documentation](https://react.dev)
- [Apple Developer Documentation](https://developer.apple.com/documentation)
- [Android Developer Documentation](https://developer.android.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

---

**Sürüm**: 1.0.0
**Son Güncelleme**: 2026-02-20
