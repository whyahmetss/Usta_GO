import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configurations
import { connectDB } from './config/database.js';
import { setupSocket } from './utils/socket.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Load environment variables
dotenv.config();

// Get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIO(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Setup Socket.IO handlers
setupSocket(io);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Connect to MongoDB
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`\n${'═'.repeat(50)}`);
      console.log(`🚀 Usta Go API Server Başlatıldı`);
      console.log(`${'═'.repeat(50)}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🔗 Socket.IO: ws://localhost:${PORT}`);
      console.log(`📝 Ortam: ${process.env.NODE_ENV || 'development'}`);
      console.log(`${'═'.repeat(50)}\n`);
    });
  } catch (error) {
    console.error('❌ Sunucu başlatma hatası:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📛 Sunucu kapatılıyor...');
  httpServer.close(() => {
    console.log('✅ Sunucu kapatıldı');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n📛 Sunucu kapatılıyor...');
  httpServer.close(() => {
    console.log('✅ Sunucu kapatıldı');
    process.exit(0);
  });
});

// Start the server
startServer();

export { app, httpServer, io };
