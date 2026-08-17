import mongoose from 'mongoose';
import { Wallet } from '../models/Wallet.js';
import { PortfolioHolding } from '../models/PortfolioHolding.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { getLatestSimulatedPrice, getAnchorPriceBDT } from './simulation/engine.js';
import { evaluateAchievements } from './achievementService.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES, SUPPORTED_SYMBOLS, TRADE_FEE_RATE } from '../constants/index.js';

function assertValidSymbol(symbol) {
  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    throw new AppError(`Unsupported symbol "${symbol}"`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

function assertValidQuantity(quantity) {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
    throw new AppError('Quantity must be a positive number', 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

/**
 * Resolve the current execution price (BDT) for a user+symbol from their
 * own simulation session — trades always execute against the acting
 * user's own simulated price path, never a shared/global price.
 */
async function resolveExecutionPrice(userId, symbol) {
  const session = await SimulationSession.findOne({ userId, status: 'active' });
  if (!session) {
    throw new AppError('No active simulation session for this user', 409, ERROR_CODES.CONFLICT);
  }
  const latestTick = await getLatestSimulatedPrice(session._id, symbol);
  const priceBDT = latestTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));
  return { priceBDT, session };
}

/**
 * Execute a market buy: atomically debits wallet cash and updates the
 * user's holding using average-cost basis.
 *
 * Requires MongoDB running as a replica set (transactions are not
 * supported on a standalone mongod).
 */
export async function executeBuy(params) {
  const result = await executeBuyTransaction(params);
  await evaluateAchievements(params.userId).catch((err) =>
    console.error('[achievements] evaluation failed:', err.message)
  );
  return result;
}

async function executeBuyTransaction({ userId, symbol, quantity }) {
  assertValidSymbol(symbol);
  assertValidQuantity(quantity);

  const { priceBDT } = await resolveExecutionPrice(userId, symbol);
  const costBDT = priceBDT * quantity;
  const feeBDT = costBDT * TRADE_FEE_RATE;
  const totalDebitBDT = costBDT + feeBDT;

  const mongoSession = await mongoose.startSession();
  try {
    let result;
    await mongoSession.withTransaction(async () => {
      const wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }
      if (wallet.cashBalanceBDT < totalDebitBDT) {
        throw new AppError('Insufficient balance for this trade', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      wallet.cashBalanceBDT -= totalDebitBDT;
      await wallet.save({ session: mongoSession });

      let holding = await PortfolioHolding.findOne({ userId, symbol }).session(mongoSession);
      if (!holding) {
        holding = new PortfolioHolding({ userId, symbol, quantity: 0, averageBuyPriceBDT: 0 });
      }

      const newQuantity = holding.quantity + quantity;
      holding.averageBuyPriceBDT =
        (holding.quantity * holding.averageBuyPriceBDT + quantity * priceBDT) / newQuantity;
      holding.quantity = newQuantity;
      await holding.save({ session: mongoSession });

      const [transaction] = await Transaction.create(
        [
          {
            userId,
            symbol,
            side: 'buy',
            quantity,
            executionPriceBDT: priceBDT,
            feeBDT,
          },
        ],
        { session: mongoSession }
      );

      result = { wallet, holding, transaction };
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}

/**
 * Execute a market sell: atomically credits wallet cash, reduces the
 * user's holding, and books realized P/L against the average-cost basis.
 *
 * Requires MongoDB running as a replica set (transactions are not
 * supported on a standalone mongod).
 */
export async function executeSell(params) {
  const result = await executeSellTransaction(params);
  await evaluateAchievements(params.userId).catch((err) =>
    console.error('[achievements] evaluation failed:', err.message)
  );
  return result;
}

async function executeSellTransaction({ userId, symbol, quantity }) {
  assertValidSymbol(symbol);
  assertValidQuantity(quantity);

  const { priceBDT } = await resolveExecutionPrice(userId, symbol);
  const proceedsBDT = priceBDT * quantity;
  const feeBDT = proceedsBDT * TRADE_FEE_RATE;
  const netProceedsBDT = proceedsBDT - feeBDT;

  const mongoSession = await mongoose.startSession();
  try {
    let result;
    await mongoSession.withTransaction(async () => {
      const holding = await PortfolioHolding.findOne({ userId, symbol }).session(mongoSession);
      if (!holding || holding.quantity < quantity) {
        throw new AppError('Insufficient holdings for this trade', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const realizedPnlBDT = (priceBDT - holding.averageBuyPriceBDT) * quantity - feeBDT;
      holding.quantity -= quantity;
      holding.realizedPnlBDT += realizedPnlBDT;
      if (holding.quantity === 0) {
        holding.averageBuyPriceBDT = 0;
      }
      await holding.save({ session: mongoSession });

      const wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }
      wallet.cashBalanceBDT += netProceedsBDT;
      await wallet.save({ session: mongoSession });

      const user = await User.findById(userId).session(mongoSession);
      if (!user) {
        throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
      }
      user.winningStreakCount = realizedPnlBDT > 0 ? (user.winningStreakCount ?? 0) + 1 : 0;
      await user.save({ session: mongoSession });

      const [transaction] = await Transaction.create(
        [
          {
            userId,
            symbol,
            side: 'sell',
            quantity,
            executionPriceBDT: priceBDT,
            feeBDT,
          },
        ],
        { session: mongoSession }
      );

      result = { wallet, holding, transaction };
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}
