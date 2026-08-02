import { PriceHistory } from '../models/PriceHistory.js';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getLatestSnapshot(symbol) {
  const latest = await PriceHistory.findOne({ symbol }).sort({ timestamp: -1 });
  if (!latest) {
    return null;
  }

  const dayAgo = new Date(latest.timestamp.getTime() - DAY_MS);
  const reference = await PriceHistory.findOne({ symbol, timestamp: { $lte: dayAgo } }).sort({
    timestamp: -1,
  });

  const changePercent24h = reference ? ((latest.close - reference.close) / reference.close) * 100 : null;

  return {
    symbol,
    price: latest.close,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    close: latest.close,
    volume: latest.volume,
    timestamp: latest.timestamp,
    changePercent24h,
  };
}

export async function listLatestSnapshots() {
  const snapshots = await Promise.all(SUPPORTED_SYMBOLS.map((symbol) => getLatestSnapshot(symbol)));
  return snapshots.filter(Boolean);
}

export async function getHistory(symbol, { interval = '1h', from, to, limit = 500 } = {}) {
  const query = { symbol, interval };

  if (from || to) {
    query.timestamp = {};
    if (from) query.timestamp.$gte = from;
    if (to) query.timestamp.$lte = to;
  }

  return PriceHistory.find(query).sort({ timestamp: 1 }).limit(limit);
}
