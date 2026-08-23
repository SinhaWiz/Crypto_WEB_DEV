import { connectDB } from '../config/db.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { coinGeckoProvider } from '../services/marketData/coinGeckoProvider.js';
import { generateSyntheticHistory } from '../services/simulation/syntheticHistory.js';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';
import mongoose from 'mongoose';

const SEED_DAYS = 30; // Seed 30 days of history
const PROVIDER_NAME = 'synthetic';
const DEFAULT_INTERVAL = '1d';

// Fallback USD anchors if the live CoinGecko fetch is unavailable (offline dev, rate limit).
const FALLBACK_USD_ANCHORS = {
  BTC: 65000,
  ETH: 3500,
  SOL: 150,
  DOGE: 0.14,
  XRP: 0.6,
  BNB: 600,
};

async function seedHistory() {
  console.log('Connecting to database...');
  await connectDB();

  console.log('Clearing existing PriceHistory...');
  await PriceHistory.deleteMany({});

  console.log('Fetching current prices from CoinGecko to anchor the history...');
  let snapshots = {};
  try {
    const latest = await coinGeckoProvider.fetchLatest(SUPPORTED_SYMBOLS);
    snapshots = Object.fromEntries(latest.map((coin) => [coin.symbol, coin]));
  } catch (err) {
    console.error('Could not fetch live anchors, falling back to defaults:', err.message);
  }

  console.log(`Generating ${SEED_DAYS} days of synthetic per-coin history, anchored to real current prices...`);

  const recordsToInsert = [];

  for (const symbol of SUPPORTED_SYMBOLS) {
    const snapshot = snapshots[symbol];
    const anchorPriceUsd = snapshot?.price ?? FALLBACK_USD_ANCHORS[symbol] ?? 100;
    const candles = generateSyntheticHistory(symbol, { days: SEED_DAYS, anchorPriceUsd });

    recordsToInsert.push(
      ...candles.map((candle, i) => {
        // Only the most recent candle is "now" — that's the one getLatestPrices()
        // reads, so it should carry the real snapshot stats. Older candles are
        // pure history filler and don't need a real 24h-change figure.
        const isLatest = i === candles.length - 1;

        return {
          symbol,
          provider: PROVIDER_NAME,
          interval: DEFAULT_INTERVAL,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: isLatest ? (snapshot?.volume24h ?? 0) : candle.volume,
          marketCap: isLatest ? (snapshot?.marketCap ?? 0) : 0,
          percentChange24h: isLatest ? (snapshot?.percentChange24h ?? 0) : 0,
        };
      }),
    );

    console.log(`Generated ${candles.length} candles for ${symbol}, anchored at $${anchorPriceUsd.toFixed(4)}`);
  }

  if (recordsToInsert.length > 0) {
    console.log(`Inserting ${recordsToInsert.length} records into database...`);
    await PriceHistory.insertMany(recordsToInsert);
    console.log('Database seeded successfully.');
  } else {
    console.log('No records to insert.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seedHistory().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
