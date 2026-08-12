import { coinGeckoProvider } from './marketData/coinGeckoProvider.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const PROVIDER_NAME = 'coingecko';
const DEFAULT_INTERVAL = '1d';

/**
 * Sync latest prices from CoinGecko to the database
 */
export const syncLatestPrices = async () => {
  const [snapshotData, ohlcDataPromises] = await Promise.all([
    coinGeckoProvider.fetchLatest(SUPPORTED_SYMBOLS),
    Promise.all(SUPPORTED_SYMBOLS.map(symbol => coinGeckoProvider.fetchHistory(symbol, DEFAULT_INTERVAL, 1).then(history => ({ symbol, history }))))
  ]);

  const timestamp = new Date();
  
  const records = snapshotData.map((snapshot) => {
    // Find matching OHLC for this symbol
    const symbolOhlc = ohlcDataPromises.find(d => d.symbol === snapshot.symbol);
    
    // CoinGecko returns history chronologically, so the last item is the most recent
    const latestCandle = symbolOhlc && symbolOhlc.history.length > 0 
      ? symbolOhlc.history[symbolOhlc.history.length - 1] 
      : null;

    return {
      symbol: snapshot.symbol,
      provider: PROVIDER_NAME,
      interval: DEFAULT_INTERVAL,
      timestamp,
      open: latestCandle ? latestCandle.open : snapshot.price,
      high: latestCandle ? latestCandle.high : snapshot.price,
      low: latestCandle ? latestCandle.low : snapshot.price,
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
