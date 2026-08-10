import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';
import { buy, getPortfolio, listTransactions, sell } from '../services/tradeService.js';

function parseQuantity(value) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new AppError('Quantity must be greater than zero', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return quantity;
}

function parsePagination(query) {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 25;

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('page must be a positive integer', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError('limit must be an integer between 1 and 100', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  return { page, limit };
}

export async function buyCoin(req, res) {
  const result = await buy({
    userId: req.user.id,
    symbol: req.body.symbol,
    quantity: parseQuantity(req.body.quantity),
  });

  res.status(201).json(result);
}

export async function sellCoin(req, res) {
  const result = await sell({
    userId: req.user.id,
    symbol: req.body.symbol,
    quantity: parseQuantity(req.body.quantity),
  });

  res.status(201).json(result);
}

export async function showPortfolio(req, res) {
  const portfolio = await getPortfolio(req.user.id);
  res.json(portfolio);
}

export async function showTransactions(req, res) {
  const transactions = await listTransactions(req.user.id, parsePagination(req.query));
  res.json(transactions);
}
