import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';

export function validateRequest(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      next(
        new AppError('Request validation failed', 400, ERROR_CODES.VALIDATION_ERROR, {
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        })
      );
      return;
    }

    req.body = parsed.data.body ?? req.body;
    req.query = parsed.data.query ?? req.query;
    req.params = parsed.data.params ?? req.params;
    next();
  };
}
