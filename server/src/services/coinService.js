import { coinGeckoProvider } from './marketData/coinGeckoProvider.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';
import { seededUnit } from './simulation/seededRandom.js';

const PROVIDER_NAME = 'coingecko';
const DEFAULT_INTERVAL = '1d';

/**
 * Sync latest prices from CoinGecko to the database.
 *
 * Only `close` (and volume/marketCap/percentChange24h) come from the real
 * CoinGecko snapshot — a single batched call. `open`/`high`/`low` are a small
 * seeded jitter around that real price rather than a second, per-symbol OHLC
 * fetch: it avoids 6 extra correlated CoinGecko calls every run and keeps
 * each coin's candle shape independent instead of tracking the same
 * real-market move together.
 */
export const syncLatestPrices = async () => {
  const snapshotData = await coinGeckoProvider.fetchLatest(SUPPORTED_SYMBOLS);
  const timestamp = new Date();

  const records = snapshotData.map((snapshot) => {
    const jitter = seededUnit(`hourly-ohlc:${snapshot.symbol}:${timestamp.getTime()}`);
    const range = snapshot.price * (0.001 + jitter * 0.004); // ~0.1%-0.5% synthetic intra-candle range

    return {
      symbol: snapshot.symbol,
      provider: PROVIDER_NAME,
      interval: DEFAULT_INTERVAL,
      timestamp,
      open: snapshot.price,
      high: snapshot.price + range,
      low: Math.max(0, snapshot.price - range),
      close: snapshot.price, // Close price is the exact current price
      volume: snapshot.volume24h,
      marketCap: snapshot.marketCap,
      percentChange24h: snapshot.percentChange24h,
    };
  });

  if (records.length > 0) {
    await PriceHistory.insertMany(records);
  }

  return records;
};

/**
 * Get the latest prices for all supported coins
 */
export const getLatestPrices = async () => {
  // Aggregate to get the latest record for each symbol
  const latestPrices = await PriceHistory.aggregate([
    { $match: { symbol: { $in: SUPPORTED_SYMBOLS } } },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$symbol',
        latestRecord: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$latestRecord' } },
  ]);
  
  // If no prices found in DB, try syncing from CoinGecko directly
  if (latestPrices.length === 0) {
    return await syncLatestPrices();
  }
  
  // Re-map `close` back to `price` for the frontend's compatibility if they expect `price`.
  // However, `price` is not on the schema anymore, `close` is. So we return `price: close`.
  return latestPrices.map(doc => ({
    ...doc,
    price: doc.close,
  }));
};

/**
 * Get price history for a specific coin
 */
export const getCoinHistory = async (symbol, limit = 50) => {
  const history = await PriceHistory.find({ symbol })
    .sort({ timestamp: -1 })
    .limit(limit);
    
  return history;
};

export const getSingleCoinSnapshot = async (symbol) => {
  const record = await PriceHistory.findOne({ symbol }).sort({ timestamp: -1 });
  if (record) {
    return { ...record.toObject(), price: record.close };
  }
  return null;
};
