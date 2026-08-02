import cron from 'node-cron';
import { env } from '../config/env.js';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';
import { getMarketDataAdapter } from '../services/marketData/adapter.js';
import { PriceHistory } from '../models/PriceHistory.js';
import '../services/marketData/coinGeckoProvider.js';

const INTERVAL = '1h';
const REQUEST_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function refreshHistoricalPrices() {
  const providerName = env.MARKET_DATA_PROVIDER || 'coingecko';
  const adapter = getMarketDataAdapter(providerName);

  for (const symbol of SUPPORTED_SYMBOLS) {
    try {
      const candles = await adapter.fetchHistory({ symbol, interval: INTERVAL, range: {} });

      const operations = candles.map((candle) => ({
        updateOne: {
          filter: {
            symbol: candle.symbol,
            provider: adapter.name,
            interval: INTERVAL,
            timestamp: candle.timestamp,
          },
          update: {
            $set: {
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            },
          },
          upsert: true,
        },
      }));

      if (operations.length > 0) {
        await PriceHistory.bulkWrite(operations, { ordered: false });
      }
    } catch (err) {
      // Keep previously cached candles for this symbol; a provider
      // outage/rate-limit on one symbol shouldn't abort the whole refresh.
      console.error(`Historical refresh failed for ${symbol}:`, err.message);
    }

    await sleep(REQUEST_DELAY_MS);
  }
}

export function startHistoricalRefreshJob() {
  if (!env.HISTORICAL_REFRESH_CRON) {
    return null;
  }

  return cron.schedule(env.HISTORICAL_REFRESH_CRON, () => {
    refreshHistoricalPrices().catch((err) => {
      console.error('Historical refresh job failed:', err);
    });
  });
}
