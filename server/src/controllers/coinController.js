import {
  getLatestPrices,
  getCoinHistory as fetchCoinHistoryFromDB,
  syncLatestPrices,
  getSingleCoinSnapshot,
} from '../services/coinService.js';
import { getUserPriceProvider } from '../services/priceModeService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES, SUPPORTED_SYMBOLS, BDT_PER_USD } from '../constants/index.js';

function assertValidSymbol(symbol) {
  const upper = symbol.toUpperCase();
  if (!SUPPORTED_SYMBOLS.includes(upper)) {
    throw new AppError(`Unsupported symbol "${symbol}"`, 400, ERROR_CODES.VALIDATION_ERROR);
  }
  return upper;
}

/**
 * Map a raw PriceHistory document to the public coin snapshot shape.
 * Converts USD close price to BDT for consistency with the simulation engine.
 */
function toPublicCoin(doc) {
  const usdPrice = doc.close ?? doc.price ?? 0;
  return {
    symbol: doc.symbol,
    priceBDT: usdPrice * BDT_PER_USD,
    priceUSD: usdPrice,
    percentChange24h: doc.percentChange24h ?? null,
    volume24h: doc.volume ?? null,
    marketCap: doc.marketCap ?? null,
    timestamp: doc.timestamp,
  };
}

/**
 * GET /api/coins — latest snapshot for all 6 supported symbols.
 */
export const listCoins = asyncHandler(async (req, res) => {
  const provider = await getUserPriceProvider(req.user?.id);
  const prices = await getLatestPrices(provider);
  const coins = prices.map(toPublicCoin);
  res.json({ coins });
});

/**
 * GET /api/coins/:symbol — latest snapshot for a single symbol.
 */
export const getCoin = asyncHandler(async (req, res) => {
  const symbol = assertValidSymbol(req.params.symbol);
  const provider = await getUserPriceProvider(req.user?.id);
  const doc = await getSingleCoinSnapshot(symbol, provider);
  if (!doc) {
    throw new AppError(`No price data available for ${symbol}`, 404, ERROR_CODES.NOT_FOUND);
  }
  res.json({ coin: toPublicCoin(doc) });
});

/**
 * GET /api/coins/:symbol/history — historical candles for a symbol (sorted oldest-first, in BDT).
 */
export const getHistory = asyncHandler(async (req, res) => {
  const symbol = assertValidSymbol(req.params.symbol);
  const provider = await getUserPriceProvider(req.user?.id);
  const raw = await fetchCoinHistoryFromDB(symbol, 50, provider);
  if (!raw || raw.length === 0) {
    throw new AppError(`No history found for ${symbol}`, 404, ERROR_CODES.NOT_FOUND);
  }
  const candles = raw
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((doc) => ({
      timestamp: doc.timestamp,
      open: (doc.open ?? doc.close ?? 0) * BDT_PER_USD,
      high: (doc.high ?? doc.close ?? 0) * BDT_PER_USD,
      low: (doc.low ?? doc.close ?? 0) * BDT_PER_USD,
      close: (doc.close ?? 0) * BDT_PER_USD,
      volume: doc.volume ?? null,
    }));
  res.json({ symbol, candles });
});

/**
 * POST /api/coins/refresh — manually trigger a CoinGecko sync.
 */
export const refreshPrices = asyncHandler(async (req, res) => {
  const prices = await syncLatestPrices();
  res.json({ message: 'Prices refreshed', count: prices.length });
});
