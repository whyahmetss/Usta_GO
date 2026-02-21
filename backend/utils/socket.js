import { verifyToken } from '../config/jwt.js';

const activeUsers = new Map();

export const setupSocket = (io) => {
  // Middleware for authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token bulunamadı'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Kimlik doğrulama başarısız'));
    }
  });

  // Connection
  io.on('connection', (socket) => {
    console.log(`✅ Kullanıcı bağlandı: ${socket.userId}`);
    activeUsers.set(socket.userId, socket.id);

    // Join user room
    socket.join(`user:${socket.userId}`);

    // Broadcast user online status
    io.emit('user:online', {
      userId: socket.userId,
      timestamp: new Date(),
    });

    // Listen for job updates
    socket.on('job:accepted', (jobId) => {
      io.to(`job:${jobId}`).emit('notification:job-accepted', {
        jobId,
        acceptedBy: socket.userId,
        timestamp: new Date(),
      });
    });

    socket.on('job:started', (jobId) => {
      io.to(`job:${jobId}`).emit('notification:job-started', {
        jobId,
        startedBy: socket.userId,
        timestamp: new Date(),
      });
    });

    socket.on('job:completed', (jobId) => {
      io.to(`job:${jobId}`).emit('notification:job-completed', {
        jobId,
        completedBy: socket.userId,
        timestamp: new Date(),
      });
    });

    // Listen for messages
    socket.on('message:send', (data) => {
      const { to, content, jobId } = data;
      io.to(`user:${to}`).emit('notification:message', {
        from: socket.userId,
        to,
        content,
        jobId,
        timestamp: new Date(),
      });

      // Emit read receipt request
      io.to(`user:${to}`).emit('message:new', {
        from: socket.userId,
        to,
        content,
        jobId,
        timestamp: new Date(),
      });
    });

    // Listen for typing
    socket.on('typing:start', (data) => {
      const { to, jobId } = data;
      io.to(`user:${to}`).emit('notification:typing', {
        from: socket.userId,
        jobId,
        timestamp: new Date(),
      });
    });

    socket.on('typing:stop', (data) => {
      const { to, jobId } = data;
      io.to(`user:${to}`).emit('notification:typing-stop', {
        from: socket.userId,
        jobId,
      });
    });

    // Listen for location updates (for professionals)
    socket.on('location:update', (data) => {
      const { jobId, lat, lng } = data;
      io.to(`job:${jobId}`).emit('professional:location', {
        professionalId: socket.userId,
        jobId,
        lat,
        lng,
        timestamp: new Date(),
      });
    });

    // Join job room for real-time updates
    socket.on('job:join', (jobId) => {
      socket.join(`job:${jobId}`);
      console.log(`👤 Kullanıcı ${socket.userId} işe ${jobId} katıldı`);
    });

    socket.on('job:leave', (jobId) => {
      socket.leave(`job:${jobId}`);
      console.log(`👤 Kullanıcı ${socket.userId} işten ${jobId} ayrıldı`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Kullanıcı bağlantısı kesildi: ${socket.userId}`);
      activeUsers.delete(socket.userId);

      // Broadcast user offline status
      io.emit('user:offline', {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });
  });
};

export const getActiveUsers = () => {
  return Array.from(activeUsers.keys());
};

export const isUserActive = (userId) => {
  return activeUsers.has(userId);
};
