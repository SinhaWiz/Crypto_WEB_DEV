import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startHistoricalRefreshJob } from './jobs/historicalRefreshJob.js';
import { startSimulationTickJob } from './jobs/simulationTickJob.js';
import { startPredictionSettlementJob } from './jobs/predictionSettlementJob.js';
import { registerMarketSocketHandlers } from './socket/marketSocket.js';

async function start() {
  await connectDB();

  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  // Register socket authentication + event handlers
  registerMarketSocketHandlers(io);

  // Start background jobs (pass io to the tick job for emissions)
  startSimulationTickJob(io);
  startPredictionSettlementJob();

  httpServer.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
    startHistoricalRefreshJob();
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
