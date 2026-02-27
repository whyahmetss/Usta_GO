import express from "express";
import cors from "cors";
import "express-async-errors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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
// Import middlewares
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Middlewares
app.use(cors({
  origin: '*', // Herkese izin ver
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/wallet', walletRoutes);
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
  console.log(`User connected: ${socket.id}`);

  // Join user room
  socket.on("join_room", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  });

  // Send message
  socket.on("send_message", (data) => {
    const { receiverId, message } = data;
    io.to(`user_${receiverId}`).emit("receive_message", message);
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

  // Online status
  socket.on("user_online", (userId) => {
    io.emit("user_status_changed", { userId, status: "online" });
  });

  socket.on("user_offline", (userId) => {
    io.emit("user_status_changed", { userId, status: "offline" });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

httpServer.listen(PORT, () => {
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
