import * as jobService from "../services/job.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

export const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.user.id, req.body);
    successResponse(res, job, "Job created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      category: req.query.category,
      location: req.query.location,
      status: req.query.status,
    };

    const { jobs, total } = await jobService.getJobs(filters, skip, limit);
    paginatedResponse(res, jobs, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    successResponse(res, job, "Job fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const job = await jobService.updateJob(req.params.id, req.user.id, req.body);
    successResponse(res, job, "Job updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const result = await jobService.deleteJob(req.params.id, req.user.id);
    successResponse(res, result, "Job deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getMyJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { jobs, total } = await jobService.getCustomerJobs(req.user.id, skip, limit);
    paginatedResponse(res, jobs, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const updateJobStatus = async (req, res, next) => {
  try {
    const job = await jobService.updateJobStatus(req.params.id, req.user.id, req.body.status);
    successResponse(res, job, "Job status updated successfully");
  } catch (error) {
    next(error);
  }
};

export const acceptJob = async (req, res, next) => {
  try {
    const job = await jobService.acceptJob(req.params.id, req.user.id);
    successResponse(res, job, "Job accepted successfully");
  } catch (error) {
    next(error);
  }
};
