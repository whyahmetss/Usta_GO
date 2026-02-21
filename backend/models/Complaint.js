import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reported: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    enum: ['late', 'not_working', 'rude', 'other'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'rejected'],
    default: 'open',
  },
  resolution: String,
  evidence: [String],
  resolvedBy: mongoose.Schema.Types.ObjectId,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: Date,
}, { timestamps: true });

// Index for faster queries
complaintSchema.index({ jobId: 1 });
complaintSchema.index({ reporter: 1 });
complaintSchema.index({ reported: 1 });
complaintSchema.index({ status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
