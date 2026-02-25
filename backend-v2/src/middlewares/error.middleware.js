import { ZodError } from "zod";

export const errorHandler = (err, req, res, _next) => {
  console.error("Error:", err);

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({ error: "Unique constraint violation" });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};
