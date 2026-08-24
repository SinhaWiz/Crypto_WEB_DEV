import { registerUser, loginUser } from '../services/authService.js';
import { signToken } from '../utils/jwt.js';
import { parseDurationMs } from '../utils/parseDuration.js';
import { toPublicUser } from '../utils/toPublicUser.js';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE_NAME, ERROR_CODES } from '../constants/index.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { SimulationSession } from '../models/SimulationSession.js';

const PRICE_MODES = ['simulated', 'real'];

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
    secure: true,               // always true for cross-site
    sameSite: 'none',           // required for Vercel ↔ Render
    maxAge: parseDurationMs(env.JWT_EXPIRES_IN),
  });
}

export async function register(req, res) {
  requireFields(req.body, ['name', 'email', 'password']);
  const { name, email, password } = req.body;

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const mode = PRICE_MODES.includes(req.body.mode) ? req.body.mode : 'simulated';

  const { user, wallet, simulationSession } = await registerUser({ name, email, password, mode });
  setAuthCookie(res, user);
  res.status(201).json({ user: toPublicUser(user), wallet, mode: simulationSession.mode });
}

export async function login(req, res) {
  requireFields(req.body, ['email', 'password']);
  const { email, password } = req.body;

  const user = await loginUser({ email, password });
  setAuthCookie(res, user);

  // Return wallet + mode alongside user so the client can set all three without extra round-trips
  const wallet = await Wallet.findOne({ userId: user._id });
  const session = await SimulationSession.findOne({ userId: user._id }).select('mode');
  res.json({ user: toPublicUser(user), wallet, mode: session?.mode ?? 'simulated' });
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
  const session = await SimulationSession.findOne({ userId: user._id }).select('mode');
  res.json({ user: toPublicUser(user), mode: session?.mode ?? 'simulated' });
}
