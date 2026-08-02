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
