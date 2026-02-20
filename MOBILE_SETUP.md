# Usta Go - Mobile App Setup Guide

Bu rehber Usta Go'yu iOS ve Android için native mobile uygulamaya çevirmek için gerekli tüm adımları içerir.

## 📋 Gereksinimler

### Windows (Android Development)
- Android Studio (en son sürüm)
- Java Development Kit (JDK 11+)
- Android SDK API 36 (targetSdkVersion)
- Minimum SDK API 24 (Android 7.0+)
- Visual Studio Code veya başka bir code editor

### macOS (iOS Development)
- Xcode (en az 15.0)
- CocoaPods
- Apple Developer Account (sürüm için isteğe bağlı)
- iOS 13.0 minimum deployment target

### Tüm Platformlar
- Node.js 16+
- npm 7+
- Git

## 🚀 Kurulum Adımları

### 1. Usta Go Projesini Klonlayın

```bash
git clone https://github.com/whyahmetss/Usta_GO.git
cd Usta_GO
git checkout claude/fix-localstorage-admin-panel-4Swe4
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

Bu adım önceden yapılmıştır. Capacitor ve tüm native pluginler yüklenmiş durumdadır.

### 3. Web Uygulamasını Build Edin

```bash
npm run build:mobile
```

Bu komut:
- Web uygulamasını production için derler
- Android ve iOS platformlarını Capacitor sync eder
- Native projelerine tüm web dosyalarını kopyalar

## 📱 Android Kurulumu (Windows)

### Adım 1: Android Studio Kurulumu

1. [Android Studio'yu indirin](https://developer.android.com/studio)
2. Kurulum tamamlanana kadar adımları izleyin
3. Android Studio ilk açıldığında SDK yöneticisinden SDK'yı indirin

### Adım 2: Android Projesini Açın

```bash
npm run android
```

Bu komut:
- `android/` klasörünü Android Studio'da açar
- Gerekli gradleları indirir
- Projeyi derleyebilir hale getirir

### Adım 3: Emulator veya Cihaz Kurulumu

#### Emulator (Virtual Device) Kullanarak
1. Android Studio → Virtual Device Manager
2. Yeni cihaz oluşturun (Pixel 4a tavsiye edilir)
3. Android API 36+ seçin
4. Emulator'ı başlatın

#### Fiziksel Cihaz Kullanarak
1. Telefonunuzu USB ile bilgisayara bağlayın
2. Developer Mode'u etkinleştirin:
   - Ayarlar → Sistem → Hakkında
   - "Build numarası"na 7 kez dokunun
3. USB Debugging'i etkinleştirin

### Adım 4: Build ve Test Edin

```bash
# Android Studio'da:
# Build → Make Project
# Run → Run 'App'

# Veya komut satırından:
cd android
./gradlew build
./gradlew installDebug
```

## 🍎 iOS Kurulumu (macOS)

### Adım 1: Xcode Kurulumu

```bash
xcode-select --install
```

Xcode App Store'dan da indirilebilir.

### Adım 2: CocoaPods Kurulumu

```bash
sudo gem install cocoapods
```

### Adım 3: iOS Projesini Açın

```bash
npm run ios
```

Bu komut:
- `ios/App/App.xcworkspace` dosyasını Xcode'da açar
- CocoaPods bağımlılıklarını yükler
- Projeyi derleyebilir hale getirir

### Adım 4: Simulator veya Cihaz Kurulumu

#### Simulator (Sanal Cihaz) Kullanarak
1. Xcode → Window → Devices and Simulators
2. Simulators sekmesini açın
3. Yeni simulator oluşturun (iPhone 15 tavsiye edilir)
4. iOS 17+ seçin

#### Fiziksel Cihaz Kullanarak
1. iPhone'u USB ile Mac'e bağlayın
2. Xcode'da Trust edin
3. Signing & Capabilities'de Apple Developer Account ayarlayın

### Adım 5: Build ve Test Edin

```bash
# Xcode'da:
# Product → Build
# Product → Run

# Veya komut satırından:
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15'
```

## 🔧 Platform Spesifik Yapılandırması

### Android Yapılandırma

**File**: `android/app/src/main/AndroidManifest.xml`

Izinler otomatik olarak eklendi:
- `CAMERA` - Fotoğraf çekme
- `ACCESS_FINE_LOCATION` - Konum erişimi
- `INTERNET` - API istekleri
- `VIBRATE` - Titreşim feedback

**Minimum SDK**: API 24 (Android 7.0)
**Target SDK**: API 36 (Android 15)

### iOS Yapılandırma

**File**: `ios/App/App/Info.plist`

İzin açıklamaları otomatik olarak eklendi:
- `NSCameraUsageDescription` - Kamera izni
- `NSLocationWhenInUseUsageDescription` - Konum izni
- `NSPhotoLibraryUsageDescription` - Galeri izni
- `NSPhotoLibraryAddUsageDescription` - Fotoğraf kaydetme izni

**Deployment Target**: iOS 13.0+

## 🎨 App Icons ve Splash Screen

### App Icon Hazırlama (Gelecekte)

1. Mavi-yeşil gradient öne çıkan 1024x1024 PNG
2. Aşağıdaki araçlardan birini kullanın:
   - [AppIconGenerator](https://www.appicongenerator.com/)
   - [MakeAppIcon](https://makeappicon.com/)

iOS için: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
Android için: `android/app/src/main/res/mipmap-*/ic_launcher.png`

### Splash Screen Hazırlama (Gelecekte)

1. 2732x2732 PNG (iPad için optimize)
2. Usta Go logosu ve marka renkleri içermelidir
3. capacitor.config.ts'de yapılandırın

## 📝 Yapı Komutları

```bash
# Web uygulamasını build et
npm run build

# Web'i build et ve mobile platformları sync et
npm run build:mobile

# Android Studio'da aç
npm run android

# Xcode'da aç
npm run ios

# Sadece Android'i sync et (code değişiklikleri sonrası)
npm run sync:android

# Sadece iOS'u sync et (code değişiklikleri sonrası)
npm run sync:ios
```

## 🐛 Yaygın Sorunlar ve Çözümler

### Android

#### "Gradle build başarısız"
```bash
cd android
./gradlew clean
./gradlew build
```

#### "SDK not found"
- Android Studio SDK Manager'ı açın
- API 36 SDK'sını indirin
- ANDROID_SDK_ROOT ortam değişkenini ayarlayın

#### Emulator performans sorunları
- HAXM (Intel emulator accelerator) yükleyin
- Emulator çözünürlüğünü düşürün
- Host: Use native bridge etkinleştirin

### iOS

#### "Pod install başarısız"
```bash
cd ios/App
pod deintegrate
pod install
```

#### "Signing error"
- Xcode → Preferences → Accounts
- Apple ID ekleyin ve download edin
- Target → Signing & Capabilities'de team ayarlayın

#### "Build başarısız: Module not found"
```bash
cd ios/App
rm -rf Pods/ Podfile.lock
pod install
```

## 🚢 Production Build

### Android APK Build

```bash
cd android
./gradlew assembleRelease
# APK konumu: app/build/outputs/apk/release/app-release.apk
```

### iOS Archive (TestFlight/App Store)

```bash
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive
```

## 📦 Capacitor Plugins

Kullanılan native pluginler:

| Plugin | İşlev | İzin Gerekliliği |
|--------|-------|------------------|
| @capacitor/camera | Fotoğraf çekme | CAMERA |
| @capacitor/geolocation | Konum erişimi | LOCATION |
| @capacitor/status-bar | Durum çubuğu | - |
| @capacitor/splash-screen | Açılış ekranı | - |
| @capacitor/push-notifications | Push bildirimler | - |
| @capacitor/keyboard | Klavye kontrolü | - |
| @capacitor/haptics | Titreşim | VIBRATE |
| @capacitor/app | App lifecycle | - |

## 🔗 Faydalı Bağlantılar

- [Capacitor Docs](https://capacitorjs.com/)
- [Android Development](https://developer.android.com/)
- [iOS Development](https://developer.apple.com/ios/)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Xcode Help](https://help.apple.com/xcode/)

## 💡 İpuçları

1. **Geliştirme sırasında**: `npm run dev` web versiyonunda test edin
2. **Test öncesi**: Her değişiklikten sonra `npm run build:mobile` çalıştırın
3. **İzin testleri**: Gerçek cihazda her izin talep edişini test edin
4. **Performance**: Cihazda test edin, emulator çok hızlı olabilir
5. **Network**: Cihaz ile bilgisayar aynı WiFi'de olmalıdır (geliştirme sırasında)

## 📞 Destek

Sorun oluştuğunda:
1. Console'da hata mesajını kontrol edin
2. Loglara bakın: `adb logcat` (Android) veya Xcode Console (iOS)
3. Belirli plugin dokumentasyonunu kontrol edin

---

**Son Güncelleme**: 2026-02-20
**Capacitor Sürümü**: 8.1.0
**Node Gereksinimleri**: 16.0.0+
