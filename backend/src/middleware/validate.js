// =============================================
// VoidPark - Zod Validation Middleware
// =============================================


/**
 * Creates an Express middleware that validates req.body
 * against the given Zod schema.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // replace with sanitized data
      next();
    } catch (err) {
      // Let the global error handler format Zod errors
      next(err);
    }
  };
};

/**
 * Creates an Express middleware that validates req.query
 * against the given Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { validate, validateQuery };
