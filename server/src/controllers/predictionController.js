import { createPrediction } from '../services/predictionService.js';
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
