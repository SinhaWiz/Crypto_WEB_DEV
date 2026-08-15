import mongoose from 'mongoose';
import { PredictionChallenge } from '../models/PredictionChallenge.js';
import { Wallet } from '../models/Wallet.js';
import { SimulationSession } from '../models/SimulationSession.js';
import { getLatestSimulatedPrice, getAnchorPriceBDT } from './simulation/engine.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES, SUPPORTED_SYMBOLS } from '../constants/index.js';

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 24 * 60;

function assertValidSymbol(symbol) {
  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    throw new AppError(`Unsupported symbol "${symbol}"`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

function assertValidDirection(direction) {
  if (!['up', 'down'].includes(direction)) {
    throw new AppError('Direction must be "up" or "down"', 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

function assertValidPointsStaked(pointsStaked) {
  if (typeof pointsStaked !== 'number' || !Number.isFinite(pointsStaked) || pointsStaked <= 0) {
    throw new AppError('Points staked must be a positive number', 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

function assertValidDuration(durationMinutes) {
  if (
    typeof durationMinutes !== 'number' ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes < MIN_DURATION_MINUTES ||
    durationMinutes > MAX_DURATION_MINUTES
  ) {
    throw new AppError(
      `Duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes`,
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
}

/**
 * Resolve the current live price (BDT) for a symbol against the user's
 * own simulation session — predictions, like trades, are always judged
 * against the acting user's own simulated price path.
 */
async function resolveLivePriceBDT(userId, symbol) {
  const session = await SimulationSession.findOne({ userId, status: 'active' });
  if (!session) {
    throw new AppError('No active simulation session for this user', 409, ERROR_CODES.CONFLICT);
  }
  const latestTick = await getLatestSimulatedPrice(session._id, symbol);
  return latestTick?.priceBDT ?? (await getAnchorPriceBDT(symbol));
}

/**
 * Create a prediction challenge: atomically deducts the staked virtual
 * points from the wallet and records the challenge at the current
 * simulated price, to be resolved later by the settlement job.
 */
export async function createPrediction({ userId, symbol, direction, pointsStaked, durationMinutes }) {
  assertValidSymbol(symbol);
  assertValidDirection(direction);
  assertValidPointsStaked(pointsStaked);
  assertValidDuration(durationMinutes);

  const startPriceBDT = await resolveLivePriceBDT(userId, symbol);
  const closesAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  const mongoSession = await mongoose.startSession();
  try {
    let result;
    await mongoSession.withTransaction(async () => {
      const wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }
      if (wallet.virtualPoints < pointsStaked) {
        throw new AppError('Insufficient virtual points for this prediction', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      wallet.virtualPoints -= pointsStaked;
      await wallet.save({ session: mongoSession });

      const [prediction] = await PredictionChallenge.create(
        [{ userId, symbol, direction, pointsStaked, startPriceBDT, closesAt }],
        { session: mongoSession }
      );

      result = { prediction, wallet };
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}
