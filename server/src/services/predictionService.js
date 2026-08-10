import mongoose from 'mongoose';
import { ERROR_CODES, SUPPORTED_SYMBOLS } from '../constants/index.js';
import { PredictionChallenge } from '../models/PredictionChallenge.js';
import { Wallet } from '../models/Wallet.js';
import { AppError } from '../utils/AppError.js';
import { evaluateAchievements } from './achievementService.js';
import { getCurrentSimulatedPrice } from './tradeService.js';

const DEFAULT_DURATION_MINUTES = 5;
const MIN_STAKE = 1;
const MAX_STAKE = 10000;

function parsePredictionInput({ symbol, direction, pointsStaked, durationMinutes = DEFAULT_DURATION_MINUTES }) {
  const normalizedSymbol = symbol?.toUpperCase();
  const stake = Number(pointsStaked);
  const duration = Number(durationMinutes);

  if (!SUPPORTED_SYMBOLS.includes(normalizedSymbol)) {
    throw new AppError('Unsupported prediction symbol', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!['up', 'down'].includes(direction)) {
    throw new AppError('Prediction direction must be up or down', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!Number.isInteger(stake) || stake < MIN_STAKE || stake > MAX_STAKE) {
    throw new AppError(`pointsStaked must be an integer between ${MIN_STAKE} and ${MAX_STAKE}`, 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
    throw new AppError('durationMinutes must be an integer between 1 and 1440', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return { symbol: normalizedSymbol, direction, pointsStaked: stake, durationMinutes: duration };
}

export async function createPrediction(userId, input) {
  const parsed = parsePredictionInput(input);
  const mongoSession = await mongoose.startSession();

  try {
    let prediction;

    await mongoSession.withTransaction(async () => {
      const wallet = await Wallet.findOne({ userId }).session(mongoSession);
      if (!wallet) {
        throw new AppError('Wallet not found', 404, ERROR_CODES.NOT_FOUND);
      }

      if (wallet.virtualPoints < parsed.pointsStaked) {
        throw new AppError('Insufficient virtual points', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const startPriceBDT = await getCurrentSimulatedPrice(userId, parsed.symbol);
      wallet.virtualPoints -= parsed.pointsStaked;
      await wallet.save({ session: mongoSession });

      const [created] = await PredictionChallenge.create(
        [
          {
            userId,
            symbol: parsed.symbol,
            direction: parsed.direction,
            pointsStaked: parsed.pointsStaked,
            startPriceBDT,
            closesAt: new Date(Date.now() + parsed.durationMinutes * 60 * 1000),
          },
        ],
        { session: mongoSession }
      );
      prediction = created;
    });

    await evaluateAchievements(userId);
    return prediction;
  } finally {
    await mongoSession.endSession();
  }
}

export async function settlePrediction(prediction) {
  if (prediction.result !== 'pending' || prediction.closesAt > new Date()) return prediction;

  const mongoSession = await mongoose.startSession();

  try {
    let settled;

    await mongoSession.withTransaction(async () => {
      const current = await PredictionChallenge.findById(prediction._id).session(mongoSession);
      if (!current || current.result !== 'pending') {
        settled = current;
        return;
      }

      const endPriceBDT = await getCurrentSimulatedPrice(current.userId, current.symbol);
      const movedUp = endPriceBDT > current.startPriceBDT;
      const movedDown = endPriceBDT < current.startPriceBDT;
      const won = (current.direction === 'up' && movedUp) || (current.direction === 'down' && movedDown);
      const refunded = endPriceBDT === current.startPriceBDT;
      const wallet = await Wallet.findOne({ userId: current.userId }).session(mongoSession);

      current.endPriceBDT = endPriceBDT;
      current.result = refunded ? 'refunded' : won ? 'won' : 'lost';

      if (wallet && (won || refunded)) {
        wallet.virtualPoints += refunded ? current.pointsStaked : current.pointsStaked * 2;
        await wallet.save({ session: mongoSession });
      }

      await current.save({ session: mongoSession });
      settled = current;
    });

    if (settled?.userId) {
      await evaluateAchievements(settled.userId);
    }

    return settled;
  } finally {
    await mongoSession.endSession();
  }
}

export async function settleDuePredictions(now = new Date()) {
  const duePredictions = await PredictionChallenge.find({ result: 'pending', closesAt: { $lte: now } }).limit(500);
  return Promise.all(duePredictions.map((prediction) => settlePrediction(prediction)));
}

export async function listPredictionHistory(userId) {
  return PredictionChallenge.find({ userId }).sort({ createdAt: -1 }).limit(100);
}
