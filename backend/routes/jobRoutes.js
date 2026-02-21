import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  getUserJobs,
  acceptJob,
  startJob,
  completeJob,
  cancelJob,
  rateJob,
  deleteJob,
} from '../controllers/jobController.js';
import { protect } from '../middleware/auth.js';
import { validateCreateJob } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected routes
router.post('/', protect, validateCreateJob, createJob);
router.get('/user/:userId', getUserJobs);
router.put('/:id/accept', protect, acceptJob);
router.put('/:id/start', protect, startJob);
router.put('/:id/complete', protect, completeJob);
router.put('/:id/cancel', protect, cancelJob);
router.put('/:id/rate', protect, rateJob);
router.delete('/:id', protect, deleteJob);

export default router;
