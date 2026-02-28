import * as complaintService from "../services/complaint.service.js";
import { successResponse } from "../utils/response.js";

export const createComplaint = async (req, res, next) => {
  try {
    const filedById = req.body.filedBy || req.user.id;
    const complaint = await complaintService.createComplaint(filedById, req.body);
    successResponse(res, complaint, "Complaint filed successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const getAllComplaints = async (req, res, next) => {
  try {
    const complaints = await complaintService.getAllComplaints();
    successResponse(res, complaints, "Complaints fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const resolveComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await complaintService.resolveComplaint(id);
    successResponse(res, complaint, "Complaint resolved");
  } catch (error) {
    next(error);
  }
};

export const rejectComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await complaintService.rejectComplaint(id);
    successResponse(res, complaint, "Complaint rejected");
  } catch (error) {
    next(error);
  }
};
