export const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message,
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data);
};

export const sendError = (res, message, statusCode = 400) => {
  return sendResponse(res, statusCode, false, message);
};

export const sendPaginatedResponse = (res, statusCode, success, message, data, pagination) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    pagination,
  });
};
