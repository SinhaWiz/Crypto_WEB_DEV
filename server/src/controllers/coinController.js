import { AppError } from '../utils/AppError.js';
import { ERROR_CODES, SUPPORTED_SYMBOLS } from '../constants/index.js';
import { getLatestSnapshot, listLatestSnapshots, getHistory } from '../services/coinService.js';

const VALID_INTERVALS = ['5m', '1h', '1d'];
const MAX_HISTORY_LIMIT = 1000;

function assertValidSymbol(symbol) {
  const upper = symbol.toUpperCase();
  if (!SUPPORTED_SYMBOLS.includes(upper)) {
    throw new AppError(`Unsupported symbol "${symbol}"`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return upper;
}

function parseDateParam(value, label) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid ${label} date`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return date;
}

export async function listCoins(req, res) {
  const snapshots = await listLatestSnapshots();
  res.json({ coins: snapshots });
}

export async function getCoin(req, res) {
  const symbol = assertValidSymbol(req.params.symbol);
  const snapshot = await getLatestSnapshot(symbol);

  if (!snapshot) {
    throw new AppError(`No price data available for ${symbol}`, 404, ERROR_CODES.NOT_FOUND);
  }

  res.json({ coin: snapshot });
}

export async function getCoinHistory(req, res) {
  const symbol = assertValidSymbol(req.params.symbol);
  const { interval, from, to, limit } = req.query;

  if (interval && !VALID_INTERVALS.includes(interval)) {
    throw new AppError(`Invalid interval "${interval}"`, 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const parsedLimit = limit ? Number(limit) : undefined;
  if (parsedLimit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_HISTORY_LIMIT)) {
    throw new AppError(`limit must be an integer between 1 and ${MAX_HISTORY_LIMIT}`, 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const candles = await getHistory(symbol, {
    interval: interval || undefined,
    from: parseDateParam(from, 'from'),
    to: parseDateParam(to, 'to'),
    limit: parsedLimit,
  });

  res.json({ symbol, interval: interval || '1h', candles });
}
