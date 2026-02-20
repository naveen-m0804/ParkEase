// =============================================
// VoidPark - Global Error Handler Middleware
// =============================================

const config = require('../config/index');

/**
 * Catch 404 - Route not found
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
  });
};

/**
 * Global error handler
 * All unhandled errors come here
 */
const errorHandler = (err, req, res, _next) => {
  console.error('💥 Error:', err.message);

  if (config.isDev) {
    console.error(err.stack);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      data: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      status: 'error',
      message: 'A record with this data already exists.',
      data: null,
    });
  }

  // PostgreSQL exclusion constraint (overlapping bookings)
  if (err.code === '23P01') {
    return res.status(409).json({
      status: 'error',
      message: 'This time slot is already booked. Please select a different time.',
      data: null,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      status: 'error',
      message: 'Referenced record does not exist.',
      data: null,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: config.isDev ? err.message : 'Internal server error',
    data: config.isDev ? { stack: err.stack } : null,
  });
};

module.exports = { notFound, errorHandler };
