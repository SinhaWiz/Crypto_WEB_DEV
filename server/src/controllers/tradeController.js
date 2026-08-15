import { executeBuy, executeSell } from '../services/tradeService.js';
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

export async function buy(req, res) {
  requireFields(req.body, ['symbol', 'quantity']);
  const { symbol, quantity } = req.body;

  const { wallet, holding, transaction } = await executeBuy({
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    quantity: Number(quantity),
  });

  res.status(201).json({ wallet, holding, transaction });
}

export async function sell(req, res) {
  requireFields(req.body, ['symbol', 'quantity']);
  const { symbol, quantity } = req.body;

  const { wallet, holding, transaction } = await executeSell({
    userId: req.user.id,
    symbol: symbol.toUpperCase(),
    quantity: Number(quantity),
  });

  res.status(201).json({ wallet, holding, transaction });
}
