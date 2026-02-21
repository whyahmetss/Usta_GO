# Usta Go API - Detaylı Dokümantasyon

## 📑 İçindekiler

1. [Authentication](#authentication)
2. [Jobs](#jobs)
3. [Messages](#messages)
4. [Wallet](#wallet)
5. [Upload](#upload)
6. [Error Handling](#error-handling)

---

## Authentication

### POST /api/auth/register

Yeni kullanıcı kaydı

**Request:**
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

**Parameters:**
- `name` (string, required) - Minimum 2 karakter
- `email` (string, required) - Geçerli e-posta
- `password` (string, required) - Minimum 6 karakter
- `role` (string, optional) - `customer` veya `professional` (default: customer)

**Response (201):**
```json
{
  "success": true,
  "message": "Kayıt başarılı",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "wallet": {
        "balance": 0,
        "escrow": 0,
        "coupons": []
      },
      "stats": {
        "completedJobs": 0,
        "rating": 0,
        "totalRatings": 0
      }
    }
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Bu e-posta zaten kullanılmaktadır"
}
```

---

### POST /api/auth/login

Kullanıcı girişi

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Parameters:**
- `email` (string, required)
- `password` (string, required)

**Response (200):**
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

---

### GET /api/auth/me

Oturum açan kullanıcının bilgilerini al

**Request:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil bilgileri alındı",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "avatar": "👤",
    "wallet": { ... },
    "stats": { ... }
  }
}
```

---

### PUT /api/auth/update-profile

Profil güncelle

**Request:**
```bash
curl -X PUT http://localhost:5000/api/auth/update-profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "+905551234567",
    "bio": "Experienced electrician",
    "address": "Kadıköy, Istanbul",
    "city": "Istanbul",
    "skills": ["Elektrik", "Tesisat"]
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil güncellendi",
  "data": { ... }
}
```

---

### POST /api/auth/change-password

Şifre değiştir

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword456"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Şifre değiştirildi"
}
```

---

## Jobs

### POST /api/jobs

Yeni iş talebi oluştur

**Request:**
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Elektrik Onarımı",
    "description": "Salonda prizlerde arızalar var",
    "price": 150,
    "basePrice": 100,
    "regionMultiplier": 1.5,
    "location": {
      "address": "Kadıköy, Istanbul",
      "lat": 40.9929,
      "lng": 29.0260
    },
    "category": "electric",
    "photo": "data:image/jpeg;base64,...",
    "urgent": false
  }'
```

**Parameters:**
- `title` (string, required)
- `description` (string, required)
- `price` (number, required) - Müşterinin ödeyeceği nihai fiyat
- `basePrice` (number, required) - Temel fiyat
- `regionMultiplier` (number) - Bölge çarpanı (default: 1.0)
- `location` (object, required)
  - `address` (string)
  - `lat` (number)
  - `lng` (number)
- `category` (string) - electric, plumbing, carpentry, cleaning, painting, hvac, other
- `photo` (string) - Base64 encoded image
- `urgent` (boolean) - Acil mi? (default: false)

**Response (201):**
```json
{
  "success": true,
  "message": "İş talebi oluşturuldu",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Elektrik Onarımı",
    "description": "Salonda prizlerde arızalar var",
    "price": 150,
    "status": "pending",
    "customer": {
      "_id": "...",
      "name": "John Doe",
      "avatar": "👤",
      "phone": "+905551234567"
    },
    "location": { ... },
    "createdAt": "2026-02-21T09:00:00Z"
  }
}
```

---

### GET /api/jobs

İşleri listele (filtreli)

**Request:**
```bash
curl "http://localhost:5000/api/jobs?status=pending&category=electric&page=1&limit=10&sortBy=-createdAt"
```

**Query Parameters:**
- `status` (string) - pending, accepted, in_progress, completed, cancelled, rated
- `category` (string) - electric, plumbing, ...
- `page` (number) - Sayfa numarası (default: 1)
- `limit` (number) - Sayfa başına sonuç (default: 10)
- `sortBy` (string) - Sıralama (-createdAt, price, rating, etc.)

**Response (200):**
```json
{
  "success": true,
  "message": "İşler alındı",
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

---

### GET /api/jobs/:id

İş detaylarını al

**Request:**
```bash
curl http://localhost:5000/api/jobs/507f1f77bcf86cd799439011
```

**Response (200):**
```json
{
  "success": true,
  "message": "İş detayları alındı",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Elektrik Onarımı",
    "description": "...",
    "price": 150,
    "status": "pending",
    "customer": { ... },
    "professional": null,
    "location": { ... },
    "beforePhotos": [],
    "afterPhotos": [],
    "rating": null,
    "createdAt": "2026-02-21T09:00:00Z"
  }
}
```

---

### PUT /api/jobs/:id/accept

İşi kabul et (profesyonel)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/jobs/507f1f77bcf86cd799439011/accept \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "İş kabul edildi",
  "data": {
    "_id": "...",
    "status": "accepted",
    "professional": {
      "_id": "...",
      "name": "Jane Professional",
      "avatar": "👨‍💼",
      "phone": "+905559876543"
    },
    "acceptedAt": "2026-02-21T10:00:00Z"
  }
}
```

---

### PUT /api/jobs/:id/start

İşe başla (profesyonel)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/jobs/507f1f77bcf86cd799439011/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beforePhotos": [
      "data:image/jpeg;base64,...",
      "data:image/jpeg;base64,..."
    ]
  }'
```

**Parameters:**
- `beforePhotos` (array) - Başlangıç fotoğrafları (Base64)

**Response (200):**
```json
{
  "success": true,
  "message": "İş başlatıldı",
  "data": {
    "_id": "...",
    "status": "in_progress",
    "beforePhotos": [ ... ],
    "startedAt": "2026-02-21T10:30:00Z"
  }
}
```

---

### PUT /api/jobs/:id/complete

İşi tamamla (profesyonel)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/jobs/507f1f77bcf86cd799439011/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "afterPhotos": [
      "data:image/jpeg;base64,...",
      "data:image/jpeg;base64,..."
    ]
  }'
```

**Parameters:**
- `afterPhotos` (array) - Tamamlanmış işin fotoğrafları

**Response (200):**
```json
{
  "success": true,
  "message": "İş tamamlandı",
  "data": {
    "_id": "...",
    "status": "completed",
    "afterPhotos": [ ... ],
    "completedAt": "2026-02-21T12:00:00Z"
  }
}
```

---

### PUT /api/jobs/:id/rate

İşi değerlendir (müşteri)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/jobs/507f1f77bcf86cd799439011/rate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "review": "Çok iyi bir iş, profesyonel ve hızlı"
  }'
```

**Parameters:**
- `rating` (number, required) - 1-5 arasında
- `review` (string) - Yorum

**Response (200):**
```json
{
  "success": true,
  "message": "İş değerlendirildi",
  "data": {
    "_id": "...",
    "status": "rated",
    "rating": 5,
    "review": "Çok iyi bir iş..."
  }
}
```

---

## Messages

### POST /api/messages

Mesaj gönder

**Request:**
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "507f1f77bcf86cd799439011",
    "jobId": "507f1f77bcf86cd799439012",
    "content": "Ne zaman başlayabilirsiniz?"
  }'
```

**Parameters:**
- `to` (string, required) - Alıcı user ID
- `jobId` (string, optional) - İlgili iş ID
- `content` (string, required) - Mesaj içeriği

**Response (201):**
```json
{
  "success": true,
  "message": "Mesaj gönderildi",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "from": {
      "_id": "...",
      "name": "John",
      "avatar": "👤"
    },
    "to": {
      "_id": "...",
      "name": "Jane",
      "avatar": "👩"
    },
    "content": "Ne zaman başlayabilirsiniz?",
    "read": false,
    "createdAt": "2026-02-21T10:00:00Z"
  }
}
```

---

### GET /api/messages/:userId

Bir kullanıcıyla konuşmayı al

**Request:**
```bash
curl "http://localhost:5000/api/messages/507f1f77bcf86cd799439011?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `page` (number) - Sayfa numarası
- `limit` (number) - Sayfa başına sonuç

**Response (200):**
```json
{
  "success": true,
  "message": "Mesajlar alındı",
  "data": [
    {
      "_id": "...",
      "from": { ... },
      "to": { ... },
      "content": "...",
      "read": true,
      "createdAt": "2026-02-21T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### GET /api/messages/conversations

Tüm konuşmaları al

**Request:**
```bash
curl http://localhost:5000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Konuşmalar alındı",
  "data": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "userName": "Jane Doe",
      "userAvatar": "👩",
      "lastMessage": "Tamam, pazartesi geliyorum",
      "lastMessageTime": "2026-02-21T10:00:00Z",
      "unreadCount": 0
    }
  ]
}
```

---

### PUT /api/messages/:id/read

Mesajı oku olarak işaretle

**Request:**
```bash
curl -X PUT http://localhost:5000/api/messages/507f1f77bcf86cd799439013/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Mesaj okundu olarak işaretlendi",
  "data": { ... }
}
```

---

## Wallet

### GET /api/wallet

Cüzdan bilgileri al

**Request:**
```bash
curl http://localhost:5000/api/wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cüzdan bilgileri alındı",
  "data": {
    "balance": 500.00,
    "escrow": 150.00,
    "coupons": [
      {
        "_id": "...",
        "code": "DISCOUNT10",
        "amount": 50,
        "expiresAt": "2026-03-21T00:00:00Z",
        "used": false
      }
    ],
    "totalEarnings": 5000.00
  }
}
```

---

### GET /api/wallet/transactions

İşlem geçmişini al

**Request:**
```bash
curl "http://localhost:5000/api/wallet/transactions?type=deposit&status=completed&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `type` (string) - deposit, withdrawal, escrow, earning, coupon, refund
- `status` (string) - pending, completed, failed, cancelled
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "success": true,
  "message": "İşlemler alındı",
  "data": [
    {
      "_id": "...",
      "type": "deposit",
      "amount": 500,
      "status": "completed",
      "description": "Cüzdan doldurma",
      "relatedJob": null,
      "createdAt": "2026-02-21T09:00:00Z",
      "completedAt": "2026-02-21T09:05:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST /api/wallet/topup

Cüzdan doldur

**Request:**
```bash
curl -X POST http://localhost:5000/api/wallet/topup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500
  }'
```

**Parameters:**
- `amount` (number, required) - Doldurulacak miktar

**Response (201):**
```json
{
  "success": true,
  "message": "Cüzdan dolduruldu",
  "data": {
    "balance": 1500.00,
    "transaction": {
      "_id": "...",
      "type": "deposit",
      "amount": 500,
      "status": "completed",
      "createdAt": "2026-02-21T09:00:00Z"
    }
  }
}
```

---

### POST /api/wallet/withdraw

Para çek

**Request:**
```bash
curl -X POST http://localhost:5000/api/wallet/withdraw \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 200
  }'
```

**Parameters:**
- `amount` (number, required) - Çekilecek miktar

**Response (201):**
```json
{
  "success": true,
  "message": "Para çekme talebiniz alındı",
  "data": {
    "_id": "...",
    "type": "withdrawal",
    "amount": 200,
    "status": "pending",
    "createdAt": "2026-02-21T09:00:00Z"
  }
}
```

---

### GET /api/wallet/earnings

Kazanç bilgileri (profesyonel)

**Request:**
```bash
curl http://localhost:5000/api/wallet/earnings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Kazanç bilgileri alındı",
  "data": {
    "totalEarnings": 5000.00,
    "balance": 2500.00,
    "escrow": 1500.00,
    "completedJobs": 25,
    "averageJobPrice": 200.00
  }
}
```

---

## Upload

### POST /api/upload/photo

Tek fotoğraf yükle

**Request (multipart/form-data):**
```bash
curl -X POST http://localhost:5000/api/upload/photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/image.jpg"
```

**Response (201):**
```json
{
  "success": true,
  "message": "Dosya yüklendi",
  "data": {
    "filename": "photo-1708425600123-abc123def456.jpg",
    "url": "/uploads/photos/photo-1708425600123-abc123def456.jpg",
    "size": 245632
  }
}
```

---

### POST /api/upload/photos

Çoklu fotoğraf yükle (5'e kadar)

**Request (multipart/form-data):**
```bash
curl -X POST http://localhost:5000/api/upload/photos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photos=@/path/to/image1.jpg" \
  -F "photos=@/path/to/image2.jpg" \
  -F "photos=@/path/to/image3.jpg"
```

**Response (201):**
```json
{
  "success": true,
  "message": "Dosyalar yüklendi",
  "data": [
    {
      "filename": "photo-1708425600123-abc123def456.jpg",
      "url": "/uploads/photos/photo-1708425600123-abc123def456.jpg",
      "size": 245632
    },
    {
      "filename": "photo-1708425600456-def456ghi789.jpg",
      "url": "/uploads/photos/photo-1708425600456-def456ghi789.jpg",
      "size": 312541
    }
  ]
}
```

---

## Error Handling

### Error Response Format

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Doğrulama hatası",
  "errors": [
    {
      "field": "email",
      "message": "Geçerli bir e-posta sağlayın"
    },
    {
      "field": "password",
      "message": "Şifre en az 6 karakter olmalıdır"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Geçersiz veya süresi dolmuş token"
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "message": "Bu işlemi gerçekleştirmek için admin rolü gereklidir"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "İş bulunamadı"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "İç sunucu hatası"
}
```

---

## HTTP Status Codes

| Code | Anlamı |
|------|--------|
| 200 | OK - Başarılı |
| 201 | Created - Oluşturuldu |
| 400 | Bad Request - Hatalı istek |
| 401 | Unauthorized - Yetkilendirme hatası |
| 403 | Forbidden - Yasak |
| 404 | Not Found - Bulunamadı |
| 500 | Internal Server Error - Sunucu hatası |

---

## Rate Limiting (Gelecek)

```
Rate Limit: 1000 requests per 15 minutes
```

Headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1708425900
```

---

**Son Güncelleme**: 2026-02-21
