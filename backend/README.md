# Usta Go Backend API

Usta Go için Node.js + Express + MongoDB backend API'ı. Gerçek zamanlı notifikasyonlar, dosya yükleme ve cüzdan yönetimiyle tam işlevsel bir hizmet platformu.

## 📋 Özellikler

- ✅ **Kimlik Doğrulama** - JWT token tabanlı auth
- ✅ **İş Yönetimi** - İş talebi, kabul, başlama, tamamlama
- ✅ **Mesajlaşma** - Real-time Socket.IO ile anlık mesajlar
- ✅ **Cüzdan Sistemi** - Bakiye, escrow, kuponlar, kazançlar
- ✅ **Dosya Yükleme** - Multer ile fotoğraf yönetimi
- ✅ **Derecelendirme** - İş değerlendirmesi ve profesyonel rating
- ✅ **Şikayet Sistemi** - Uyuşmazlık çözümü
- ✅ **Admin Paneli** - Kullanıcı, iş ve işlem yönetimi

## 🛠️ Gereksinimler

- **Node.js** 16.0.0 veya üzeri
- **npm** 7.0.0 veya üzeri
- **MongoDB** 4.4+ (lokal veya MongoDB Atlas)

## 📦 Kurulum

### 1. Repository'i Klonlayın

```bash
cd backend
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Değişkenlerini Ayarlayın

`.env` dosyası oluşturun ve kopyalayın:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/usta-go
# veya MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/usta-go?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=7d

# Bcrypt
BCRYPT_ROUNDS=10

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads/photos

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5000
```

### 4. MongoDB Kurulumu (Lokal)

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
[MongoDB Community Download](https://www.mongodb.com/try/download/community)

**Linux:**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**MongoDB Atlas (Bulut):**
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) adresine git
2. Ücretsiz cluster oluştur
3. Connection string'i kopyala
4. `.env` içinde MONGO_URI'yi güncelle

### 5. Sunucuyu Başlat

**Geliştirme modunda (auto-reload):**
```bash
npm run dev
```

**Production modunda:**
```bash
npm start
```

Sunucu `http://localhost:5000` adresinde çalışacaktır.

## 📁 Proje Yapısı

```
backend/
├── models/                 # MongoDB Models
│   ├── User.js            # Kullanıcı model
│   ├── Job.js             # İş model
│   ├── Message.js         # Mesaj model
│   ├── Transaction.js     # İşlem model
│   └── Complaint.js       # Şikayet model
├── routes/                # Express Routes
│   ├── authRoutes.js      # Auth endpoints
│   ├── jobRoutes.js       # Job endpoints
│   ├── messageRoutes.js   # Message endpoints
│   ├── walletRoutes.js    # Wallet endpoints
│   └── uploadRoutes.js    # File upload endpoints
├── controllers/           # Business Logic
│   ├── authController.js
│   ├── jobController.js
│   ├── messageController.js
│   └── walletController.js
├── middleware/            # Express Middleware
│   ├── auth.js           # JWT authentication
│   ├── errorHandler.js   # Error handling
│   └── validation.js     # Input validation
├── config/               # Configuration Files
│   ├── database.js       # MongoDB connection
│   └── jwt.js            # JWT utilities
├── utils/                # Utility Functions
│   ├── multer.js         # File upload
│   ├── socket.js         # Socket.IO setup
│   └── sendResponse.js   # Response formatting
├── uploads/              # Uploaded files
├── server.js             # Main entry point
├── .env.example          # Environment template
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication

```http
POST   /api/auth/register        # Kayıt ol
POST   /api/auth/login           # Giriş yap
GET    /api/auth/me              # Profil bilgisi (Private)
PUT    /api/auth/update-profile  # Profil güncelle (Private)
POST   /api/auth/change-password # Şifre değiştir (Private)
POST   /api/auth/logout          # Çıkış yap (Private)
```

### Jobs

```http
POST   /api/jobs                 # Yeni iş talebi (Private)
GET    /api/jobs                 # İşleri listele
GET    /api/jobs/:id             # İş detayları
GET    /api/jobs/user/:userId    # Kullanıcının işleri
PUT    /api/jobs/:id/accept      # İşi kabul et (Private)
PUT    /api/jobs/:id/start       # İşe başla (Private)
PUT    /api/jobs/:id/complete    # İşi tamamla (Private)
PUT    /api/jobs/:id/cancel      # İşi iptal et (Private)
PUT    /api/jobs/:id/rate        # İşi değerlendir (Private)
DELETE /api/jobs/:id             # İşi sil (Private)
```

### Messages

```http
POST   /api/messages             # Mesaj gönder (Private)
GET    /api/messages/:userId     # Konuşmaları getir (Private)
GET    /api/messages/job/:jobId  # İş mesajlarını getir (Private)
GET    /api/messages/conversations # Tüm konuşmalar (Private)
PUT    /api/messages/:id/read    # Mesajı oku olarak işaretle (Private)
DELETE /api/messages/:id         # Mesajı sil (Private)
```

### Wallet

```http
GET    /api/wallet               # Cüzdan bilgisi (Private)
GET    /api/wallet/transactions  # İşlem geçmişi (Private)
GET    /api/wallet/earnings      # Kazançlar (Private)
POST   /api/wallet/topup         # Cüzdan doldur (Private)
POST   /api/wallet/withdraw      # Para çek (Private)
POST   /api/wallet/coupon        # Kupon ekle (Private)
POST   /api/wallet/escrow-release/:jobId # Escrow serbest bırak (Private)
```

### Upload

```http
POST   /api/upload/photo         # Tek fotoğraf yükle (Private)
POST   /api/upload/photos        # Çoklu fotoğraf yükle (Private)
```

## 🔐 Authentication

### Bearer Token Kullanımı

Tüm protected endpoints için header'a token ekleyin:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/auth/me
```

### Token Alma (Login)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

## 📡 Socket.IO Real-Time Events

### Client → Server

```javascript
// Bağlan
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// İş katılma
socket.emit('job:join', 'jobId123');

// Mesaj gönder
socket.emit('message:send', {
  to: 'userId123',
  content: 'Merhaba!',
  jobId: 'jobId123'
});

// Yazıyor göster
socket.emit('typing:start', {
  to: 'userId123',
  jobId: 'jobId123'
});

// Konumu güncelle
socket.emit('location:update', {
  jobId: 'jobId123',
  lat: 40.9929,
  lng: 29.0260
});
```

### Server → Client

```javascript
// Bağlantı durumu
socket.on('user:online', (data) => {
  console.log('Kullanıcı çevrimiçi:', data.userId);
});

socket.on('user:offline', (data) => {
  console.log('Kullanıcı çevrimdışı:', data.userId);
});

// Bildirim
socket.on('notification:message', (data) => {
  console.log('Yeni mesaj:', data.content);
});

socket.on('notification:job-accepted', (data) => {
  console.log('İş kabul edildi:', data.jobId);
});

// Yazıyor göster
socket.on('notification:typing', (data) => {
  console.log(`${data.from} yazıyor...`);
});

// Konumu al
socket.on('professional:location', (data) => {
  console.log('Profesyonel konumu:', data.lat, data.lng);
});
```

## 📊 Database Models

### User Schema

```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: enum(['customer', 'professional', 'admin']),
  avatar: String,
  profilePhoto: String,
  verified: Boolean,
  wallet: {
    balance: Number,
    escrow: Number,
    coupons: Array,
    totalEarnings: Number
  },
  stats: {
    completedJobs: Number,
    rating: Number (1-5),
    totalRatings: Number,
    cancelledJobs: Number
  },
  // ... diğer alanlar
}
```

### Job Schema

```javascript
{
  title: String,
  description: String,
  category: enum(['electric', 'plumbing', ...]),
  price: Number,
  basePrice: Number,
  regionMultiplier: Number,
  status: enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rated']),
  customer: ObjectId (ref User),
  professional: ObjectId (ref User),
  location: { address, city, lat, lng },
  beforePhotos: [String],
  afterPhotos: [String],
  rating: Number,
  review: String,
  // ... diğer alanlar
}
```

## 🧪 Test Etme

### Postman Collection

Postman'da koleksiyonları test etmek için:

1. [Postman](https://www.postman.com/) indirin
2. `New` → `Request` seçin
3. URL: `http://localhost:5000/api/...`
4. Authorization → Bearer Token ekleyin

### cURL Examples

**Kayıt:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

**İş Talebi Oluştur:**
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Elektrik Onarımı",
    "description": "Prizlerde sorun var",
    "price": 150,
    "basePrice": 100,
    "location": {
      "address": "Kadıköy, İstanbul",
      "lat": 40.9929,
      "lng": 29.0260
    }
  }'
```

## 🚀 Production Deployment

### Environment Variables

Production için güvenli environment variables kullanın:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/usta-go
JWT_SECRET=your_very_secure_random_string_here
# ... diğer values
```

### Deployment Options

**Heroku:**
```bash
heroku create usta-go-api
git push heroku main
```

**AWS EC2:**
```bash
ssh -i key.pem ubuntu@ec2-address
git clone repo
npm install
npm start
```

**DigitalOcean:**
```bash
doctl apps create --spec app.yaml
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📝 API Response Format

Tüm responses aşağıdaki formatı takip eder:

**Success:**
```json
{
  "success": true,
  "message": "İşlem başarılı",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Hata açıklaması"
}
```

**Paginated:**
```json
{
  "success": true,
  "message": "Veriler alındı",
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## 🐛 Troubleshooting

### MongoDB Bağlantısı Başarısız

```bash
# Yerel MongoDB'yi kontrol et
mongosh

# veya MongoDB Atlas connection string'ini kontrol et
# MONGO_URI formatı doğru mu?
```

### Port Zaten Kullanımda

```bash
# Port 5000'i kullanan process'i bul
lsof -i :5000

# Process'i kapat
kill -9 PID
```

### Token Hatası

```
Error: Geçersiz veya süresi dolmuş token
```

Çözüm:
1. Token'ın hala geçerli olduğunu kontrol et
2. Authorization header'ı kontrol et: `Bearer TOKEN`
3. JWT_SECRET değeri aynı mı?

### Socket.IO Bağlantısı Başarısız

```javascript
// CORS ayarını kontrol et
const io = new SocketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});
```

## 📚 Kaynaklar

- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Socket.IO](https://socket.io/docs/)
- [JWT](https://jwt.io/)
- [Multer](https://github.com/expressjs/multer)

## 📞 Destek

Sorular veya sorunlar için:
1. GitHub Issues'da rapor edin
2. Email: support@ustago.com

## 📄 Lisans

MIT License - Açık kaynak olarak kullanılabilir.

---

**Son Güncelleme**: 2026-02-20
**Sürüm**: 1.0.0
