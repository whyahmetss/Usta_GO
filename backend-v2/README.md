# Usta GO Backend API v2.0

Production-ready Express + Prisma + PostgreSQL REST API for Usta GO platform.

## 🎯 Features

- ✅ JWT Authentication & Authorization
- ✅ Role-Based Access Control (CUSTOMER, USTA, ADMIN)
- ✅ PostgreSQL with Prisma ORM
- ✅ Real-time Messaging with Socket.IO
- ✅ Input Validation with Zod
- ✅ Comprehensive Error Handling
- ✅ Prisma Transactions (atomic operations)
- ✅ Pagination support
- ✅ CORS enabled
- ✅ Render deployment ready

## 📋 Tech Stack

```
Node.js + Express          - REST API framework
PostgreSQL                  - Database
Prisma ORM                  - Database client & migrations
JWT                         - Authentication
Bcryptjs                    - Password hashing
Zod                         - Input validation
Socket.IO                   - Real-time messaging
```

## 📁 Project Structure

```
backend-v2/
├── src/
│   ├── routes/             # API endpoint definitions
│   │   ├── auth.routes.js
│   │   ├── job.routes.js
│   │   ├── offer.routes.js
│   │   ├── review.routes.js
│   │   ├── message.routes.js
│   │   └── admin.routes.js
│   │
│   ├── controllers/        # Request handlers & response logic
│   │   ├── auth.controller.js
│   │   ├── job.controller.js
│   │   ├── offer.controller.js
│   │   ├── review.controller.js
│   │   ├── message.controller.js
│   │   └── admin.controller.js
│   │
│   ├── services/          # Business logic & database queries
│   │   ├── auth.service.js
│   │   ├── job.service.js
│   │   ├── offer.service.js
│   │   ├── review.service.js
│   │   ├── message.service.js
│   │   └── admin.service.js
│   │
│   ├── middlewares/       # Express middlewares
│   │   ├── auth.middleware.js       # JWT verification & role checks
│   │   ├── error.middleware.js      # Error handling
│   │   └── validation.middleware.js # Zod schema validation
│   │
│   ├── validators/        # Zod validation schemas
│   │   ├── auth.validator.js
│   │   ├── job.validator.js
│   │   ├── offer.validator.js
│   │   └── review.validator.js
│   │
│   ├── utils/            # Utility functions
│   │   ├── jwt.js        # Token generation & verification
│   │   ├── password.js   # Password hashing & comparison
│   │   └── response.js   # Response formatting helpers
│   │
│   └── index.js          # Server entry point
│
├── prisma/
│   └── schema.prisma     # Database schema & ORM config
│
├── .env                  # Environment variables (development)
├── .env.example          # Example environment file
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend-v2
npm install
```

### 2. Setup Database

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL locally or use Docker
docker run --name postgres-usta -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Create database
createdb -U postgres usta_go_db

# Update DATABASE_URL in .env
```

#### Option B: PostgreSQL Cloud Service

- Get database URL from Render, Railway, Neon, Supabase, or Vercel Postgres
- Add to `.env`

```
DATABASE_URL="postgresql://user:password@host:5432/usta_go_db"
```

### 3. Run Migrations

```bash
npx prisma migrate deploy
```

Or generate migration files:

```bash
npx prisma migrate dev --name init
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on: **http://localhost:5000**

## 📚 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "CUSTOMER",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cuid123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "phone": "+1234567890"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Jobs API

#### Create Job (CUSTOMER)
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Build a Website",
  "description": "I need a professional website for my business...",
  "category": "Web Development",
  "location": "Istanbul",
  "budget": 5000
}
```

#### Get All Jobs
```http
GET /api/jobs?page=1&limit=10&category=Web%20Development&location=Istanbul&status=PENDING
```

#### Get Job Details
```http
GET /api/jobs/{jobId}
```

#### Update Job (CUSTOMER only)
```http
PUT /api/jobs/{jobId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "budget": 6000
}
```

#### Delete Job (CUSTOMER only)
```http
DELETE /api/jobs/{jobId}
Authorization: Bearer <token>
```

#### Update Job Status
```http
PATCH /api/jobs/{jobId}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

### Offers API

#### Create Offer (USTA)
```http
POST /api/offers
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job123",
  "price": 4500,
  "message": "I can complete this in 2 weeks..."
}
```

#### Get Offers for Job
```http
GET /api/offers/job/{jobId}
```

#### Get My Offers (USTA)
```http
GET /api/offers/my-offers?page=1&limit=10
Authorization: Bearer <token>
```

#### Accept Offer (CUSTOMER)
```http
PATCH /api/offers/{offerId}/accept
Authorization: Bearer <token>
```

#### Reject Offer (CUSTOMER)
```http
PATCH /api/offers/{offerId}/reject
Authorization: Bearer <token>
```

#### Withdraw Offer (USTA)
```http
PATCH /api/offers/{offerId}/withdraw
Authorization: Bearer <token>
```

### Reviews API

#### Create Review (CUSTOMER, for completed jobs)
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job123",
  "ustaId": "usta456",
  "rating": 5,
  "comment": "Excellent work! Very professional..."
}
```

#### Get Reviews by USTA
```http
GET /api/reviews/usta/{ustaId}?page=1&limit=10
```

#### Get Reviews for Job
```http
GET /api/reviews/job/{jobId}
```

### Messaging API

#### Send Message
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "user123",
  "content": "Hello! I'm interested in your offer..."
}
```

#### Get Messages with User
```http
GET /api/messages/{userId}?page=1&limit=50
Authorization: Bearer <token>
```

#### Get All Conversations
```http
GET /api/messages
Authorization: Bearer <token>
```

#### Mark Message as Read
```http
PATCH /api/messages/{messageId}/read
Authorization: Bearer <token>
```

### Admin API (ADMIN only)

#### Get All Users
```http
GET /api/admin/users?page=1&limit=10
Authorization: Bearer <token>
```

#### Ban User
```http
PATCH /api/admin/users/{userId}/ban
Authorization: Bearer <token>
```

#### Unban User
```http
PATCH /api/admin/users/{userId}/unban
Authorization: Bearer <token>
```

#### Delete User
```http
DELETE /api/admin/users/{userId}
Authorization: Bearer <token>
```

#### Get Statistics
```http
GET /api/admin/statistics
Authorization: Bearer <token>
```

#### System Health Check
```http
GET /api/admin/health
Authorization: Bearer <token>
```

## 🔐 Authentication

All protected routes require JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are valid for 7 days (configurable via `JWT_EXPIRE` env var).

## 📊 Database Schema

### User
- `id`: Unique identifier
- `name`: User full name
- `email`: Unique email
- `password`: Hashed password
- `role`: CUSTOMER | USTA | ADMIN
- `status`: ACTIVE | BANNED | SUSPENDED | DELETED
- `phone`: Optional phone number
- `bio`: Optional biography
- `profileImage`: Optional profile picture URL
- `ratings`: Average rating (0-5)
- `createdAt`, `updatedAt`: Timestamps

### Job
- `id`: Unique identifier
- `title`: Job title
- `description`: Job description
- `category`: Service category
- `location`: Job location
- `budget`: Job budget in currency
- `status`: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
- `customerId`: Reference to User (creator)
- `createdAt`, `updatedAt`: Timestamps

### Offer
- `id`: Unique identifier
- `price`: Offered price
- `message`: Optional offer message
- `status`: PENDING | ACCEPTED | REJECTED | WITHDRAWN
- `jobId`: Reference to Job
- `ustaId`: Reference to User (USTA)
- `acceptedAt`, `rejectedAt`: Timestamps
- `createdAt`, `updatedAt`: Timestamps

### Review
- `id`: Unique identifier
- `rating`: 1-5 stars
- `comment`: Optional review text
- `jobId`: Reference to Job (unique per job)
- `customerId`: Reference to User (reviewer)
- `ustaId`: Reference to User (reviewed)
- `createdAt`, `updatedAt`: Timestamps

### Message
- `id`: Unique identifier
- `content`: Message text
- `senderId`: Reference to User (sender)
- `receiverId`: Reference to User (receiver)
- `isRead`: Boolean
- `readAt`: Optional read timestamp
- `createdAt`, `updatedAt`: Timestamps

## 🔧 Available Commands

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)
npm start               # Start server (production)

# Database
npx prisma migrate dev  # Create & apply migration
npx prisma migrate deploy # Apply pending migrations
npx prisma studio      # Open Prisma Studio UI
npx prisma generate    # Generate Prisma Client

# Testing
npm test                # Run Jest tests

# Linting
npm run lint            # Run ESLint
```

## 🚀 Deployment

### Render.com (Recommended)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Set environment variables:
   ```
   DATABASE_URL = <your_postgresql_url>
   JWT_SECRET = <generate_strong_secret>
   NODE_ENV = production
   PORT = <render_will_assign>
   ```
5. Build command: `npm install`
6. Start command: `npm start`

### Other Platforms

**Railway, Heroku, Vercel:**

1. Set `DATABASE_URL` environment variable
2. Set other required env vars
3. Deploy with `npm start` as start command

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Required | PostgreSQL connection string |
| `JWT_SECRET` | Required | Secret key for JWT signing |
| `JWT_EXPIRE` | `7d` | JWT token expiration |
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment (development/production) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origins |
| `SOCKET_URL` | `http://localhost:5000` | Socket.IO server URL |

## 🐛 Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate entry)
- `500`: Server Error

## 🧪 Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "CUSTOMER"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Create Job (with token)
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Build a Website",
    "description": "Professional website needed",
    "category": "Web Development",
    "location": "Istanbul",
    "budget": 5000
  }'
```

### Using Postman

1. Import API collection (coming soon)
2. Set authorization header to Bearer token
3. Test all endpoints

## 📞 Support

For issues and questions:
- GitHub Issues: [Link to repo]
- Email: support@ustago.com

## 📄 License

MIT License - See LICENSE file

---

**Happy coding! 🚀**
