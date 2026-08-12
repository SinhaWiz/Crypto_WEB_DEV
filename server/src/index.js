import { createServer } from 'http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startHistoricalRefreshJob } from './jobs/historicalRefreshJob.js';

async function start() {
  await connectDB();
  startHistoricalRefreshJob();
  const app = createApp();
  const httpServer = createServer(app);

  httpServer.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
