import User from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import { sendSuccess, sendError } from '../utils/sendResponse.js';
import crypto from 'crypto';

// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'Bu e-posta zaten kullanılmaktadır', 400);
    }

    // Generate referral code
    const referralCode = 'REF-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      referralCode,
    });

    // Generate token
    const token = generateToken(user._id);

    return sendSuccess(res, 'Kayıt başarılı', {
      token,
      user: user.toPublicJSON(),
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, 'E-posta ve şifre gereklidir', 400);
    }

    // Find user and get password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'E-posta veya şifre yanlış', 401);
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 'E-posta veya şifre yanlış', 401);
    }

    // Generate token
    const token = generateToken(user._id);

    return sendSuccess(res, 'Giriş başarılı', {
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    return sendSuccess(res, 'Profil bilgileri alındı', user.toPublicJSON());
  } catch (error) {
    console.error('Get me error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, address, city, skills } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name,
        phone,
        bio,
        address,
        city,
        skills,
      },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, 'Profil güncellendi', user.toPublicJSON());
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Mevcut şifre ve yeni şifre gereklidir', 400);
    }

    const user = await User.findById(req.userId).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Mevcut şifre yanlış', 401);
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 'Şifre değiştirildi');
  } catch (error) {
    console.error('Change password error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    return sendSuccess(res, 'Çıkış yapıldı');
  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, error.message, 500);
  }
};
