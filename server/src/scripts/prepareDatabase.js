import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { refreshHistoricalPrices } from '../jobs/historicalRefreshJob.js';
import '../models/Achievement.js';
import '../models/Notification.js';
import '../models/PortfolioHolding.js';
import '../models/PredictionChallenge.js';
import '../models/PriceHistory.js';
import '../models/SimulatedPriceTick.js';
import '../models/SimulationSession.js';
import '../models/Transaction.js';
import '../models/User.js';
import '../models/Wallet.js';

async function syncModelIndexes() {
  const modelNames = mongoose.modelNames();

  for (const modelName of modelNames) {
    const model = mongoose.model(modelName);
    await model.syncIndexes();
    console.log(`Synced indexes for ${modelName}`);
  }
}

async function main() {
  if (process.argv.includes('--help')) {
    console.log('Usage: npm run db:prepare -- [--seed-history]');
    return;
  }

  const shouldSeedHistory = process.argv.includes('--seed-history');

  await connectDB();
  console.log('Preparing database indexes...');
  await syncModelIndexes();

  if (shouldSeedHistory) {
    console.log('Seeding historical price data...');
    await refreshHistoricalPrices();
  }

  console.log('Database preparation complete.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Database preparation failed:', err);
  process.exit(1);
});
