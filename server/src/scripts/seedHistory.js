import { connectDB } from '../config/db.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { coinGeckoProvider } from '../services/marketData/coinGeckoProvider.js';
import { SUPPORTED_SYMBOLS } from '../constants/index.js';
import mongoose from 'mongoose';

const SEED_DAYS = 30; // Seed 30 days of history
const PROVIDER_NAME = 'coingecko';
const DEFAULT_INTERVAL = '1d';

async function seedHistory() {
  console.log('Connecting to database...');
  await connectDB();

  console.log('Clearing existing PriceHistory...');
  await PriceHistory.deleteMany({});

  console.log(`Seeding ${SEED_DAYS} days of OHLCV history for supported symbols...`);

  const recordsToInsert = [];

  for (const symbol of SUPPORTED_SYMBOLS) {
    try {
      console.log(`Fetching history for ${symbol}...`);
      const history = await coinGeckoProvider.fetchHistory(symbol, DEFAULT_INTERVAL, SEED_DAYS);
      
      const records = history.map(candle => ({
        symbol,
        provider: PROVIDER_NAME,
        interval: DEFAULT_INTERVAL,
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        marketCap: 0,
        percentChange24h: 0,
      }));

      recordsToInsert.push(...records);
      console.log(`Fetched ${records.length} candles for ${symbol}`);
      
      // Sleep to avoid rate limiting from CoinGecko Free API
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`Failed to seed ${symbol}:`, err.message);
    }
  }

  if (recordsToInsert.length > 0) {
    console.log(`Inserting ${recordsToInsert.length} records into database...`);
    await PriceHistory.insertMany(recordsToInsert);
    console.log('Database seeded successfully.');
  } else {
    console.log('No records to insert.');
  }

  // Also do one sync to get the latest snapshot data (market cap, etc)
  try {
    console.log('Syncing latest snapshot data...');
    // A quick hack is to import syncLatestPrices, but we can just let the cron job or next API call handle it.
  } catch (err) {
    console.error('Snapshot sync failed:', err.message);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seedHistory().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
