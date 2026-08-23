import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE_NAME, ERROR_CODES } from '../constants/index.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    next(new AppError('Authentication required', 401, ERROR_CODES.UNAUTHORIZED));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError('Invalid or expired session', 401, ERROR_CODES.UNAUTHORIZED));
  }
}

/**
 * Optional auth for routes that are public but want to personalize the
 * response when a valid session cookie IS present (e.g. picking a user's
 * price mode). Never use this to gate access — it never rejects the request,
 * it just leaves `req.user` unset when there's no valid session.
 */
export function attachUserIfPresent(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Invalid/expired token — treat the same as no token, don't block the request.
  }

  next();
}
