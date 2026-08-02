import { Wallet } from '../models/Wallet.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';

export async function getWallet(req, res) {
  const wallet = await Wallet.findOne({ userId: req.user.id });
  if (!wallet) {
    throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
  }
  res.json({ wallet });
}
