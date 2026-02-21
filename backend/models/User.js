import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Lütfen bir isim sağlayın'],
    trim: true,
    minlength: [2, 'İsim en az 2 karakter olmalıdır'],
  },
  email: {
    type: String,
    required: [true, 'Lütfen bir e-posta sağlayın'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Lütfen geçerli bir e-posta sağlayın'],
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Lütfen bir şifre sağlayın'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
    select: false,
  },

  // Role & Status
  role: {
    type: String,
    enum: ['customer', 'professional', 'admin'],
    default: 'customer',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },

  // Profile
  avatar: {
    type: String,
    default: '👤',
  },
  profilePhoto: {
    type: String,
  },
  bio: {
    type: String,
    default: '',
  },
  skills: [String],

  // Professional Info
  profession: {
    type: String,
  },
  yearsOfExperience: {
    type: Number,
    default: 0,
  },
  certifications: [String],

  // Wallet & Finance
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Bakiye negatif olamaz'],
    },
    escrow: {
      type: Number,
      default: 0,
    },
    coupons: [
      {
        code: String,
        amount: Number,
        expiresAt: Date,
        used: Boolean,
        usedOn: Date,
      },
    ],
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },

  // Stats
  stats: {
    completedJobs: {
      type: Number,
      default: 0,
    },
    pendingJobs: {
      type: Number,
      default: 0,
    },
    cancelledJobs: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    responseTime: {
      type: String,
      default: 'Belirsiz',
    },
  },

  // Location
  address: {
    type: String,
  },
  city: {
    type: String,
    default: 'Istanbul',
  },
  lat: {
    type: Number,
  },
  lng: {
    type: Number,
  },

  // Referral
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Settings
  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Method to get public profile
userSchema.methods.toPublicJSON = function() {
  const { password, ...rest } = this.toObject();
  return rest;
};

const User = mongoose.model('User', userSchema);
export default User;
