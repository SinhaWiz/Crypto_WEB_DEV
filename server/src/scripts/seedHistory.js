import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { refreshHistoricalPrices } from '../jobs/historicalRefreshJob.js';

async function main() {
  await connectDB();
  console.log('Seeding historical price data...');
  await refreshHistoricalPrices();
  console.log('Historical price data seeded.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed to seed historical price data:', err);
  process.exit(1);
});
