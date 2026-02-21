import { verifyToken } from '../config/jwt.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token bulunamadı' });
    }

    // Extract token from "Bearer token" format
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Verify token
    const decoded = verifyToken(token);
    req.userId = decoded.id;

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ success: false, message: 'Kimlik doğrulama başarısız', error: error.message });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bu işlemi gerçekleştirmek için ${roles.join(' veya ')} rolü gereklidir`,
      });
    }
    next();
  };
};
