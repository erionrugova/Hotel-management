export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // prisma errors
  if (err.code === "P2002") {
    return res.status(400).json({
      error: "Duplicate entry",
      message: "A record with this information already exists",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Record not found",
      message: "The requested resource was not found",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
      message: "The provided token is invalid",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
      message: "The provided token has expired",
    });
  }

  // validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      message: err.message,
    });
  }

  // default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    error: "Server error",
    message:
      process.env.NODE_ENV === "production" ? "Something went wrong" : message,
  });
};
