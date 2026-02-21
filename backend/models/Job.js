import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'İş başlığı gereklidir'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'İş açıklaması gereklidir'],
  },
  category: {
    type: String,
    enum: ['electric', 'plumbing', 'carpentry', 'cleaning', 'painting', 'hvac', 'other'],
    default: 'other',
  },

  // Pricing
  price: {
    type: Number,
    required: [true, 'Fiyat gereklidir'],
    min: [0, 'Fiyat negatif olamaz'],
  },
  basePrice: {
    type: Number,
    required: true,
  },
  regionMultiplier: {
    type: Number,
    default: 1.0,
  },
  couponApplied: {
    couponId: mongoose.Schema.Types.ObjectId,
    couponCode: String,
    discountAmount: Number,
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rated'],
    default: 'pending',
  },

  // Users
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Location
  location: {
    address: String,
    city: {
      type: String,
      default: 'Istanbul',
    },
    lat: {
      type: Number,
      required: true,
      default: 40.9929,
    },
    lng: {
      type: Number,
      required: true,
      default: 29.0260,
    },
  },

  // Photos
  photo: String,
  beforePhotos: [String],
  afterPhotos: [String],

  // Rating & Review
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  review: String,

  // Urgent
  urgent: {
    type: Boolean,
    default: false,
  },

  // Escrow
  escrow: {
    type: Number,
    default: 0,
  },
  escrowReleased: {
    type: Boolean,
    default: false,
  },

  // Complaint
  complaint: {
    id: String,
    reason: String,
    details: String,
    filedBy: mongoose.Schema.Types.ObjectId,
    filedAt: Date,
    status: {
      type: String,
      enum: ['open', 'resolved', 'rejected'],
      default: 'open',
    },
  },

  // Timestamps
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for faster queries
jobSchema.index({ customer: 1, status: 1 });
jobSchema.index({ professional: 1, status: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
export default Job;
