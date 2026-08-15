import { createPrediction } from '../services/predictionService.js';
import { PredictionChallenge } from '../models/PredictionChallenge.js';
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

export async function placePrediction(req, res) {
  requireFields(req.body, ['symbol', 'direction', 'pointsStaked', 'durationMinutes']);
  const { symbol, direction, pointsStaked, durationMinutes } = req.body;

  const { prediction, wallet } = await createPrediction({
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    direction,
    pointsStaked: Number(pointsStaked),
    durationMinutes: Number(durationMinutes),
  });

  res.status(201).json({ prediction, wallet });
}

export async function getPredictionHistory(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [predictions, total] = await Promise.all([
    PredictionChallenge.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PredictionChallenge.countDocuments({ userId: req.user.id }),
  ]);

  res.json({
    predictions,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
