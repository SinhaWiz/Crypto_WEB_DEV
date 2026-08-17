import mongoose from 'mongoose';
import { Wallet } from '../models/Wallet.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES, POINTS_EXCHANGE_RATE_BDT } from '../constants/index.js';

function assertValidPointsToBuy(pointsToBuy) {
  if (typeof pointsToBuy !== 'number' || !Number.isFinite(pointsToBuy) || pointsToBuy <= 0) {
    throw new AppError('Points to buy must be a positive number', 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

/**
 * Buy virtual points with cash balance, at the fixed exchange rate of
 * 1 point = POINTS_EXCHANGE_RATE_BDT taka.
 */
export async function buyPoints({ userId, pointsToBuy }) {
  assertValidPointsToBuy(pointsToBuy);
  const costBDT = pointsToBuy * POINTS_EXCHANGE_RATE_BDT;

  const mongoSession = await mongoose.startSession();
  try {
    let wallet;
    await mongoSession.withTransaction(async () => {
      wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }
      if (wallet.cashBalanceBDT < costBDT) {
        throw new AppError('Insufficient balance to buy this many points', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      wallet.cashBalanceBDT -= costBDT;
      wallet.virtualPoints += pointsToBuy;
      await wallet.save({ session: mongoSession });
    });

    return { wallet };
  } finally {
    await mongoSession.endSession();
  }
}
