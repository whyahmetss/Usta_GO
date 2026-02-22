export const successResponse = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, error, message = "Error", statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

export const paginatedResponse = (res, data, page, limit, total) => {
  res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};
