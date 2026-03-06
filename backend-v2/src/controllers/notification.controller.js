import * as notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.js';

export const createNotification = async (req, res, next) => {
  try {
    const { type, title, message, icon, jobId, targetUrl } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'title and message required' });
    }
    const notification = await notificationService.createNotification(req.user.id, {
      type, title, message, icon, jobId, targetUrl,
    });
    successResponse(res, notification, 'Notification created', 201);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(req.user.id, {
      limit: parseInt(req.query.limit) || 50,
    });
    successResponse(res, notifications, 'Notifications fetched');
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user.id);
    successResponse(res, result || {}, result ? 'Marked as read' : 'Not found');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    successResponse(res, {}, 'All marked as read');
  } catch (error) {
    next(error);
  }
};
