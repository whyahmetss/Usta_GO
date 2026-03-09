import * as reviewService from "../services/review.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

export const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user.id, req.body);
    successResponse(res, review, "Review created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const getReviewsByUsta = async (req, res, next) => {
  try {
    const { ustaId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { reviews, total } = await reviewService.getReviewsByUsta(ustaId, skip, limit);
    paginatedResponse(res, reviews, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getReviewsByJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const reviews = await reviewService.getReviewsByJob(jobId);
    successResponse(res, reviews, "Reviews fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getAllReviews();
    successResponse(res, reviews, "All reviews fetched");
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id);
    successResponse(res, null, "Değerlendirme silindi");
  } catch (error) {
    next(error);
  }
};
