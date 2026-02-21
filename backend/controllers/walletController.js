import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { sendSuccess, sendError, sendPaginatedResponse } from '../utils/sendResponse.js';

// @route   GET /api/wallet
// @access  Private
export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    return sendSuccess(res, 'Cüzdan bilgileri alındı', {
      balance: user.wallet.balance,
      escrow: user.wallet.escrow,
      coupons: user.wallet.coupons,
      totalEarnings: user.wallet.totalEarnings,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/wallet/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const total = await Transaction.countDocuments(filter);

    const transactions = await Transaction.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('relatedJob', 'title price');

    const pagination = {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    };

    return sendPaginatedResponse(res, 200, true, 'İşlemler alındı', transactions, pagination);
  } catch (error) {
    console.error('Get transactions error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   POST /api/wallet/topup
// @access  Private
export const topupWallet = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 'Geçerli bir miktar sağlayın', 400);
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: req.userId,
      type: 'deposit',
      amount,
      status: 'completed',
      paymentMethod: 'credit_card',
    });

    // Update wallet
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { 'wallet.balance': amount } },
      { new: true }
    );

    return sendSuccess(res, 'Cüzdan dolduruldu', {
      balance: user.wallet.balance,
      transaction,
    }, 201);
  } catch (error) {
    console.error('Topup wallet error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   POST /api/wallet/withdraw
// @access  Private
export const withdrawWallet = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 'Geçerli bir miktar sağlayın', 400);
    }

    const user = await User.findById(req.userId);

    if (user.wallet.balance < amount) {
      return sendError(res, 'Yetersiz bakiye', 400);
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: req.userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      paymentMethod: 'bank_transfer',
    });

    // Update wallet
    await User.findByIdAndUpdate(
      req.userId,
      { $inc: { 'wallet.balance': -amount } }
    );

    return sendSuccess(res, 'Para çekme talebiniz alındı', transaction, 201);
  } catch (error) {
    console.error('Withdraw error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   POST /api/wallet/add-coupon
// @access  Private
export const addCoupon = async (req, res) => {
  try {
    const { code, amount, expiresAt } = req.body;

    if (!code || !amount) {
      return sendError(res, 'Kupon kodu ve miktar gereklidir', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $push: {
          'wallet.coupons': {
            code,
            amount,
            expiresAt: new Date(expiresAt),
            used: false,
          },
        },
      },
      { new: true }
    );

    return sendSuccess(res, 'Kupon eklendi', user.wallet.coupons);
  } catch (error) {
    console.error('Add coupon error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   POST /api/wallet/escrow-release/:jobId
// @access  Private (Admin)
export const releaseEscrow = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 'Geçerli bir miktar sağlayın', 400);
    }

    const user = await User.findById(req.userId);

    if (user.wallet.escrow < amount) {
      return sendError(res, 'Yetersiz escrow bakiye', 400);
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: req.userId,
      type: 'earning',
      amount,
      status: 'completed',
      relatedJob: jobId,
    });

    // Update wallet
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $inc: {
          'wallet.escrow': -amount,
          'wallet.balance': amount,
          'wallet.totalEarnings': amount,
        },
      },
      { new: true }
    );

    return sendSuccess(res, 'Escrow serbest bırakıldı', {
      balance: updatedUser.wallet.balance,
      escrow: updatedUser.wallet.escrow,
      transaction,
    });
  } catch (error) {
    console.error('Release escrow error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/wallet/earnings
// @access  Private (Professional)
export const getEarnings = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (user.role !== 'professional') {
      return sendError(res, 'Bu işlem sadece profesyoneller için geçerlidir', 403);
    }

    const earnings = {
      totalEarnings: user.wallet.totalEarnings,
      balance: user.wallet.balance,
      escrow: user.wallet.escrow,
      completedJobs: user.stats.completedJobs,
      averageJobPrice: user.stats.completedJobs > 0 ? user.wallet.totalEarnings / user.stats.completedJobs : 0,
    };

    return sendSuccess(res, 'Kazanç bilgileri alındı', earnings);
  } catch (error) {
    console.error('Get earnings error:', error);
    return sendError(res, error.message, 500);
  }
};
