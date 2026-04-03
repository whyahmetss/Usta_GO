import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "express-async-errors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { initFirebase } from "./utils/firebase.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import jobRoutes from "./routes/job.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import messageRoutes from "./routes/message.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import walletRoutes from './routes/wallet.routes.js';
import uploadRoutes from "./routes/upload.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import packageRoutes from "./routes/package.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import supportRoutes from "./routes/support.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import prisma from "./utils/prisma.js";
import * as shopierService from "./services/shopier.service.js";
// Import middlewares
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Firebase Admin SDK for push notifications
initFirebase();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = [
        'https://usta-go.com', 'https://www.usta-go.com',
        'https://panel.usta-go.com', 'capacitor://app.usta-go.com',
        'https://app.usta-go.com',
        ...(NODE_ENV === 'development' ? ['http://localhost:5173','http://localhost:5174'] : []),
      ];
      if (allowed.includes(origin)) return cb(null, true);
      cb(null, true); // Socket.IO için geniş tut
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Middlewares
const allowedOrigins = [
  'https://usta-go.com',
  'https://www.usta-go.com',
  'https://panel.usta-go.com',
  'capacitor://app.usta-go.com',
  'https://app.usta-go.com',
  'https://usta-v3vu.onrender.com',
  ...(NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'] : []),
];

app.use(cors({
  origin: (origin, cb) => {
    // Native Capacitor app veya curl gibi origin'siz istekler
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} izin verilmedi`));
  },
  credentials: true,
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Cloudinary img'leri için
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek, lütfen bekleyin.' },
  skip: (req) => NODE_ENV === 'development',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 15 dakikada max 20 login/register denemesi
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla giriş denemesi, 15 dakika bekleyin.' },
  skip: (req) => NODE_ENV === 'development',
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 10, // dakikada 10 AI isteği
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI istek limiti aşıldı, 1 dakika bekleyin.' },
  skip: (req) => NODE_ENV === 'development',
});

app.use(generalLimiter);

// Request logging — sadece development
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/otp",  authLimiter, otpRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/wallet', walletRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/services",  serviceRoutes);
app.use("/api/ai",        aiLimiter, aiRoutes);
app.use("/api/packages",  packageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/certificates", certificateRoutes);
// Public campaign (müşteri ana sayfası) - index'te, campaign router'dan önce
app.get("/api/campaigns/active", async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!campaign) return res.json({ data: null });
    res.json({
      data: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description || "",
        badge_text: campaign.badgeText || "",
        button_text: campaign.buttonText || "",
        bg_color: campaign.bgColor,
        badge_color: campaign.badgeColor,
        text_color: campaign.textColor,
        bg_image: campaign.bgImage || null,
        icon_type: campaign.iconType || null,
        icon_image: campaign.iconImage || null,
        active: campaign.active,
        updatedAt: campaign.updatedAt,
      },
    });
  } catch (err) {
    console.error("Campaign active error:", err);
    res.json({ data: null });
  }
});
app.use("/api/campaigns", campaignRoutes);
app.use("/api/support", supportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Socket.IO events
io.on("connection", (socket) => {
  // Join user room
  socket.on("join_room", (userId) => {
    socket.join(`user_${userId}`);
  });

  // Join support room (for admin/support agents to get all support notifications)
  socket.on("join_support_room", () => {
    socket.join("support_room");
  });

  // Send message
  socket.on("send_message", (data) => {
    const { receiverId, message } = data;
    io.to(`user_${receiverId}`).emit("receive_message", message);
    // Also notify support_room so admins/agents on the dashboard see it
    io.to("support_room").emit("support_new_message", message);
  });

  // New job created - notify all professionals
  socket.on("new_job", (jobData) => {
    socket.broadcast.emit("new_job_available", jobData);
  });

  // Job status changed - notify relevant users
  socket.on("job_status_changed", (data) => {
    const { jobId, status, customerId, professionalId } = data;
    if (customerId) {
      io.to(`user_${customerId}`).emit("job_updated", { jobId, status });
    }
    if (professionalId) {
      io.to(`user_${professionalId}`).emit("job_updated", { jobId, status });
    }
  });

  // Job accepted - notify customer
  socket.on("job_accepted", (data) => {
    const { customerId, jobId, professionalName } = data;
    io.to(`user_${customerId}`).emit("job_updated", {
      jobId,
      status: "accepted",
      message: `${professionalName} işinizi kabul etti!`
    });
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const { receiverId, userId } = data;
    io.to(`user_${receiverId}`).emit("user_typing", { userId });
  });

  socket.on("stop_typing", (data) => {
    const { receiverId, userId } = data;
    io.to(`user_${receiverId}`).emit("user_stop_typing", { userId });
  });

  // Usta real-time location update → broadcast to job room
  socket.on("usta_location_update", (data) => {
    const { jobId, lat, lng, heading } = data;
    if (jobId && lat && lng) {
      io.to(`job_${jobId}`).emit("location_updated", { lat, lng, heading: heading || 0 });
    }
  });

  // Join job room (for live tracking)
  socket.on("join_job_room", (jobId) => {
    socket.join(`job_${jobId}`);
  });

  socket.on("leave_job_room", (jobId) => {
    socket.leave(`job_${jobId}`);
  });

  // Usta yola çıktı → job room + müşteri odasına bildir
  socket.on("usta_on_the_way", (data) => {
    const { jobId, customerId } = data;
    if (jobId) io.to(`job_${jobId}`).emit("usta_on_the_way");
    if (customerId) io.to(`user_${customerId}`).emit("usta_on_the_way");
  });

  // Online status
  socket.on("user_online", (userId) => {
    io.emit("user_status_changed", { userId, status: "online" });
  });

  socket.on("user_offline", (userId) => {
    io.emit("user_status_changed", { userId, status: "offline" });
  });

  socket.on("disconnect", () => {
    // intentionally empty
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════╗
║  🚀 Usta GO Backend Server                ║
╚═══════════════════════════════════════════╝

  Environment: ${NODE_ENV}
  Server URL: http://localhost:${PORT}
  API Base: http://localhost:${PORT}/api
  Socket.IO: ws://localhost:${PORT}

  Ready to accept connections!
`);

  // Shopier webhook kaydı (PAT varsa)
  if (process.env.SHOPIER_PAT) {
    try {
      const baseUrl = (process.env.IYZIPAY_CALLBACK_BASE || process.env.API_BASE_URL || '').replace(/\/$/, '');
      const webhookUrl = `${baseUrl}/api/wallet/topup/shopier/webhook`;
      const existing = await shopierService.listWebhooks();
      const items = existing?.data || existing || [];
      const alreadyRegistered = Array.isArray(items) && items.some(w => w.url === webhookUrl && w.event === 'order.created');
      if (!alreadyRegistered) {
        await shopierService.createWebhook(webhookUrl, 'order.created');
        console.log('  ✅ Shopier webhook kaydedildi:', webhookUrl);
      } else {
        console.log('  ✅ Shopier webhook zaten kayıtlı');
      }
    } catch (err) {
      console.warn('  ⚠️  Shopier webhook kaydı başarısız:', err.message);
    }
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n📛 Shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

export { app, httpServer, io };
