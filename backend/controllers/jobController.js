import Job from '../models/Job.js';
import User from '../models/User.js';
import { sendSuccess, sendError, sendPaginatedResponse } from '../utils/sendResponse.js';

// @route   POST /api/jobs
// @access  Private
export const createJob = async (req, res) => {
  try {
    const { title, description, price, basePrice, regionMultiplier, location, category, photo, urgent } = req.body;

    const job = await Job.create({
      title,
      description,
      price,
      basePrice,
      regionMultiplier: regionMultiplier || 1.0,
      location: {
        address: location?.address || 'Istanbul',
        city: location?.city || 'Istanbul',
        lat: location?.lat || 40.9929,
        lng: location?.lng || 29.0260,
      },
      category: category || 'other',
      photo,
      urgent: urgent || false,
      customer: req.userId,
      status: 'pending',
    });

    await job.populate('customer', 'name avatar phone');

    return sendSuccess(res, 'İş talebi oluşturuldu', job, 201);
  } catch (error) {
    console.error('Create job error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10, sortBy = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'name avatar phone rating stats')
      .populate('professional', 'name avatar phone rating stats');

    const pagination = {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    };

    return sendPaginatedResponse(res, 200, true, 'İşler alındı', jobs, pagination);
  } catch (error) {
    console.error('Get jobs error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customer', 'name avatar phone email rating stats')
      .populate('professional', 'name avatar phone email rating stats');

    if (!job) {
      return sendError(res, 'İş bulunamadı', 404);
    }

    return sendSuccess(res, 'İş detayları alındı', job);
  } catch (error) {
    console.error('Get job by id error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   GET /api/jobs/user/:userId
// @access  Private
export const getUserJobs = async (req, res) => {
  try {
    const { role } = req.query;
    const { userId } = req.params;

    let filter = {};
    if (role === 'customer') {
      filter.customer = userId;
    } else if (role === 'professional') {
      filter.professional = userId;
    }

    const jobs = await Job.find(filter)
      .populate('customer', 'name avatar phone')
      .populate('professional', 'name avatar phone')
      .sort('-createdAt');

    return sendSuccess(res, 'Kullanıcı işleri alındı', jobs);
  } catch (error) {
    console.error('Get user jobs error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   PUT /api/jobs/:id/accept
// @access  Private
export const acceptJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return sendError(res, 'İş bulunamadı', 404);
    }

    if (job.status !== 'pending') {
      return sendError(res, 'Bu iş artık kabul edilemiyor', 400);
    }

    job.professional = req.userId;
    job.status = 'accepted';
    job.acceptedAt = new Date();
    await job.save();

    // Update professional stats
    await User.findByIdAndUpdate(
      req.userId,
      { $inc: { 'stats.pendingJobs': 1 } }
    );

    await job.populate('customer', 'name avatar phone');
    await job.populate('professional', 'name avatar phone');

    return sendSuccess(res, 'İş kabul edildi', job);
  } catch (error) {
    console.error('Accept job error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   PUT /api/jobs/:id/start
// @access  Private
export const startJob = async (req, res) => {
  try {
    const { beforePhotos } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return sendError(res, 'İş bulunamadı', 404);
    }

    if (job.status !== 'accepted') {
      return sendError(res, 'Bu iş başlatılamaz', 400);
    }

    job.status = 'in_progress';
    job.startedAt = new Date();
    job.beforePhotos = beforePhotos || [];
    await job.save();

    await job.populate('customer', 'name avatar phone');
    await job.populate('professional', 'name avatar phone');

    return sendSuccess(res, 'İş başlatıldı', job);
  } catch (error) {
    console.error('Start job error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   PUT /api/jobs/:id/complete
// @access  Private
export const completeJob = async (req, res) => {
  try {
    const { afterPhotos } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return sendError(res, 'İş bulunamadı', 404);
    }

    if (job.status !== 'in_progress') {
      return sendError(res, 'Bu iş tamamlanamaz', 400);
    }

    job.status = 'completed';
    job.completedAt = new Date();
    job.afterPhotos = afterPhotos || [];
    await job.save();

    // Add escrow to professional wallet
    await User.findByIdAndUpdate(
      job.professional,
      {
        $inc: {
          'wallet.escrow': job.price,
          'stats.completedJobs': 1,
          'stats.pendingJobs': -1,
        },
      }
    );

    await job.populate('customer', 'name avatar phone');
    await job.populate('professional', 'name avatar phone');

    return sendSuccess(res, 'İş tamamlandı', job);
  } catch (error) {
    console.error('Complete job error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   PUT /api/jobs/:id/cancel
// @access  Private
export const cancelJob = async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return sendError(res, 'İş bulunamadı', 404);
    }

    if (['completed', 'cancelled', 'rated'].includes(job.status)) {
      return sendError(res, 'Bu iş iptal edilemiyor', 400);
    }

    job.status = 'cancelled';
    job.cancelledAt = new Date();
    await job.save();

    // Update professional stats if job was accepted
    if (job.professional) {
      await User.findByIdAndUpdate(
        job.professional,
        {
          $inc: {
            'stats.pendingJobs': -1,
            'stats.cancelledJobs': 1,
          },
        }
      );
    }

    await job.populate('customer', 'name avatar phone');
    await job.populate('professional', 'name avatar phone');

    return sendSuccess(res, 'İş iptal edildi', job);
  } catch (error) {
    console.error('Cancel job error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   PUT /api/jobs/:id/rate
// @access  Private
export const rateJob = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return sendError(res, 'İş bulunamadı', 404);
    }

    if (job.status !== 'completed') {
      return sendError(res, 'Tamamlanmamış işler değerlendirilemiyor', 400);
    }

    job.rating = rating;
    job.review = review;
    job.status = 'rated';
    await job.save();

    // Update professional rating
    const professional = await User.findById(job.professional);
    const totalRatings = professional.stats.totalRatings + 1;
    const currentRating = professional.stats.rating || 0;
    const newRating = (currentRating * (totalRatings - 1) + rating) / totalRatings;

    await User.findByIdAndUpdate(
      job.professional,
      {
        'stats.rating': newRating,
        'stats.totalRatings': totalRatings,
      }
    );

    await job.populate('customer', 'name avatar phone');
    await job.populate('professional', 'name avatar phone');

    return sendSuccess(res, 'İş değerlendirildi', job);
  } catch (error) {
    console.error('Rate job error:', error);
    return sendError(res, error.message, 500);
  }
};

// @route   DELETE /api/jobs/:id
// @access  Private (Customer only)
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return sendError(res, 'İş bulunamadı', 404);
    }

    if (job.customer.toString() !== req.userId) {
      return sendError(res, 'Bu işi silmek için yetkiniz yok', 403);
    }

    await Job.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 'İş silindi');
  } catch (error) {
    console.error('Delete job error:', error);
    return sendError(res, error.message, 500);
  }
};
