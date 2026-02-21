import Message from '../models/Message.js';
import { sendSuccess, sendError, sendPaginatedResponse } from '../utils/sendResponse.js';

// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { to, jobId, content } = req.body;

    if (!to) {
      return sendError(res, 'Alıcı gereklidir', 400);
    }

    const message = await Message.create({
      from: req.userId,
      to,
      jobId,
      content,
    });

    await message.populate('from', 'name avatar');
    await message.populate('to', 'name avatar');

    return sendSuccess(res, 'Mesaj gönderildi', message, 201);
  } catch (error) {
    console.error('Send message error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/messages/:userId
// @access  Private
export const getUserMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const total = await Message.countDocuments({
      $or: [{ from: req.userId, to: userId }, { from: userId, to: req.userId }],
    });

    const messages = await Message.find({
      $or: [{ from: req.userId, to: userId }, { from: userId, to: req.userId }],
    })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('from', 'name avatar')
      .populate('to', 'name avatar');

    const pagination = {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    };

    return sendPaginatedResponse(res, 200, true, 'Mesajlar alındı', messages.reverse(), pagination);
  } catch (error) {
    console.error('Get user messages error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/messages/job/:jobId
// @access  Private
export const getJobMessages = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const total = await Message.countDocuments({ jobId });

    const messages = await Message.find({ jobId })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('from', 'name avatar')
      .populate('to', 'name avatar');

    const pagination = {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    };

    return sendPaginatedResponse(res, 200, true, 'İş mesajları alındı', messages.reverse(), pagination);
  } catch (error) {
    console.error('Get job messages error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   PUT /api/messages/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date() },
      { new: true }
    ).populate('from', 'name avatar').populate('to', 'name avatar');

    if (!message) {
      return sendError(res, 'Mesaj bulunamadı', 404);
    }

    return sendSuccess(res, 'Mesaj okundu olarak işaretlendi', message);
  } catch (error) {
    console.error('Mark as read error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return sendError(res, 'Mesaj bulunamadı', 404);
    }

    if (message.from.toString() !== req.userId) {
      return sendError(res, 'Bu mesajı silmek için yetkiniz yok', 403);
    }

    await Message.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 'Mesaj silindi');
  } catch (error) {
    console.error('Delete message error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ from: req.userId }, { to: req.userId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$from', req.userId] }, '$to', '$from'],
          },
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$read', false] }, { $ne: ['$from', req.userId] }] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userAvatar: '$user.avatar',
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
          _id: 0,
        },
      },
    ]);

    return sendSuccess(res, 'Konuşmalar alındı', conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    return sendError(res, error.message, 500);
  }
};
