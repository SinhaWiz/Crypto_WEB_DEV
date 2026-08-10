import mongoose from 'mongoose';
import { ERROR_CODES, SUPPORTED_SYMBOLS } from '../constants/index.js';
import { PortfolioHolding } from '../models/PortfolioHolding.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { Transaction } from '../models/Transaction.js';
import { Wallet } from '../models/Wallet.js';
import { AppError } from '../utils/AppError.js';
import { getAnchorPriceBDT, getLatestSimulatedPrice } from './simulation/engine.js';

const TRADE_FEE_RATE = 0.001;

function assertTradeInput(symbol, quantity) {
  const normalizedSymbol = symbol?.toUpperCase();

  if (!SUPPORTED_SYMBOLS.includes(normalizedSymbol)) {
    throw new AppError('Unsupported trading symbol', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return { symbol: normalizedSymbol, quantity };
}

export async function getCurrentSimulatedPrice(userId, symbol) {
  const session = await SimulationSession.findOne({ userId, status: 'active' });
  if (!session) {
    throw new AppError('Simulation session not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const latestTick = await getLatestSimulatedPrice(session._id, symbol);
  return latestTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));
}

export async function buy({ userId, symbol, quantity }) {
  const input = assertTradeInput(symbol, Number(quantity));
  const mongoSession = await mongoose.startSession();

  try {
    let result;

    await mongoSession.withTransaction(async () => {
      const executionPriceBDT = await getCurrentSimulatedPrice(userId, input.symbol);
      const grossCostBDT = executionPriceBDT * input.quantity;
      const feeBDT = grossCostBDT * TRADE_FEE_RATE;
      const totalCostBDT = grossCostBDT + feeBDT;
      const wallet = await Wallet.findOne({ userId }).session(mongoSession);

      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }

      if (wallet.cashBalanceBDT < totalCostBDT) {
        throw new AppError('Insufficient virtual BDT balance', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const holding =
        (await PortfolioHolding.findOne({ userId, symbol: input.symbol }).session(mongoSession)) ??
        new PortfolioHolding({ userId, symbol: input.symbol });
      const nextQuantity = holding.quantity + input.quantity;
      const nextCostBasis = holding.averageBuyPriceBDT * holding.quantity + grossCostBDT;

      holding.quantity = nextQuantity;
      holding.averageBuyPriceBDT = nextCostBasis / nextQuantity;
      wallet.cashBalanceBDT -= totalCostBDT;

      const transaction = await Transaction.create(
        [
          {
            userId,
            symbol: input.symbol,
            side: 'buy',
            quantity: input.quantity,
            executionPriceBDT,
            feeBDT,
          },
        ],
        { session: mongoSession }
      );

      await holding.save({ session: mongoSession });
      await wallet.save({ session: mongoSession });

      result = { wallet, holding, transaction: transaction[0] };
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}

export async function sell({ userId, symbol, quantity }) {
  const input = assertTradeInput(symbol, Number(quantity));
  const mongoSession = await mongoose.startSession();

  try {
    let result;

    await mongoSession.withTransaction(async () => {
      const executionPriceBDT = await getCurrentSimulatedPrice(userId, input.symbol);
      const grossProceedsBDT = executionPriceBDT * input.quantity;
      const feeBDT = grossProceedsBDT * TRADE_FEE_RATE;
      const netProceedsBDT = grossProceedsBDT - feeBDT;
      const wallet = await Wallet.findOne({ userId }).session(mongoSession);
      const holding = await PortfolioHolding.findOne({ userId, symbol: input.symbol }).session(mongoSession);

      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }

      if (!holding || holding.quantity < input.quantity) {
        throw new AppError('Insufficient simulated coin quantity', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const realizedPnlBDT = (executionPriceBDT - holding.averageBuyPriceBDT) * input.quantity - feeBDT;
      holding.quantity -= input.quantity;
      holding.realizedPnlBDT += realizedPnlBDT;
      if (holding.quantity === 0) {
        holding.averageBuyPriceBDT = 0;
      }
      wallet.cashBalanceBDT += netProceedsBDT;

      const transaction = await Transaction.create(
        [
          {
            userId,
            symbol: input.symbol,
            side: 'sell',
            quantity: input.quantity,
            executionPriceBDT,
            feeBDT,
          },
        ],
        { session: mongoSession }
      );

      await holding.save({ session: mongoSession });
      await wallet.save({ session: mongoSession });

      result = { wallet, holding, transaction: transaction[0] };
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}
