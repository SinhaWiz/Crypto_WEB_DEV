import { registerUser, loginUser } from '../services/authService.js';
import { signToken } from '../utils/jwt.js';
import { parseDurationMs } from '../utils/parseDuration.js';
import { toPublicUser } from '../utils/toPublicUser.js';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE_NAME, ERROR_CODES } from '../constants/index.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

function requireFields(body, fields) {
  const missing = fields.filter((field) => !body?.[field]);
  if (missing.length > 0) {
    throw new AppError(
      `Missing required field(s): ${missing.join(', ')}`,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      { missing }
    );
  }
}

function setAuthCookie(res, user) {
  const token = signToken({ sub: user._id.toString(), role: user.role });
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseDurationMs(env.JWT_EXPIRES_IN),
  });
}

export async function register(req, res) {
  requireFields(req.body, ['name', 'email', 'password']);
  const { name, email, password } = req.body;

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const { user, wallet } = await registerUser({ name, email, password });
  setAuthCookie(res, user);
  res.status(201).json({ user: toPublicUser(user), wallet });
}

export async function login(req, res) {
  requireFields(req.body, ['email', 'password']);
  const { email, password } = req.body;

  const user = await loginUser({ email, password });
  setAuthCookie(res, user);
  res.json({ user: toPublicUser(user) });
}

export function logout(req, res) {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.status(204).end();
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  }
  res.json({ user: toPublicUser(user) });
}
