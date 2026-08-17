import { Wallet } from '../models/Wallet.js';
import { buyPoints as buyPointsTransaction } from '../services/walletService.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';

function requireFields(body, fields) {
  const missing = fields.filter((field) => body?.[field] === undefined || body?.[field] === null);
  if (missing.length > 0) {
    throw new AppError(
      `Missing required field(s): ${missing.join(', ')}`,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      { missing }
    );
  }
}

export async function getWallet(req, res) {
  const wallet = await Wallet.findOne({ userId: req.user.id });
  if (!wallet) {
    throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
  }
  res.json({ wallet });
}

export async function buyPoints(req, res) {
  requireFields(req.body, ['pointsToBuy']);
  const { pointsToBuy } = req.body;

  const { wallet } = await buyPointsTransaction({
    userId: req.user.id,
    pointsToBuy: Number(pointsToBuy),
  });

  res.status(201).json({ wallet });
}
