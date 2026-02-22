import * as offerService from "../services/offer.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

export const createOffer = async (req, res, next) => {
  try {
    const { jobId, ...data } = req.body;
    const offer = await offerService.createOffer(jobId, req.user.id, data);
    successResponse(res, offer, "Offer created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const getOffers = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const offers = await offerService.getOffers(jobId);
    successResponse(res, offers, "Offers fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getMyOffers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { offers, total } = await offerService.getUstaOffers(req.user.id, skip, limit);
    paginatedResponse(res, offers, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const acceptOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const offer = await offerService.acceptOffer(offerId, req.user.id);
    successResponse(res, offer, "Offer accepted successfully");
  } catch (error) {
    next(error);
  }
};

export const rejectOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const offer = await offerService.rejectOffer(offerId, req.user.id);
    successResponse(res, offer, "Offer rejected successfully");
  } catch (error) {
    next(error);
  }
};

export const withdrawOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const offer = await offerService.withdrawOffer(offerId, req.user.id);
    successResponse(res, offer, "Offer withdrawn successfully");
  } catch (error) {
    next(error);
  }
};
