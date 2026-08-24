import cron from 'node-cron';
import { syncLatestPrices } from '../services/coinService.js';
import { env } from '../config/env.js';

export const startHistoricalRefreshJob = () => {
  // Use CRON expression from env or default to once a minute. This used to
  // default to hourly, but real-mode users read this data as their live
  // price feed (see engine.js's generateNextTick 'real' branch) — an hourly
  // cadence made real mode look frozen between syncs and left any symbol
  // that failed the last sync (e.g. rate-limited) missing until the next
  // run. syncLatestPrices is a single batched CoinGecko call regardless of
  // how many users are online, so once a minute is still well within the
  // free-tier rate limit.
  const cronExpression = env.HISTORICAL_REFRESH_CRON || '0 * * * * *';

  cron.schedule(cronExpression, async () => {
    console.log(`[JOB] Running historicalRefreshJob at ${new Date().toISOString()}`);
    try {
      await syncLatestPrices();
      console.log(`[JOB] historicalRefreshJob completed successfully.`);
    } catch (error) {
      console.error(`[JOB] Error running historicalRefreshJob:`, error.message);
    }
  });
  
  console.log(`[JOB] historicalRefreshJob scheduled with expression: ${cronExpression}`);
};
