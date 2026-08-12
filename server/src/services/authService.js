import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';

const SALT_ROUNDS = 10;

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError('An account with this email already exists', 409, ERROR_CODES.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });
  const wallet = await Wallet.create({ userId: user._id });

  return { user, wallet };
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
