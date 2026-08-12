import { getLatestPrices, getCoinHistory, syncLatestPrices, getSingleCoinSnapshot } from '../services/coinService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/index.js';

export const getPrices = asyncHandler(async (req, res) => {
  const prices = await getLatestPrices();
  res.json({ prices });
});

export const refreshPrices = asyncHandler(async (req, res) => {
  const prices = await syncLatestPrices();
  res.json({ message: 'Prices refreshed', prices });
});

export const getCoin = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const coin = await getSingleCoinSnapshot(symbol.toUpperCase());
  if (!coin) {
    throw new AppError('Coin not found', 404, ERROR_CODES.NOT_FOUND);
  }
  res.json({ coin });
});

export const getHistory = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const history = await getCoinHistory(symbol.toUpperCase());
  if (!history || history.length === 0) {
    throw new AppError(
      'No history found for symbol',
      404,
      ERROR_CODES.NOT_FOUND
    );
  }
  res.json({ history });
});
