# Usta Go - KOMPLE ÇALIŞIR VERSİYON 🏠⚡

Profesyonel ev hizmetleri platformu - Tam özellikli, çalışır versiyon

## ✅ YAPILAN TÜM ÖZELLİKLER

### 🔐 **Giriş ve Kayıt Sistemi**
- Kayıt olurken **Müşteri / Usta** seçimi
- Email + şifre ile giriş
- Admin girişi: `admin@admin.com` / `1234`
- LocalStorage ile veri saklama

### 📱 **3 Farklı Kullanıcı Paneli**

#### 👤 **Müşteri Paneli**
- ✅ Ana sayfa (mavi gradient, %20 indirim banner'ı)
- ✅ 6 kategori (Sadece Elektrik aktif, diğerleri blur + "Yakında")
- ✅ Elektrik kategorisine tıklayınca → Detay sayfası
- ✅ Bottom navigation (Ana Sayfa, İşlerim, Mesajlar, Profil)
- ✅ Profil sayfası + çıkış butonu
- ✅ İşlerim sayfası (aktif/tamamlanan)
- ✅ İş değerlendirme sistemi

#### ⚡ **Usta Paneli**
- ✅ Yeşil tema dashboard
- ✅ İstatistikler (kazanç, tamamlanan iş, puan, büyüme)
- ✅ Yeni iş talepleri listesi
- ✅ **İş kabul akışı:**
  - İşi kabul et butonu
  - **Yola Çık** butonu → Google Maps'te aç
  - **Önce fotoğraf çek** → İşe başla
  - **Sonra fotoğraf çek** → İşi tamamla
- ✅ Bottom navigation (Ana Sayfa, İşlerim, Mesajlar, Profil)

#### ⚙️ **Admin Paneli**
- ✅ Platform istatistikleri
- ✅ Kullanıcı yönetimi kartları
- ✅ Son aktiviteler
- ✅ Çıkış butonu

### 💬 **Mesajlaşma Sistemi**
- ✅ Müşteri ↔ Usta mesajlaşma
- ✅ **Hazır mesaj şablonları:**
  - **Usta:** "Yoldayım ✅", "Malzeme gerek 🛠️", "İş tamam ✅", "Gecikeceğim ⏰"
  - **Müşteri:** "Ne zaman?", "Teşekkürler ⭐", "Adres yardım?", "İptal"

### 📸 **Önce/Sonra Fotoğraf Sistemi**
- ✅ İşe başlamadan önce fotoğraf çekme zorunluluğu
- ✅ İş bitince sonra fotoğrafı çekme
- ✅ Müşteri her iki fotoğrafı da görebilir

### ⭐ **Değerlendirme Sistemi**
- ✅ İş tamamlandıktan sonra değerlendirme
- ✅ 1-5 yıldız puanlama
- ✅ Yorum yazma (opsiyonel)
- ✅ Müşteri → Usta değerlendirme
- ✅ Usta → Müşteri değerlendirme

### 🗺️ **Navigasyon Sistemi**
- ✅ "Yola Çık" butonu ile Google Maps entegrasyonu
- ✅ Otomatik konum ve adres gösterimi

### 📋 **İş Yönetimi**
- ✅ İş durumları: Bekliyor, Kabul Edildi, Devam Ediyor, Tamamlandı, Değerlendirildi
- ✅ İş detay sayfası
- ✅ İşlerim sayfası (aktif/tamamlanan ayrımı)

## 🚀 Kurulum

\`\`\`bash
# Bağımlılıkları yükle
npm install

# Development server
npm run dev

# Production build
npm run build
\`\`\`

## 🔑 Test Kullanıcıları

### Admin
- **Email:** `admin@admin.com`
- **Şifre:** `1234`

### Müşteri
1. Kayıt ol → Müşteri seç
2. Email/şifre gir → Kayıt
3. Ana sayfaya yönlendirilir

### Usta
1. Kayıt ol → Usta seç
2. Email/şifre gir → Kayıt
3. Usta paneline yönlendirilir

## 📂 Proje Yapısı

\`\`\`
usta-go-complete/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── AuthPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── ElectricServicesPage.jsx
│   │   ├── ProfessionalDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── MyJobsPage.jsx
│   │   ├── MessagesPage.jsx
│   │   ├── JobDetailPage.jsx
│   │   └── RateJobPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── package.json
\`\`\`

## 🎯 Kullanım Akışı

### Müşteri Akışı:
1. Kayıt ol (Müşteri)
2. Ana sayfa → Elektrik kategorisi
3. Usta kabul edince bildirim
4. Mesajlaş (hazır textler)
5. İş tamamlanınca fotoğrafları gör
6. Değerlendir (yıldız + yorum)

### Usta Akışı:
1. Kayıt ol (Usta)
2. Dashboard'da yeni işleri gör
3. İşe tıkla → **"Kabul Et"**
4. **"Yola Çık"** → Google Maps
5. **Önce fotoğraf çek** → **"İşe Başla"**
6. **Sonra fotoğraf çek** → **"İşi Tamamla"**
7. Müşteriyi değerlendir

## 👨‍💻 Geliştirici

Oyasim Ahmed (@oyasim)

---

**v3.0.0 - KOMPLE** - Tüm özellikler çalışıyor! 🎉
