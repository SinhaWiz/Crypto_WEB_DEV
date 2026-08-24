import mongoose from 'mongoose';
import { Wallet } from '../models/Wallet.js';
import { AppError } from '../utils/AppError.js';
import {
  ERROR_CODES,
  POINTS_EXCHANGE_RATE_BDT,
  STIPEND_ELIGIBLE_CASH_BDT,
  STIPEND_ELIGIBLE_POINTS,
  STIPEND_CASH_BDT,
  STIPEND_POINTS,
  STIPEND_COOLDOWN_MS,
} from '../constants/index.js';

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

/**
 * Whether a wallet is "stuck" enough to qualify for the daily stipend, and
 * when its next claim opens up. Shared by getWallet (to drive the UI) and
 * claimDailyStipend (to actually enforce it).
 */
export function getStipendStatus(wallet) {
  const isLow = wallet.cashBalanceBDT < STIPEND_ELIGIBLE_CASH_BDT && wallet.virtualPoints < STIPEND_ELIGIBLE_POINTS;

  const availableAt = wallet.lastStipendClaimedAt
    ? new Date(wallet.lastStipendClaimedAt.getTime() + STIPEND_COOLDOWN_MS)
    : null;
  const cooledDown = !availableAt || availableAt.getTime() <= Date.now();

  return {
    eligible: isLow && cooledDown,
    lowBalance: isLow,
    availableAt: cooledDown ? null : availableAt,
    amount: { cashBDT: STIPEND_CASH_BDT, points: STIPEND_POINTS },
  };
}

/**
 * Top up a genuinely stuck wallet — too little cash to buy a point, too few
 * points to place a prediction or trigger a market event — once every 24h.
 */
export async function claimDailyStipend(userId) {
  const mongoSession = await mongoose.startSession();
  let wallet;
  try {
    await mongoSession.withTransaction(async () => {
      wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }

      const status = getStipendStatus(wallet);
      if (!status.lowBalance) {
        throw new AppError("Your wallet isn't low enough to need a stipend yet", 400, ERROR_CODES.VALIDATION_ERROR);
      }
      if (!status.eligible) {
        const hoursLeft = Math.ceil((status.availableAt.getTime() - Date.now()) / (60 * 60 * 1000));
        throw new AppError(`Come back in ${hoursLeft}h for your next stipend`, 409, ERROR_CODES.CONFLICT);
      }

      wallet.cashBalanceBDT += STIPEND_CASH_BDT;
      wallet.virtualPoints += STIPEND_POINTS;
      wallet.lastStipendClaimedAt = new Date();
      await wallet.save({ session: mongoSession });
    });

    return { wallet };
  } finally {
    await mongoSession.endSession();
  }
}
