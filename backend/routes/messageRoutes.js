import express from 'express';
import {
  sendMessage,
  getUserMessages,
  getJobMessages,
  markAsRead,
  deleteMessage,
  getConversations,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validateSendMessage } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Message routes
router.post('/', validateSendMessage, sendMessage);
router.get('/conversations', getConversations);
router.get('/:userId', getUserMessages);
router.get('/job/:jobId', getJobMessages);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteMessage);

export default router;
