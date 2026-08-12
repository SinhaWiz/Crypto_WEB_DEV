import { fetchMarketData } from './coinGeckoProvider.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

/**
 * Sync latest prices from CoinGecko to the database
 */
export const syncLatestPrices = async () => {
  const data = await fetchMarketData(SUPPORTED_SYMBOLS);
  
  const timestamp = new Date();
  const records = data.map((coin) => ({
    symbol: coin.symbol,
    timestamp,
    price: coin.price,
    volume24h: coin.volume24h,
    marketCap: coin.marketCap,
    percentChange24h: coin.percentChange24h,
  }));

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
  
  return latestPrices;
};

/**
 * Get price history for a specific coin
 */
export const getCoinHistory = async (symbol, limit = 50) => {
  return await PriceHistory.find({ symbol })
    .sort({ timestamp: -1 })
    .limit(limit);
};
