import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'escrow', 'earning', 'coupon', 'refund'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  description: String,
  relatedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'credit_card', 'bank_transfer', 'escrow'],
  },
  transactionId: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
}, { timestamps: true });

// Index for faster queries
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
