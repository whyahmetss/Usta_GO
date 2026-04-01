import { ZodError } from "zod";

/** Amele bot'a hata bildirimi gönder (fire-and-forget, 500 hatalarında) */
async function notifyAmeleOnError(err, req) {
  const apiKey = process.env.INTERNAL_API_KEY;
  if (!apiKey) return;

  try {
    await fetch("https://amele.onrender.com/internal/error-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        servis: "ustago-backend",
        endpoint: req.path || req.url,
        hata_mesaji: err.message,
        stack_trace: err.stack,
        onem: "high",
      }),
    });
  } catch (e) {
    console.error("Amele bildirim gönderilemedi:", e.message);
  }
}

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

  // Default error (500) - Amele bot'a bildirim
  const status = err.statusCode || err.status || 500;
  if (status >= 500 && process.env.INTERNAL_API_KEY) {
    notifyAmeleOnError(err, req).catch(() => {});
  }
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    error: isProd && status >= 500 ? 'Sunucu hatası' : (err.message || 'Internal server error'),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};
