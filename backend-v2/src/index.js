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

// Import middlewares
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
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
