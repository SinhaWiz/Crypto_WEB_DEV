import { closeLeveragedPosition, getOpenPositions, openLeveragedPosition } from '../services/positionService.js';
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

export async function openPosition(req, res) {
  requireFields(req.body, ['symbol', 'side', 'quantity']);
  const { symbol, side, quantity, leverage } = req.body;

  const { wallet, position, transaction } = await openLeveragedPosition({
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    side: String(side).toLowerCase(),
    quantity: Number(quantity),
    leverage: leverage === undefined || leverage === null ? 1 : Number(leverage),
  });

  res.status(201).json({ wallet, position, transaction });
}

export async function closePosition(req, res) {
  requireFields(req.body, ['symbol', 'side']);
  const { symbol, side, quantity } = req.body;

  const { wallet, position, transaction } = await closeLeveragedPosition({
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    side: String(side).toLowerCase(),
    quantity: quantity === undefined || quantity === null || quantity === '' ? undefined : Number(quantity),
  });

  res.status(201).json({ wallet, position, transaction });
}

export async function listPositions(req, res) {
  const positions = await getOpenPositions(req.user.id);
  res.json({ positions });
}
