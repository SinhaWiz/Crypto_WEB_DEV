import mongoose from 'mongoose';
import { Wallet } from '../models/Wallet.js';
import { LeveragedPosition } from '../models/LeveragedPosition.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { evaluateAchievements } from './achievementService.js';
import { AppError } from '../utils/AppError.js';
import {
  ERROR_CODES,
  MAX_LEVERAGE,
  MIN_LEVERAGE,
  POSITION_SIDES,
  SUPPORTED_SYMBOLS,
  TRADE_FEE_RATE,
} from '../constants/index.js';
import { resolveExecutionPrice } from './tradeService.js';

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

function assertValidSide(side) {
  if (!POSITION_SIDES.includes(side)) {
    throw new AppError('Position side must be long or short', 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

function assertValidLeverage(leverage) {
  if (!Number.isInteger(leverage) || leverage < MIN_LEVERAGE || leverage > MAX_LEVERAGE) {
    throw new AppError(
      `Leverage must be an integer between ${MIN_LEVERAGE}x and ${MAX_LEVERAGE}x`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
}

function getSideMultiplier(side) {
  return side === 'long' ? 1 : -1;
}

async function getLivePriceBDT(userId, symbol) {
  const { priceBDT } = await resolveExecutionPrice(userId, symbol);
  return priceBDT;
}

function buildPositionSummary(position, currentPriceBDT) {
  const directionMultiplier = getSideMultiplier(position.side);
  const unrealizedPnlBDT =
    directionMultiplier * (currentPriceBDT - position.entryPriceBDT) * position.quantity * position.leverage;
  const unrealizedPnlPercent = position.marginBDT > 0 ? (unrealizedPnlBDT / position.marginBDT) * 100 : 0;
  const exposureBDT = currentPriceBDT * position.quantity * position.leverage;

  return {
    id: position._id,
    symbol: position.symbol,
    side: position.side,
    leverage: position.leverage,
    quantity: position.quantity,
    entryPriceBDT: position.entryPriceBDT,
    marginBDT: position.marginBDT,
    realizedPnlBDT: position.realizedPnlBDT,
    exposureBDT,
    currentPriceBDT,
    unrealizedPnlBDT,
    unrealizedPnlPercent,
    status: position.status,
    openedAt: position.openedAt,
    closedAt: position.closedAt,
  };
}

export async function getOpenPositions(userId) {
  const positions = await LeveragedPosition.find({ userId, status: 'open' }).sort({ createdAt: -1 });
  if (positions.length === 0) {
    return [];
  }

  const withPrices = await Promise.all(
    positions.map(async (position) => {
      const currentPriceBDT = await getLivePriceBDT(userId, position.symbol);
      return buildPositionSummary(position, currentPriceBDT);
    })
  );

  return withPrices;
}

export async function openLeveragedPosition(params) {
  const result = await openLeveragedPositionTransaction(params);
  await evaluateAchievements(params.userId).catch((err) =>
    console.error('[achievements] evaluation failed:', err.message)
  );
  return result;
}

async function openLeveragedPositionTransaction({ userId, symbol, side, quantity, leverage = 1 }) {
  assertValidSymbol(symbol);
  assertValidSide(side);
  assertValidQuantity(quantity);
  assertValidLeverage(leverage);

  const { priceBDT } = await resolveExecutionPrice(userId, symbol);
  const marginBDT = priceBDT * quantity;
  const notionalBDT = marginBDT * leverage;
  const openFeeBDT = notionalBDT * TRADE_FEE_RATE;
  const totalDebitBDT = marginBDT + openFeeBDT;

  const mongoSession = await mongoose.startSession();
  try {
    let result;
    await mongoSession.withTransaction(async () => {
      const wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }
      if (wallet.cashBalanceBDT < totalDebitBDT) {
        throw new AppError('Insufficient balance for this leveraged position', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const existingPosition = await LeveragedPosition.findOne({
        userId,
        symbol,
        side,
        status: 'open',
      }).session(mongoSession);
      if (existingPosition) {
        throw new AppError(
          `You already have an open ${side} position for ${symbol}. Close it before opening a new one.`,
          409,
          ERROR_CODES.CONFLICT
        );
      }

      wallet.cashBalanceBDT -= totalDebitBDT;
      await wallet.save({ session: mongoSession });

      const [position] = await LeveragedPosition.create(
        [
          {
            userId,
            symbol,
            side,
            leverage,
            quantity,
            entryPriceBDT: priceBDT,
            marginBDT,
            realizedPnlBDT: 0,
            status: 'open',
            openedAt: new Date(),
            closedAt: null,
          },
        ],
        { session: mongoSession }
      );

      const [transaction] = await Transaction.create(
        [
          {
            userId,
            symbol,
            side: side === 'long' ? 'buy' : 'sell',
            quantity,
            executionPriceBDT: priceBDT,
            feeBDT: openFeeBDT,
            marketType: 'position',
            positionSide: side,
            positionAction: 'open',
            leverage,
            marginBDT,
            pnlBDT: 0,
          },
        ],
        { session: mongoSession }
      );

      result = {
        wallet,
        position,
        transaction,
        priceBDT,
        marginBDT,
        notionalBDT,
        openFeeBDT,
      };
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}

export async function closeLeveragedPosition(params) {
  const result = await closeLeveragedPositionTransaction(params);
  await evaluateAchievements(params.userId).catch((err) =>
    console.error('[achievements] evaluation failed:', err.message)
  );
  return result;
}

async function closeLeveragedPositionTransaction({ userId, symbol, side, quantity }) {
  assertValidSymbol(symbol);
  assertValidSide(side);
  if (quantity !== undefined && quantity !== null) {
    assertValidQuantity(quantity);
  }

  const { priceBDT } = await resolveExecutionPrice(userId, symbol);
  const mongoSession = await mongoose.startSession();
  try {
    let result;
    await mongoSession.withTransaction(async () => {
      const position = await LeveragedPosition.findOne({
        userId,
        symbol,
        side,
        status: 'open',
      }).session(mongoSession);

      if (!position) {
        throw new AppError(`No open ${side} position found for ${symbol}`, 404, ERROR_CODES.NOT_FOUND);
      }

      const closeQuantity = quantity ?? position.quantity;
      if (closeQuantity > position.quantity) {
        throw new AppError(
          `You cannot close more ${symbol} quantity than is currently open`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      const quantityShare = closeQuantity / position.quantity;
      const closeMarginBDT = position.marginBDT * quantityShare;
      const notionalBDT = priceBDT * closeQuantity * position.leverage;
      const closeFeeBDT = notionalBDT * TRADE_FEE_RATE;
      const grossPnlBDT =
        getSideMultiplier(position.side) * (priceBDT - position.entryPriceBDT) * closeQuantity * position.leverage;
      const cappedGrossPnlBDT = Math.max(grossPnlBDT, -closeMarginBDT);
      const netCreditBDT = closeMarginBDT + cappedGrossPnlBDT - closeFeeBDT;

      const wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }

      wallet.cashBalanceBDT += netCreditBDT;
      await wallet.save({ session: mongoSession });

      position.quantity -= closeQuantity;
      position.marginBDT -= closeMarginBDT;
      position.realizedPnlBDT += cappedGrossPnlBDT;
      if (position.quantity === 0) {
        position.status = 'closed';
        position.closedAt = new Date();
        position.marginBDT = 0;
      }
      await position.save({ session: mongoSession });

      const user = await User.findById(userId).session(mongoSession);
      if (!user) {
        throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
      }
      user.winningStreakCount = cappedGrossPnlBDT > 0 ? (user.winningStreakCount ?? 0) + 1 : 0;
      await user.save({ session: mongoSession });

      const [transaction] = await Transaction.create(
        [
          {
            userId,
            symbol,
            side: side === 'long' ? 'sell' : 'buy',
            quantity: closeQuantity,
            executionPriceBDT: priceBDT,
            feeBDT: closeFeeBDT,
            marketType: 'position',
            positionSide: side,
            positionAction: 'close',
            leverage: position.leverage,
            marginBDT: closeMarginBDT,
            pnlBDT: cappedGrossPnlBDT,
          },
        ],
        { session: mongoSession }
      );

      result = {
        wallet,
        position,
        transaction,
        priceBDT,
        closedQuantity: closeQuantity,
        closeMarginBDT,
        closeFeeBDT,
        pnlBDT: cappedGrossPnlBDT,
        netCreditBDT,
      };
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}
