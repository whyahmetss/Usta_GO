import * as adminService from "../services/admin.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { users, total } = await adminService.getAllUsers(skip, limit);
    paginatedResponse(res, users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const banUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await adminService.banUser(userId);
    successResponse(res, user, "User banned successfully");
  } catch (error) {
    next(error);
  }
};

export const unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await adminService.unbanUser(userId);
    successResponse(res, user, "User unbanned successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await adminService.deleteUser(userId);
    successResponse(res, result, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const result = await adminService.deleteJob(jobId);
    successResponse(res, result, "Job deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const result = await adminService.deleteOffer(offerId);
    successResponse(res, result, "Offer deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req, res, next) => {
  try {
    const stats = await adminService.getStatistics();
    successResponse(res, stats, "Statistics fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getSystemHealth = async (req, res, next) => {
  try {
    const health = await adminService.getSystemHealth();
    successResponse(res, health, "System health check completed");
  } catch (error) {
    next(error);
  }
};
