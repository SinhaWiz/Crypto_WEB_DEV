import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';

const SALT_ROUNDS = 10;

export async function registerUser({ name, email, password, mode }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email already exists', 409, ERROR_CODES.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });
  const wallet = await Wallet.create({ userId: user._id });

  // Create a unique simulation session for the user
  const seed = crypto.randomBytes(16).toString('hex');
  const simulationSession = await SimulationSession.create({
    userId: user._id,
    seed,
    mode,
  });

  return { user, wallet, simulationSession };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401, ERROR_CODES.UNAUTHORIZED);
  }

  return user;
}
