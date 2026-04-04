import * as authService from "../services/auth.service.js";
import { successResponse } from "../utils/response.js";

export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    successResponse(res, result, "User registered successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    successResponse(res, result, "Login successful");
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    successResponse(res, user, "Profile fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const saveFcmToken = async (req, res, next) => {
  try {
    const result = await authService.saveFcmToken(req.user.id, req.body.fcmToken);
    successResponse(res, result, "FCM token saved");
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateUserProfile(req.user.id, req.body);
    successResponse(res, user, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

export const socialLogin = async (req, res, next) => {
  try {
    const result = await authService.socialLogin(req.body);
    successResponse(res, result, "Social login successful");
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const result = await authService.deleteAccount(req.user.id);
    successResponse(res, result, "Account deleted successfully");
  } catch (error) {
    next(error);
  }
};

